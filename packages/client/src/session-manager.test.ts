import { SessionManager } from './session-manager';

describe('SessionManager', () => {
  it('adds and sorts sessions', () => {
    const sm = new SessionManager();
    sm.addSession('a');
    expect(sm.sessions).toEqual(['a']);
    sm.addSession('c');
    expect(sm.sessions).toEqual(['a', 'c']);
    sm.addSession('b');
    expect(sm.sessions).toEqual(['a', 'b', 'c']);
  });

  it('handles double-add', () => {
    const sm = new SessionManager();
    sm.addSession('a');
    sm.addSession('a');
    expect(sm.sessions).toEqual(['a']);
  });

  it('removes sessions', () => {
    const sm = new SessionManager();
    sm.addSession('a');
    sm.removeSession('a');
    expect(sm.sessions).toEqual([]);
  });

  it('handles double remove', () => {
    const sm = new SessionManager();
    sm.addSession('a');
    sm.removeSession('a');
    sm.removeSession('a');
    expect(sm.sessions).toEqual([]);
  });

  it('handles set session', () => {
    const sm = new SessionManager();
    sm.setSessions('a', ['b', 'a']);
    expect(sm.currentSession).toEqual('a');
    expect(sm.sessions).toEqual(['a', 'b']);
  });

  it('emits events to subscriber', () => {
    const sm = new SessionManager();
    const subscriber = jest.fn();
    sm.subscribe(subscriber);
    sm.addSession('a');
    sm.removeSession('b');
    sm.addSession('c');
    sm.setSessions('a', ['b', 'a']);
    sm.setSessions('b', ['c', 'd']);
    expect(subscriber.mock.calls).toEqual([
      [{ session: undefined, sessions: [] }],
      [{ session: undefined, sessions: ['a'] }],
      [{ session: undefined, sessions: ['a'] }],
      [{ session: undefined, sessions: ['a', 'c'] }],
      [{ session: 'a', sessions: ['a', 'b'] }],
      [{ session: 'b', sessions: ['c', 'd'] }],
    ]);
  });

  it('unsubscribes', () => {
    const sm = new SessionManager();
    const subscriber = jest.fn();
    const unsubscribe = sm.subscribe(subscriber);
    sm.addSession('a');
    unsubscribe();
    sm.addSession('c');
    expect(subscriber.mock.calls).toEqual([
      [{ session: undefined, sessions: [] }],
      [{ session: undefined, sessions: ['a'] }],
    ]);
  });
});
