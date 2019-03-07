import { Connection } from './ws';
import {
  ChangeMessage,
  MessageType,
  RejectCode,
  ResponseMessage,
  StateMessage,
} from '@collabodux/messages';
import { JSONObject } from 'json-diff3';
import { Subscriber, SubscriberChannel } from './subscriber-channel';
import { PatchStateManager } from './patch-state-manager';
import { Undo, UndoManager } from './undo-manager';
import { SessionManager } from './session-manager';

export type Validate<State, RawState = JSONObject> = (raw?: RawState) => State;
export type Merger<State> = (base: State, local: State, remote: State) => State;

export type SessionData = {
  session: string | undefined;
  sessions: string[];
};

export { Connection, Undo };

export type UndoMerger<State, Metadata> = (
  undo: Undo<State, Metadata>,
  metadata: Metadata,
) => boolean;

export class Collabodux<
  State extends RawState,
  RawState extends JSONObject,
  EditMetadata
> {
  private _sendingChanges = false;
  private state: PatchStateManager<State, RawState>;
  private undos: UndoManager<State, EditMetadata>;

  private _localStateSubscribers = new SubscriberChannel<State>();
  private _sessions = new SessionManager();

  constructor(
    private connection: Connection,
    normalize: Validate<State, RawState>,
    mergeState: Merger<State>,
    private mergeEdit?: UndoMerger<State, EditMetadata>,
    private bufferTimeMs: number = 1000 / 25, // send events at 25 fps
  ) {
    this.connection.onResponseMessage = this._onResponseMessage;
    this.connection.onClose = this._onClose;
    this.state = new PatchStateManager(normalize, mergeState);
    this.undos = new UndoManager(mergeState);
  }
  get ready(): boolean {
    return this.state.hasRemote;
  }
  private _onClose(): void {}

  get localState(): State {
    return this.state.local;
  }

  get currentSession(): string | undefined {
    return this._sessions.currentSession;
  }

  get sessions(): string[] {
    return this._sessions.sessions;
  }

  subscribeLocalState(subscriber: Subscriber<State>): () => void {
    subscriber(this.state.local);
    return this._localStateSubscribers.subscribe(subscriber);
  }

  subscribeSessions(subscriber: Subscriber<SessionData>): () => void {
    return this._sessions.subscribe(subscriber);
  }

  get hasUndo(): boolean {
    return this.undos.nextUndo !== undefined;
  }

  get hasRedo(): boolean {
    return this.undos.nextRedo !== undefined;
  }

  undo() {
    if (this.state.setLocal(this.undos.undo(this.state.local))) {
      this._localStateChanged();
    }
  }

  redo() {
    if (this.state.setLocal(this.undos.redo(this.state.local))) {
      this._localStateChanged();
    }
  }

  setLocalState(newState: State, editMetadata?: EditMetadata): void {
    const priorState = this.state.local;
    if (this.state.setLocal(newState)) {
      if (editMetadata !== undefined) {
        const { nextUndo } = this.undos;
        const mergeEdit = this.mergeEdit;
        this.undos.trackEdit(
          priorState,
          newState,
          editMetadata,
          mergeEdit && nextUndo ? mergeEdit(nextUndo, editMetadata) : false,
        );
      }
      this._localStateChanged();
    }
  }
  private _onResponseMessage = (message: ResponseMessage): void => {
    switch (message.type) {
      case MessageType.state:
        this.onStateMessage(message);
        break;

      case MessageType.change:
        this.onChangeMessage(message);
        break;

      case MessageType.join:
        this._sessions.addSession(message.session);
        break;

      case MessageType.leave:
        this._sessions.removeSession(message.session);
        break;

      default:
        console.warn(`unexpected message type "${message.type}"`);
        break;
    }
  };

  private onStateMessage({
    state,
    session,
    sessions,
    vtag,
  }: StateMessage): void {
    const changed = this.state.mergeRemote(state, vtag);
    this._sessions.setSessions(session, sessions);
    if (changed) {
      this._localStateChanged();
    }
  }

  private onChangeMessage({ patches, vtag }: ChangeMessage): void {
    if (this.state.patchRemote(patches, vtag)) {
      this._localStateChanged();
    }
  }
  private _localStateChanged() {
    if (!this._sendingChanges) {
      this._sendingChanges = true;
      setTimeout(this._sendNextPendingChange, this.bufferTimeMs);
    }
    this._localStateSubscribers.send(this.state.local);
  }

  private _sendNextPendingChange = async (): Promise<void> => {
    this._sendingChanges = false;
    const local = this.state.local;
    const patches = this.state.getLocalPatches();
    if (patches.length === 0) {
      // nothing changed
      return;
    }
    const response = await this.connection.requestChange(
      this.state.vtag,
      patches,
    );
    switch (response.type) {
      case MessageType.reject:
        console.debug(`Change rejected (${response.code})`);
        switch (response.code) {
          case RejectCode.outdated:
            // We're out of sync, just wait for next ChangeMessage from server
            break;
          case RejectCode.badRequest:
          case RejectCode.permission:
          case RejectCode.internal:
          default:
            throw new Error(
              `server rejected (${response.code}): ${response.reason}`,
            );
        }
        break;

      case MessageType.accept:
        this.state.acceptLocalChanges(local, response.vtag);
        this._localStateChanged();
        break;
    }
  };
}
