import { Connection } from './ws';
import { ChangeMessage, MessageType, RejectCode, ResponseMessage, StateMessage } from '../shared/messages';
import { createPatch } from 'rfc6902';
import applyPatch from 'json-touch-patch';
import { diff3, Handler, JSONObject, JSONValue } from 'json-diff3';
import deepEqual from 'fast-deep-equal';
import { PromiseContainer } from './promise-container';

export type Subscriber<State> = (newState: State) => void;
export type NormalizeJsonToState<State> = (json: JSONValue) => State;

export class Collabodux<State extends JSONObject> {
  private pendingStateChanges = false;
  private sendingChanges = false;
  private _localState!: State;
  private _serverState: JSONObject | undefined = undefined;
  private _readyPromise: PromiseContainer<void> | undefined = undefined;
  private _vtag!: string;

  private subscribers = new Set<Subscriber<State>>();
  private _sessions: string[] = [];
  private _sessionSet = new Set<string>();
  private _session: string | undefined = undefined;

  constructor(
    private connection: Connection,
    private normalize: NormalizeJsonToState<State>,
    private handler: Partial<Handler> = {},
    private bufferTimeMs: number = 1000 / 25, // send events at 25 fps
  ) {
    this.connection.onResponseMessage = this.onResponseMessage;
    this._resetState();
  }

  private _resetState() {
    this._readyPromise = new PromiseContainer();
  }

  get ready(): boolean {
    return !this._readyPromise;
  }
  private throwIfNotReady() {
    if (this._readyPromise) {
      throw this._readyPromise.promise;
    }
  }

  get localState(): State {
    this.throwIfNotReady();
    return this._localState;
  }

  get session(): string | undefined {
    this.throwIfNotReady();
    return this._session;
  }

  get sessions(): string[] {
    this.throwIfNotReady();
    return this._sessions;
  }

  subscribe(subscriber: Subscriber<State>): () => void {
    if (!this.subscribers.has(subscriber)) {
      if (this.ready) {
        subscriber(this._localState);
      }
      this.subscribers.add(subscriber);
      return () => this.subscribers.delete(subscriber);
    }
    return () => {};
  }

  private updateLocalStateSubscribers(): void {
    this.subscribers.forEach((subscriber) => subscriber(this._localState!));
  }

  setLocalState(newState: State) {
    if (!this.ready) {
      throw new Error('Not ready');
    }
    this._setLocalState(newState);
  }
  _setLocalState(newState: State) {
    if (deepEqual(newState, this._localState)) {
      return;
    }
    this._localState = newState;
    this.pendingStateChanges = true;
    this.sendPendingChanges();
    if (this._readyPromise) {
      this._readyPromise.resolve();
      this._readyPromise = undefined;
    }
    this.updateLocalStateSubscribers();
  }

  private _updateSessionsArray() {
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
        this._updateSessionsArray();
        break;

      case MessageType.leave:
        this._sessionSet.delete(message.session);
        this._updateSessionsArray();
        break;
    }
    this.updateLocalStateSubscribers();
  };

  private onStateMessage({
    state,
    session,
    sessions,
    vtag,
  }: StateMessage): void {
    if (!this._readyPromise) {
      throw new Error('unexpected StateMessage');
    }
    this._serverState = state;
    this._vtag = vtag;
    this._session = session;
    this._sessionSet = new Set(sessions);
    this._updateSessionsArray();
    this._setLocalState(this.normalize(state));
  }

  private onChangeMessage({ patches, vtag }: ChangeMessage): void {
    if (this._serverState === undefined) {
      throw new Error('ChangeMessage without StateMessage');
    }
    const originalServerState = this._serverState;
    this._serverState = applyPatch(originalServerState, patches);
    this._vtag = vtag;
    // TODO: handle conflicts
    const mergedState = diff3(originalServerState, this._serverState, this._localState, this.handler);
    this._setLocalState(this.normalize(mergedState));
  }

  private sendPendingChanges() {
    if (!this.sendingChanges && this.pendingStateChanges) {
      this.sendingChanges = true;
      setTimeout(this.sendNextPendingChange, this.bufferTimeMs);
    }
  }

  private sendNextPendingChange = async (): Promise<void> => {
    this.pendingStateChanges = false;
    const newServerState = this._localState;
    const patches = createPatch(this._serverState, newServerState);
    if (patches.length === 0) {
      // nothing changed
      this.sendingChanges = false;
      return;
    }
    const response = await this.connection.requestChange(this._vtag, patches);
    this.sendingChanges = false;
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
            throw new Error(`server rejected (${response.code}): ${response.reason}`);
        }
        break;

      case MessageType.accept:
        if (this._serverState === undefined) {
          throw new Error('unexpected state');
        }
        this._serverState = newServerState;
        this._vtag = response.vtag;
        this.sendPendingChanges();
        break;
    }
  };
}
