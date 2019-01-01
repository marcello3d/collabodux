import { Action, ActionCreator } from 'typescript-fsa';
import { PatchReducer } from '../client/collabodux';

export type ActionHandler<State, Payload, Patch> = PatchReducer<
  State,
  Action<Payload>,
  Patch
>;

export interface FsaReducerBuilder<State, Patch> {
  add<Payload extends any>(
    actionCreator: ActionCreator<Payload>,
    actionHandler: ActionHandler<State, Payload, Patch>,
  ): FsaReducerBuilder<State, Patch>;

  build(): PatchReducer<State, Action<any>, Patch>;
}

export function fsaReducerBuilder<
  State,
  Patch,
>(): FsaReducerBuilder<State, Patch> {
  const map = new Map<string, ActionHandler<State, any, Patch>>();
  return {
    add<Payload extends any>(
      actionCreator: ActionCreator<Payload>,
      actionHandler: ActionHandler<State, Payload, Patch>,
    ) {
      map.set(actionCreator.type, actionHandler);
      return this;
    },
    build(): PatchReducer<State, Action<any>, Patch> {
      return (state, action) => {
        const handler = map.get(action.type);
        if (handler) {
          return handler(state, action);
        }
      };
    },
  };
}
