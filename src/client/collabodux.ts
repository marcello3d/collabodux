import { Connection } from './ws';
import {
  ChangeMessage,
  MessageType,
  ResponseMessage,
  StateMessage,
} from '../shared/messages';

interface PendingAction<Action, Patch> {
  action: Action;
  patch: Patch;
}
export type PatchReducer<State, Action, Patch> = (
  state: State,
  action: Action,
) => Patch | undefined;

export type PatchApplier<State, Patch> = (state: State, patch: Patch) => State;

export type Subscriber<State> = (newState: State) => void;

export class Collabodux<State, ActionType, Patch> {
  private pendingActions: PendingAction<ActionType, Patch>[] = [];
  private serverState!: State;
  private vtag!: string;
  private _localState: State;

  private subscribers = new Set<Subscriber<State>>();
  private _sessions: string[] = [];
  private _sessionSet = new Set<string>();
  private _session: string | undefined = undefined;

  constructor(
    private connection: Connection<Patch>,
    private reducer: PatchReducer<State, ActionType, Patch>,
    private applyPatch: PatchApplier<State, Patch>,
  ) {
    this._localState = {} as State;
    this.connection.onResponseMessage = this.onResponseMessage;
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
    this.subscribers.forEach((subscriber) => subscriber(this._localState));
  }

  propose(action: ActionType): void {
    const state = this._localState;
    const patch = this.reducer(state, action);
    if (patch === undefined) {
      return;
    }
    this._localState = this.applyPatch(state, patch);
    this.updateSubscribers();
    this.pendingActions.push({ action, patch });
    if (this.pendingActions.length === 1) {
      this.sendNextPendingChange();
    }
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

  private onStateMessage({ state = {}, session, sessions, vtag }: StateMessage): void {
    this.serverState = state;
    this.vtag = vtag;
    this._session = session;
    this._sessionSet = new Set(sessions);
    this.updateSessionsArray();
    this.replayPendingActions();
  }

  private updateSessionsArray() {
    this._sessions = Array.from(this._sessionSet).sort();
  }

  private onChangeMessage({ patch, vtag }: ChangeMessage<Patch>): void {
    this.serverState = this.applyPatch(this.serverState, patch);
    this.vtag = vtag;
    // TODO: we can look at patches and see if it conflicts with any patches in pendingActions to be smart about stuff
    this.replayPendingActions();
  }

  private replayPendingActions(): void {
    const { pendingActions } = this;
    this._localState = this.serverState;
    this.pendingActions = [];
    pendingActions.forEach(({ action }) => {
      try {
        this.propose(action);
      } catch (e) {
        console.warn(
          `Dropped action ${action}, it could not be applied anymore: ${e}`,
        );
      }
    });
  }

  private async sendNextPendingChange(): Promise<void> {
    const { patch } = this.pendingActions[0];
    const response = await this.connection.requestChange(this.vtag, patch);
    switch (response.type) {
      case MessageType.reject:
        console.warn('Change rejected; outdated');
        // We're out of sync, wait for next ChangeMessage from server
        break;

      case MessageType.accept:
        this.serverState = this.applyPatch(this.serverState, patch);
        this.vtag = response.vtag;
        this.pendingActions.shift();
        if (this.pendingActions.length) {
          this.sendNextPendingChange();
        }
        break;
    }
  }
}
