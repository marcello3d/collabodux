import { Collabodux } from './collabodux';
import { useEffect, useState } from 'react';
import shallowequal from 'shallowequal';

export function useLocalState<State, Action>(
  client: Collabodux<State, Action>,
) {
  const [localState, setLocalState] = useState<State>(client.localState);
  useEffect(() => client.subscribe(setLocalState), [client]);
  return localState;
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
