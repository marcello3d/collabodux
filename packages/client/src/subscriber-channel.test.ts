import { SubscriberChannel } from './subscriber-channel';

describe('SubscriberChannel', () => {
  it('subscribes', () => {
    const channel = new SubscriberChannel<string>();
    const subscriber = jest.fn();
    channel.subscribe(subscriber);
    channel.send('hello');
    channel.send('world');
    expect(subscriber.mock.calls).toEqual([['hello'], ['world']]);
  });

  it('unsubscribes', () => {
    const channel = new SubscriberChannel<string>();
    const subscriber = jest.fn();
    const unsubscribe = channel.subscribe(subscriber);
    channel.send('hello');
    unsubscribe();
    channel.send('world');
    expect(subscriber.mock.calls).toEqual([['hello']]);
  });

  it('double subscribes', () => {
    const channel = new SubscriberChannel<string>();
    const subscriber = jest.fn();
    channel.subscribe(subscriber);
    expect(() => channel.subscribe(subscriber)).toThrow('already subscribed');
  });

  it('double unsubscribes', () => {
    const channel = new SubscriberChannel<string>();
    const subscriber = jest.fn();
    const unsubscribe = channel.subscribe(subscriber);
    channel.send('hello');
    unsubscribe();
    expect(() => unsubscribe()).toThrow('already unsubscribed');
    channel.send('world');
    expect(subscriber.mock.calls).toEqual([['hello']]);
  });
});
