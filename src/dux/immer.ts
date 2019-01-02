import produce, { Draft, Patch } from 'immer';
import { Action } from 'typescript-fsa';

export function patch<State, Payload>(
  recipe: (
    draft: Draft<State>,
    payload: Payload,
    action: Action<Payload>,
  ) => void,
) {
  return (state: State, action: Action<Payload>) => {
    let finalPatches: Patch[] = [];
    produce(
      state,
      (draft) => recipe(draft, action.payload, action),
      (patches) => {
        finalPatches = patches;
      },
    );
    if (finalPatches.length === 0) {
      return undefined;
    }
    return finalPatches;
  };
}
