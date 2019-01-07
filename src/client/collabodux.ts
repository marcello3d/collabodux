import { Connection } from './ws';
import {
  ChangeMessage,
  MessageType,
  ResponseMessage,
  StateMessage,
} from '../shared/messages';

export type PatchReducer<State, Action, Patch> = (
  state: State,
  action: Action,
) => Patch[];

export type PatchApplier<State, Patch> = (
  state: State,
  patches: Patch[],
) => State;

export type Subscriber<State> = (newState: State) => void;
export type LoadStateActionProducer<Action> = (externalState: any) => Action;
export type PatchCompressor<State, Patch> = (
  state: State,
  patches: Patch[],
) => Patch[];

export class Collabodux<State, Action, Patch> {
  private pendingActions: Action[] = [];
  private pendingPatches: Patch[] = [];
  private serverState: State | undefined = undefined;
  private vtag!: string;
  private _localState: State = {} as State;

  private subscribers = new Set<Subscriber<State>>();
  private _sessions: string[] = [];
  private _sessionSet = new Set<string>();
  private _session: string | undefined = undefined;

  constructor(
    private connection: Connection<Patch>,
    private loadStateAction: LoadStateActionProducer<Action>,
    private reducer: PatchReducer<State, Action, Patch>,
    private applyPatches: PatchApplier<State, Patch>,
    private compressPatches: PatchCompressor<State, Patch> = (
      state: State,
      patches: Patch[],
    ) => patches,
    private bufferTimeMs: number = 1000 / 25, // send events at 25 fps
  ) {
    this.connection.onResponseMessage = this.onResponseMessage;
    this._localState = applyPatches(
      this._localState,
      reducer(this._localState, loadStateAction({})),
    );
  }

  get localState(): State {
    return this._localState;
  }

  get session(): string | undefined {
    return this._session;
  }

  get sessions(): string[] {
    return this._sessions;
  }

  subscribe(subscriber: Subscriber<State>): () => void {
    if (!this.subscribers.has(subscriber)) {
      subscriber(this._localState);
      this.subscribers.add(subscriber);
      return () => this.subscribers.delete(subscriber);
    }
    return () => {};
  }

  private updateSubscribers(): void {
    this.subscribers.forEach((subscriber) => subscriber(this._localState!));
  }

  propose(action: Action): void {
    if (this._propose(action)) {
      if (this.pendingActions.length === 1 && this.serverState !== undefined) {
        this.sendPendingChanges();
      }
      this.updateSubscribers();
    }
  }

  // Propose without notifying subscribers
  private _propose(action: Action): boolean {
    const state = this._localState;
    const patches = this.reducer(state, action);
    console.log('propose', action, 'patches', patches);
    if (patches.length === 0) {
      return false;
    }
    this._localState = this.applyPatches(state, patches);
    this.pendingActions.push(action);
    this.pendingPatches.push(...patches);
    return true;
  }

  private updateSessionsArray() {
    this._sessions = Array.from(this._sessionSet).sort();
  }

  onResponseMessage = (message: ResponseMessage<Patch>): void => {
    switch (message.type) {
      case MessageType.state:
        this.onStateMessage(message);
        break;

      case MessageType.change:
        this.onChangeMessage(message);
        break;

      case MessageType.join:
        this._sessionSet.add(message.session);
        this.updateSessionsArray();
        break;

      case MessageType.leave:
        this._sessionSet.delete(message.session);
        this.updateSessionsArray();
        break;
    }
    this.updateSubscribers();
  };

  private onStateMessage({
    state,
    session,
    sessions,
    vtag,
  }: StateMessage): void {
    const firstState = this.serverState === undefined;
    this.serverState = state;
    this.vtag = vtag;
    this._session = session;
    this._sessionSet = new Set(sessions);
    this.updateSessionsArray();
    this.replayPendingActions(true);
  }

  private onChangeMessage({ patches, vtag }: ChangeMessage<Patch>): void {
    if (this.serverState === undefined) {
      throw new Error('in bad state');
    }
    this.serverState = this.applyPatches(this.serverState, patches);
    this.vtag = vtag;
    // TODO: we can look at patches and see if it conflicts with any patches in pendingPatches
    this.replayPendingActions(false);
  }

  private replayPendingActions(reloadState: boolean): void {
    const { pendingActions } = this;
    this._localState = this.serverState as State;
    this.pendingActions = [];
    this.pendingPatches = [];
    if (reloadState) {
      this._propose(this.loadStateAction(this.serverState));
    }
    pendingActions.forEach((action) => {
      try {
        this._propose(action);
      } catch (e) {
        console.warn(
          `Dropped action ${action}, it could not be applied anymore: ${e}`,
        );
      }
    });
    if (reloadState) {
      this.sendPendingChanges();
      this.updateSubscribers();
    }
  }

  private sendPendingChanges() {
    if (this.pendingActions.length > 0) {
      setTimeout(this.sendNextPendingChange, this.bufferTimeMs);
    }
  }
  private sendNextPendingChange = async (): Promise<void> => {
    const { pendingActions, pendingPatches } = this;
    const actionCountBeforeSend = pendingActions.length;
    const patchCountBeforeSend = pendingPatches.length;
    const compressPatches = this.compressPatches(
      this.serverState!,
      pendingPatches,
    );
    const response = await this.connection.requestChange(
      this.vtag,
      compressPatches,
    );
    switch (response.type) {
      case MessageType.reject:
        console.warn('Change rejected; outdated');
        // We're out of sync, wait for next ChangeMessage from server
        break;

      case MessageType.accept:
        if (this.serverState === undefined) {
          throw new Error('unexpected state');
        }
        this.serverState = this.applyPatches(this.serverState, pendingPatches);
        this.vtag = response.vtag;
        pendingActions.splice(0, actionCountBeforeSend);
        pendingPatches.splice(0, patchCountBeforeSend);
        this.sendPendingChanges();
        break;
    }
  };
}
