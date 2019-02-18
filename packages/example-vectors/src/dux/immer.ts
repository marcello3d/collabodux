import produce, { Draft, Patch, applyPatches } from 'immer';
import { Action } from 'typescript-fsa';

export function patch<State, Payload>(
  recipe: (
    draft: Draft<State>,
    payload: Payload,
    action: Action<Payload>,
  ) => void,
) {
  return (state: State, payload: Payload, action: Action<Payload>): Patch[] => {
    let finalPatches: Patch[] = [];
    produce(
      state,
      (draft) => recipe(draft, payload, action),
      (patches) => {
        finalPatches = patches;
      },
    );
    return finalPatches;
  };
}

export function compressPatches<S>(state0: S, patches: Patch[]) {
  produce(
    state0,
    (draft) => applyPatches(draft, patches),
    (flatPatches) => {
      patches = flatPatches;
    },
  );
  return patches;
}
