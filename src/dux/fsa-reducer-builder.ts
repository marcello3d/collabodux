import { Action, ActionCreator } from 'typescript-fsa';
import { PatchReducer } from '../client/collabodux';

export type ActionPayloadHandler<State, Payload, Patch> = (
  state: State,
  payload: Payload,
  action: Action<Payload>,
) => Patch[];

export interface FsaReducerBuilder<State, Patch> {
  add<Payload extends any>(
    actionCreator: ActionCreator<Payload>,
    actionHandler: ActionPayloadHandler<State, Payload, Patch>,
  ): FsaReducerBuilder<State, Patch>;

  build(): PatchReducer<State, Action<any>, Patch>;
}

export function fsaReducerBuilder<State, Patch>(): FsaReducerBuilder<
  State,
  Patch
> {
  const map = new Map<string, ActionPayloadHandler<State, any, Patch>>();
  return {
    add<Payload extends any>(
      actionCreator: ActionCreator<Payload>,
      actionHandler: ActionPayloadHandler<State, Payload, Patch>,
    ) {
      map.set(actionCreator.type, actionHandler);
      return this;
    },
    build(): PatchReducer<State, Action<any>, Patch> {
      return (state, action) => {
        const handler = map.get(action.type);
        if (handler) {
          return handler(state, action.payload, action);
        }
        return [];
      };
    },
  };
}
