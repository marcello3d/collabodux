import { Connection } from './ws';
import { ChangeMessage, MessageType, ResponseMessage, StateMessage } from '../shared/messages';
import { createPatch, Operation } from 'rfc6902';
import applyPatch from 'json-touch-patch';

export type Reducer<State, Action> = (
  state: State,
  action: Action,
) => State;

export type Subscriber<State> = (newState: State) => void;
export type LoadStateActionProducer<Action> = (externalState: any) => Action;

export class Collabodux<State, Action> {
  private pendingActions: Action[] = [];
  // private pendingPatches: Operation[] = [];
  private _serverState: State | undefined = undefined;
  private vtag!: string;
  private _localState: State = {} as State;

  private subscribers = new Set<Subscriber<State>>();
  private _sessions: string[] = [];
  private _sessionSet = new Set<string>();
  private _session: string | undefined = undefined;

  constructor(
    private connection: Connection,
    private loadStateAction: LoadStateActionProducer<Action>,
    private reducer: Reducer<State, Action>,
    private bufferTimeMs: number = 1000 / 25, // send events at 25 fps
  ) {
    this.connection.onResponseMessage = this.onResponseMessage;
    this._localState = reducer(this._localState, loadStateAction({}));
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
      if (this.pendingActions.length === 1 && this._serverState !== undefined) {
        this.sendPendingChanges();
      }
      this.updateSubscribers();
    }
  }

  // Propose without notifying subscribers
  private _propose(action: Action): boolean {
    const state = this._localState;
    const newState = this.reducer(state, action);
    const patches = createPatch(state, newState);
    console.log('propose', action, 'patches', patches);
    if (newState === state) {
      return false;
    }
    this._localState = newState;
    this.pendingActions.push(action);
    return true;
  }

  private updateSessionsArray() {
    this._sessions = Array.from(this._sessionSet).sort();
  }

  onResponseMessage = (message: ResponseMessage): void => {
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
    const firstState = this._serverState === undefined;
    this._serverState = state;
    this.vtag = vtag;
    this._session = session;
    this._sessionSet = new Set(sessions);
    this.updateSessionsArray();
    this.replayPendingActions(true);
  }

  private onChangeMessage({ patches, vtag }: ChangeMessage): void {
    if (this._serverState === undefined) {
      throw new Error('in bad state');
    }
    this._serverState = applyPatch(this._serverState, patches);
    this.vtag = vtag;
    // TODO: we can look at patches and see if it conflicts with any patches in pendingPatches
    this.replayPendingActions(false);
  }

  private replayPendingActions(reloadState: boolean): void {
    const { pendingActions } = this;
    this._localState = this._serverState as State;
    this.pendingActions = [];
    if (reloadState) {
      this._propose(this.loadStateAction(this._serverState));
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
    const { pendingActions } = this;
    const actionCountBeforeSend = pendingActions.length;
    const response = await this.connection.requestChange(
      this.vtag,
      createPatch(this._serverState, this._localState),
    );
    switch (response.type) {
      case MessageType.reject:
        console.warn('Change rejected; outdated');
        // We're out of sync, wait for next ChangeMessage from server
        break;

      case MessageType.accept:
        if (this._serverState === undefined) {
          throw new Error('unexpected state');
        }
        this._serverState = this._localState;
        this.vtag = response.vtag;
        pendingActions.splice(0, actionCountBeforeSend);
        this.sendPendingChanges();
        break;
    }
  };
}
