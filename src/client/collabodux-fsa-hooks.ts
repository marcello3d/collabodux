import { Collabodux } from './collabodux';
import { Action, ActionCreator } from 'typescript-fsa';

type ActionProposer<Payload> = Payload extends void
  ? () => void
  : (action: Payload) => void;

export function usePropose<
  State,
  BaseAction,
  Payload,
  Patch,
  TAction extends BaseAction & Action<Payload>
>(
  collabodux: Collabodux<State, BaseAction, Patch>,
  actionCreator: ActionCreator<Payload>,
) {
  return ((payload: Payload) => {
    collabodux.propose(actionCreator(payload) as TAction);
  }) as ActionProposer<Payload>;
}
