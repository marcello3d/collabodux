import { Action, ActionCreator } from 'typescript-fsa';

export type ActionPayloadHandler<State, Payload> = (
  state: State,
  payload: Payload,
  action: Action<Payload>,
) => State;

export type Reducer<State, Action> = (
  state: State,
  action: Action,
) => State;

export interface FsaReducerBuilder<State> {
  add<Payload extends any>(
    actionCreator: ActionCreator<Payload>,
    actionHandler: ActionPayloadHandler<State, Payload>,
  ): FsaReducerBuilder<State>;

  build(): Reducer<State, Action<any>>;
}

export function fsaReducerBuilder<State>(): FsaReducerBuilder<State> {
  const map = new Map<string, ActionPayloadHandler<State, any>>();
  return {
    add<Payload extends any>(
      actionCreator: ActionCreator<Payload>,
      actionHandler: ActionPayloadHandler<State, Payload>,
    ) {
      map.set(actionCreator.type, actionHandler);
      return this;
    },
    build(): Reducer<State, Action<any>> {
      return (state, action) => {
        const handler = map.get(action.type);
        if (handler) {
          return handler(state, action.payload, action);
        }
        return state;
      };
    },
  };
}
