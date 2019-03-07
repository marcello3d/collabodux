export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;

export class SubscriberChannel<T> {
  private _subscribers = new Set<Subscriber<T>>();

  subscribe(subscriber: Subscriber<T>): Unsubscriber {
    if (this._subscribers.has(subscriber)) {
      throw new Error('already subscribed');
    }
    this._subscribers.add(subscriber);
    let unsubscribed = false;
    return () => {
      if (unsubscribed) {
        throw new Error('already unsubscribed');
      }
      this._subscribers.delete(subscriber);
      unsubscribed = true;
    };
  }

  send(value: T) {
    this._subscribers.forEach((subscriber) => subscriber(value));
  }
}
