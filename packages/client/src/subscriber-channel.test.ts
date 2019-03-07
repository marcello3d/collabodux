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
    const unsubscribe1 = channel.subscribe(subscriber);
    channel.send('1');
    const unsubscribe2 = channel.subscribe(subscriber);
    channel.send('2');
    unsubscribe1();
    channel.send('3');
    unsubscribe2();
    channel.send('4');
    expect(subscriber.mock.calls).toEqual([['1'], ['2']]);
  });

  it('double unsubscribes', () => {
    const channel = new SubscriberChannel<string>();
    const subscriber = jest.fn();
    const unsubscribe = channel.subscribe(subscriber);
    channel.send('hello');
    unsubscribe();
    unsubscribe();
    channel.send('world');
    expect(subscriber.mock.calls).toEqual([['hello']]);
  });
});
