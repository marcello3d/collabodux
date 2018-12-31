import produce, { Draft } from 'immer';

import { fsaReducerBuilder } from './fsa-reducer-builder';
import { AppState, initialState } from './state';
import { setTitle } from './actions';
import { Action, AnyAction } from 'typescript-fsa';
import { Store, createStore } from 'redux';

function immerize<State, Payload>(recipe: (draft: Draft<State>, payload: Payload, action: Action<Payload>) => void) {
  return (state: State, action: Action<Payload>) =>
    produce(state,
      (draft) => recipe(draft, action.payload, action),
    );
}

export const reducer = fsaReducerBuilder<AppState>(initialState)
  .add(setTitle, immerize((draft, { title }) => {
    draft.title = title;
  }))
  .build();

export function createReduxStore(): Store<AppState, AnyAction> {
  return createStore(reducer);
}
