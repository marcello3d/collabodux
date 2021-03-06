import { Collabodux } from '@collabodux/client';
import { useEffect, useState } from 'react';
import shallowequal from 'shallowequal';
import { JSONObject } from 'json-diff3';

export function useLocalState<State extends JSONObject>(
  client: Collabodux<State, any, any>,
) {
  const [localState, setLocalState] = useState(client.localState);
  useEffect(() => client.subscribeLocalState(setLocalState), [client]);
  return localState;
}

export function useSession<State extends JSONObject>(
  client: Collabodux<State, any, any>,
): string | undefined {
  const [currentSession, setSession] = useState(client.currentSession);
  useEffect(
    () =>
      client.subscribeSessions(({ session }) => {
        if (session !== currentSession) {
          setSession(session);
        }
      }),
    [client],
  );
  return currentSession;
}

export function useSessions<State extends JSONObject>(
  client: Collabodux<State, any, any>,
): string[] {
  const [currentSessions, setSessions] = useState(client.sessions);
  useEffect(
    () =>
      client.subscribeSessions(({ sessions }) => {
        if (sessions !== currentSessions) {
          setSessions(sessions);
        }
      }),
    [client],
  );
  return currentSessions;
}

export function useMappedLocalState<State extends JSONObject, T>(
  client: Collabodux<State, any, any>,
  mapStateToProps: (state: State) => T,
) {
  const [partial, updatePartial] = useState<T>(
    mapStateToProps(client.localState),
  );
  useEffect(
    () =>
      client.subscribeLocalState((state) => {
        const newPartial = mapStateToProps(state);
        if (!shallowequal(partial, newPartial)) {
          updatePartial(newPartial);
        }
      }),
    [client],
  );
  return partial;
}

type UndoRedoFunctions = {
  undo?: () => void;
  redo?: () => void;
};

export function useUndoRedo<State extends JSONObject>(
  client: Collabodux<State, any, any>,
): UndoRedoFunctions {
  const [result, setResult] = useState<UndoRedoFunctions>({});
  useEffect(
    () =>
      client.subscribeLocalState(() => {
        if (
          Boolean(result.undo) !== client.hasUndo ||
          Boolean(result.redo) !== client.hasRedo
        ) {
          setResult({
            undo: client.hasUndo ? () => client.undo() : undefined,
            redo: client.hasRedo ? () => client.redo() : undefined,
          });
        }
      }),
    [client],
  );
  return result;
}
