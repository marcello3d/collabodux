import { Action, ActionCreator, AnyAction } from 'typescript-fsa';
import { Reducer } from 'redux';

export type ActionHandler<State, Payload> = (
  state: State,
  action: Action<Payload>,
) => State;

export type FsaReducerBuilder<State, BasePayload> = {
  add<Payload extends BasePayload>(
    actionCreator: ActionCreator<Payload>,
    actionHandler: ActionHandler<State, Payload>,
  ): FsaReducerBuilder<State, BasePayload>;

  build(): Reducer<State, Action<BasePayload>>;
}

export function fsaReducerBuilder<State, BasePayload = any>(initialState: State): FsaReducerBuilder<State, BasePayload> {
  const map = new Map<string, ActionHandler<State, any>>();
  return {
    add<Payload extends BasePayload>(
      actionCreator: ActionCreator<Payload>,
      actionHandler: ActionHandler<State, Payload>,
    ) {
      map.set(actionCreator.type, actionHandler);
      return this;
    },
    build(): Reducer<State, Action<BasePayload>> {
      return (state = initialState, action) => {
        const handler = map.get(action.type);
        if (handler) {
          return handler(state, action);
        }
        return state;
      };
    },
  };
}
