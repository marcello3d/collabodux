import { Collabodux } from './collabodux';
import { useEffect, useState } from 'react';
import shallowequal from 'shallowequal';

export function useLocalState<State, Action>(
  client: Collabodux<State, Action>,
) {
  const [localState, setLocalState] = useState(client.localState);
  useEffect(() => client.subscribe(setLocalState), [client]);
  return localState;
}

export function useSession<State, Action>(
  client: Collabodux<State, Action>,
): string | undefined {
  const [currentSession, setSession] = useState(client.session);
  useEffect(
    () =>
      client.subscribe(() => {
        const session = client.session;
        if (session !== currentSession) {
          setSession(session);
        }
      }),
    [client],
  );
  return currentSession;
}

export function useSessions<State, Action>(
  client: Collabodux<State, Action>,
): string[] {
  const [currentSessions, setSessions] = useState(client.sessions);
  useEffect(
    () =>
      client.subscribe(() => {
        const sessions = client.sessions;
        if (sessions !== currentSessions) {
          setSessions(sessions);
        }
      }),
    [client],
  );
  return currentSessions;
}

export function useMappedLocalState<State, Action, T>(
  client: Collabodux<State, Action>,
  fn: (state: State) => T,
) {
  const [partial, updatePartial] = useState<T>(fn(client.localState));
  useEffect(
    () =>
      client.subscribe((state) => {
        const newPartial = fn(state);
        if (!shallowequal(partial, newPartial)) {
          updatePartial(newPartial);
        }
      }),
    [client],
  );
  return partial;
}
