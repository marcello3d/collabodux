import { Collabodux } from '../client/collabodux';
import { Action, ActionCreator } from 'typescript-fsa';
import { JSONObject } from 'json-diff3';
import { Reducer } from './fsa-reducer-builder';

type ActionProposer<Payload> = Payload extends void
  ? () => void
  : (payload: Payload) => void;

export function dispatch<
  State extends JSONObject,
  BaseAction,
  Payload,
  TAction extends BaseAction & Action<Payload>
>(
  collabodux: Collabodux<State>,
  reducer: Reducer<State, BaseAction>,
  action: TAction,
) {
  console.debug(`ACTION: ${action.type}`, action.payload);
  collabodux.setLocalState(reducer(collabodux.localState, action));
}

export function useDispatch<
  State extends JSONObject,
  BaseAction,
  Payload,
  TAction extends BaseAction & Action<Payload>
>(
  collabodux: Collabodux<State>,
  reducer: Reducer<State, BaseAction>,
  actionCreator: ActionCreator<Payload>,
) {
  return ((payload: Payload) => {
    dispatch(collabodux, reducer, actionCreator(payload) as TAction);
  }) as ActionProposer<Payload>;
}
