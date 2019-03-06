import { JSONObject } from 'json-diff3';
import { Collabodux } from '@collabodux/client';
import produce, { Draft } from 'immer';

export type MutateFn<State extends JSONObject, EditMetadata> = (
  mutator: MutatorFn<State, EditMetadata>,
) => void;

export interface MutatorFn<State extends JSONObject, EditMetadata> {
  (state: Draft<State>): EditMetadata | undefined;
}

export type PayloadMutator<State extends JSONObject, Payload, EditMetadata> = (
  state: Draft<State>,
  payload: Payload,
) => EditMetadata | undefined;

export function useMutate<
  State extends RawState,
  RawState extends JSONObject,
  EditMetadata
>(
  collabodux: Collabodux<State, RawState, EditMetadata>,
): MutateFn<State, EditMetadata> {
  return (mutator: MutatorFn<State, EditMetadata>) => {
    let metadata: EditMetadata | undefined;
    const newState = produce(collabodux.localState, (draft) => {
      metadata = mutator(draft);
    });
    if (newState !== collabodux.localState) {
      collabodux.setLocalState(newState, metadata);
    }
  };
}

export type MutatorCreator<State extends JSONObject, Payload, EditMetadata> = (
  payload: Payload,
) => MutatorFn<State, EditMetadata>;

export function createMutatorFactory<State extends JSONObject, EditMetadata>() {
  return function mutatorFactory<Payload>(
    mutator: PayloadMutator<State, Payload, EditMetadata>,
  ): MutatorCreator<State, Payload, EditMetadata> {
    return (payload: Payload): MutatorFn<State, EditMetadata> => (
      state: Draft<State>,
    ) => mutator(state, payload);
  };
}
