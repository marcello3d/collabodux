import { Subscriber, SubscriberChannel } from './subscriber-channel';

export type SessionData = {
  session: string | undefined;
  sessions: string[];
};

export class SessionManager {
  private _sessionsStateSubscribers = new SubscriberChannel<SessionData>();
  private _sessions: string[] = [];
  private _sessionSet = new Set<string>();
  private _currentSession: string | undefined = undefined;

  get currentSession(): string | undefined {
    return this._currentSession;
  }

  get sessions(): string[] {
    return this._sessions;
  }

  subscribe(subscriber: Subscriber<SessionData>): () => void {
    subscriber(this._sessionData());
    return this._sessionsStateSubscribers.subscribe(subscriber);
  }

  private _sessionData(): SessionData {
    return {
      session: this._currentSession,
      sessions: this._sessions,
    };
  }

  private _sendSessionState() {
    this._sessions = Array.from(this._sessionSet).sort();
    this._sessionsStateSubscribers.send(this._sessionData());
  }

  public addSession(session: string) {
    this._sessionSet.add(session);
    this._sendSessionState();
  }

  public removeSession(session: string) {
    this._sessionSet.delete(session);
    this._sendSessionState();
  }

  public setSessions(currentSession: string, sessions: string[]) {
    this._currentSession = currentSession;
    this._sessionSet = new Set(sessions);
    this._sendSessionState();
  }
}
