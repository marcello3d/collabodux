import produce, { applyPatches, Draft, Patch } from 'immer';
import { Connection } from './ws';
import { ChangeMessage, MessageType, StateMessage } from '../shared/messages';

interface PendingAction<State> {
  fn: (draft: Draft<State>) => void;
  patches: Patch[];
}

type Subscriber<State> = (newState: State) => void;

export class Client<State> {
  pendingActions: PendingAction<State>[] = [];
  private serverState!: State;
  private vtag!: string;
  localState: State;

  private subscribers = new Set<Subscriber<State>>();

  constructor (initialState: State, private connection: Connection) {
    this.localState = initialState;
    this.connection.onChangeMessage = this.onChangeMessage;
    this.connection.onStateMessage = this.onStateMessage;
  }

  subscribe(subscriber: Subscriber<State>): () => void {
    if (!this.subscribers.has(subscriber)) {
      subscriber(this.localState);
      this.subscribers.add(subscriber);
      return () => this.subscribers.delete(subscriber);
    }
    return () => {};
  }

  private updateSubscribers() {
    this.subscribers.forEach((subscriber) => subscriber(this.localState));
  }

  // TODO: we could pass actions in here and have a global reducer function in the Client
  propose(fn: (draft: Draft<State>) => void) {
    let patches: Patch[] = [];
    this.localState = produce(this.localState, fn, (_patches) => {
      patches = _patches;
    });
    this.updateSubscribers();
    this.pendingActions.push({ fn, patches });
    if (this.pendingActions.length === 1) {
      this.sendNextPendingChange();
    }
  }

  onStateMessage = ({ state, vtag }: StateMessage) => {
    this.serverState = state;
    this.vtag = vtag;
    this.replayPendingActions();
    this.updateSubscribers();
  };

  onChangeMessage = ({ patches, vtag }: ChangeMessage) => {
    this.serverState = applyPatches(this.serverState, patches);
    this.vtag = vtag;
    // TODO: we can look at patches and see if it conflicts with any patches in pendingActions to be smart about stuff
    this.replayPendingActions();
    this.updateSubscribers();
  };

  private replayPendingActions() {
    const { pendingActions } = this;
    this.localState = this.serverState;
    this.pendingActions = [];
    pendingActions.forEach(({ fn }) => {
      try {
        this.propose(fn);
      } catch (e) {
        console.warn(`Dropped change ${fn}, it could not be applied anymore: ${e}`);
      }
    })
  }

  async sendNextPendingChange() {
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
