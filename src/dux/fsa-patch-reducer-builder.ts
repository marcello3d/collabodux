import { Action, ActionCreator } from 'typescript-fsa';
import { PatchReducer } from '../client/collabodux';

export type ActionHandler<State, Payload> = PatchReducer<
  State,
  Action<Payload>
>;

export interface FsaReducerBuilder<State, BasePayload> {
  add<Payload extends BasePayload>(
    actionCreator: ActionCreator<Payload>,
    actionHandler: ActionHandler<State, Payload>,
  ): FsaReducerBuilder<State, BasePayload>;

  build(): PatchReducer<State, Action<BasePayload>>;
}

export function fsaPatchReducerBuilder<
  State,
  BasePayload = any
>(): FsaReducerBuilder<State, BasePayload> {
  const map = new Map<string, ActionHandler<State, any>>();
  return {
    add<Payload extends BasePayload>(
      actionCreator: ActionCreator<Payload>,
      actionHandler: ActionHandler<State, Payload>,
    ) {
      map.set(actionCreator.type, actionHandler);
      return this;
    },
    build(): PatchReducer<State, Action<BasePayload>> {
      return (state, action) => {
        const handler = map.get(action.type);
        if (handler) {
          return handler(state, action);
        }
        return [];
      };
    },
  };
}
