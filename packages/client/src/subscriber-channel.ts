export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;
const noop = () => {};

export class SubscriberChannel<T> {
  private _subscribers = new Set<Subscriber<T>>();

  subscribe(subscriber: Subscriber<T>): Unsubscriber {
    if (!this._subscribers.has(subscriber)) {
      this._subscribers.add(subscriber);
      return () => this._subscribers.delete(subscriber);
    }
    return noop;
  }

  send(value: T) {
    this._subscribers.forEach((subscriber) => subscriber(value));
  }
}
