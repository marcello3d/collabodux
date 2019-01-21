import { Collabodux } from './collabodux';
import { useEffect, useState } from 'react';
import shallowequal from 'shallowequal';
import { JSONObject } from 'json-diff3';

export function useLocalState<State extends JSONObject, Action>(
  client: Collabodux<State>,
) {
  const [localState, setLocalState] = useState(client.localState);
  useEffect(() => client.subscribe(setLocalState), [client]);
  return localState;
}

export function useSession<State extends JSONObject, Action>(
  client: Collabodux<State>,
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

export function useSessions<State extends JSONObject, Action>(
  client: Collabodux<State>,
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

export function useMappedLocalState<State extends JSONObject, Action, T>(
  client: Collabodux<State>,
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
