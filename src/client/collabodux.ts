import { applyPatches, Patch } from 'immer';
import { Connection } from './ws';
import { ChangeMessage, MessageType, StateMessage } from '../shared/messages';

interface PendingAction<Action> {
  action: Action;
  patches: Patch[];
}
export type PatchReducer<State, Action> = (
  priorState: State,
  action: Action,
) => Patch[];
export type Subscriber<State> = (newState: State) => void;

export class Collabodux<State extends {}, ActionType> {
  private pendingActions: PendingAction<ActionType>[] = [];
  private serverState!: State;
  private vtag!: string;
  private _localState: State;

  private subscribers = new Set<Subscriber<State>>();

  constructor(
    private connection: Connection,
    private reducer: PatchReducer<State, ActionType>,
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
    const patches = this.reducer(state, action);
    this._localState = applyPatches(state, patches);
    this.updateSubscribers();
    this.pendingActions.push({ action, patches });
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

  onChangeMessage = ({ patches, vtag }: ChangeMessage): void => {
    this.serverState = applyPatches(this.serverState, patches);
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
    const { patches } = this.pendingActions[0];
    const response = await this.connection.requestChange(this.vtag, patches);
    switch (response.type) {
      case MessageType.reject:
        console.warn('Change rejected; outdated');
        // We're out of sync, wait for next ChangeMessage from server
        break;

      case MessageType.accept:
        this.serverState = applyPatches(this.serverState, patches);
        this.vtag = response.vtag;
        this.pendingActions.shift();
        if (this.pendingActions.length) {
          this.sendNextPendingChange();
        }
        break;
    }
  }
}
