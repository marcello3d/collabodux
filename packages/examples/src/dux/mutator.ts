import { JSONObject } from 'json-diff3';
import { Collabodux } from '@collabodux/client';
import produce, { Draft } from 'immer';

export type Mutate<State extends JSONObject> = (
  mutator: (state: Draft<State>) => void,
  undoable?: boolean,
) => void;
export type Mutator<State extends JSONObject> = (state: Draft<State>) => void;
export type PayloadMutator<State extends JSONObject, Payload> = (
  state: Draft<State>,
  payload: Payload,
) => void;

export function useMutate<State extends JSONObject>(
  collabodux: Collabodux<State>,
): Mutate<State> {
  return (mutator: Mutator<State>, undoable: boolean = true) => {
    collabodux.setLocalState(produce(collabodux.localState, mutator), undoable);
  };
}

export type MutatorCreator<State extends JSONObject, Payload> = (
  payload: Payload,
) => Mutator<State>;

export function createMutatorFactory<State extends JSONObject>() {
  return <Payload>(
    mutator: PayloadMutator<State, Payload>,
  ): MutatorCreator<State, Payload> => (payload: Payload): Mutator<State> => (
    state: Draft<State>,
  ) => mutator(state, payload);
}
