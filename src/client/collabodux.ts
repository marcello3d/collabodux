import { Connection } from './ws';
import { ChangeMessage, MessageType, StateMessage } from '../shared/messages';

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

  constructor(
    private connection: Connection<Patch>,
    private reducer: PatchReducer<State, ActionType, Patch>,
    private applyPatch: PatchApplier<State, Patch>,
  ) {
    this._localState = {} as State;
    this.connection.onChangeMessage = this.onChangeMessage;
    this.connection.onStateMessage = this.onStateMessage;
  }

  get localState(): State {
    return this._localState;
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

  onStateMessage = ({ state = {}, vtag }: StateMessage): void => {
    this.serverState = state;
    this.vtag = vtag;
    this.replayPendingActions();
    this.updateSubscribers();
  };

  onChangeMessage = ({ patch, vtag }: ChangeMessage<Patch>): void => {
    this.serverState = this.applyPatch(this.serverState, patch);
    this.vtag = vtag;
    // TODO: we can look at patches and see if it conflicts with any patches in pendingActions to be smart about stuff
    this.replayPendingActions();
    this.updateSubscribers();
  };

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
