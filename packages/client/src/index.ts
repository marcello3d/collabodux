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

export type Validate<State, RawState = JSONObject> = (raw?: RawState) => State;
export type Merger<State> = (base: State, local: State, remote: State) => State;

export type SessionData = {
  session: string | undefined;
  sessions: string[];
};

export { Connection };

export class Collabodux<
  State extends RawState,
  RawState extends JSONObject = JSONObject
> {
  private _sendingChanges = false;
  private state: PatchStateManager<State, RawState>;

  private _localStateSubscribers = new SubscriberChannel<State>();
  private _sessionsStateSubscribers = new SubscriberChannel<SessionData>();
  private _sessions: string[] = [];
  private _sessionSet = new Set<string>();
  private _session: string | undefined = undefined;

  constructor(
    private connection: Connection,
    normalize: Validate<State, RawState>,
    mergeState: Merger<State>,
    private bufferTimeMs: number = 1000 / 25, // send events at 25 fps
  ) {
    this.connection.onResponseMessage = this._onResponseMessage;
    this.connection.onClose = this._onClose;
    this.state = new PatchStateManager(normalize, mergeState);
  }
  get ready(): boolean {
    return this.state.hasRemote;
  }
  private _onClose(): void {}

  get localState(): State {
    return this.state.local;
  }

  get session(): string | undefined {
    return this._session;
  }

  get sessions(): string[] {
    return this._sessions;
  }

  subscribeLocalState(subscriber: Subscriber<State>): () => void {
    subscriber(this.state.local);
    return this._localStateSubscribers.subscribe(subscriber);
  }

  subscribeSessions(subscriber: Subscriber<SessionData>): () => void {
    subscriber(this._sessionData());
    return this._sessionsStateSubscribers.subscribe(subscriber);
  }

  private _sessionData(): SessionData {
    return {
      session: this._session,
      sessions: this._sessions,
    };
  }
  setLocalState(newState: State) {
    if (this.state.setLocal(newState)) {
      this._localStateChanged();
    }
  }
  private _sendSessionState() {
    this._sessions = Array.from(this._sessionSet).sort();
    this._sessionsStateSubscribers.send(this._sessionData());
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
        this._sessionSet.add(message.session);
        this._sendSessionState();
        break;

      case MessageType.leave:
        this._sessionSet.delete(message.session);
        this._sendSessionState();
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
    this._session = session;
    this._sessionSet = new Set(sessions);
    this._sendSessionState();
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
