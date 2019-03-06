import { JSONObject } from 'json-diff3';
import { Collabodux } from '@collabodux/client';
import produce, { Draft } from 'immer';
import { useCallback } from 'react';

export type MutateFn<State extends JSONObject> = (
  mutator: MutatorFn<State>,
  undoable?: boolean,
  snapshot?: boolean,
) => void;

export interface MutatorFn<State extends JSONObject> {
  (state: Draft<State>): void;
  undoable: boolean;
  snapshot: boolean;
}

export type PayloadMutator<State extends JSONObject, Payload> = (
  state: Draft<State>,
  payload: Payload,
) => void;

export function useMutate<State extends JSONObject>(
  collabodux: Collabodux<State>,
): MutateFn<State> {
  return (
    mutator: MutatorFn<State>,
    undoable: boolean = mutator.undoable,
    snapshot: boolean = mutator.snapshot,
  ) => {
    if (snapshot) {
      collabodux.snapshot();
    }
    collabodux.setLocalState(produce(collabodux.localState, mutator), undoable);
  };
}

export type MutatorCreator<State extends JSONObject, Payload> = (
  payload: Payload,
) => MutatorFn<State>;

export function createMutatorFactory<State extends JSONObject>() {
  return function mutatorFactory<Payload>(
    mutator: PayloadMutator<State, Payload>,
    undoable: boolean,
    snapshot: boolean,
  ): MutatorCreator<State, Payload> {
    return function mutatorCreator(payload: Payload): MutatorFn<State> {
      const m = (state: Draft<State>) => mutator(state, payload);
      m.undoable = undoable;
      m.snapshot = snapshot;
      return m;
    };
  };
}
