import { Collabodux } from './collabodux';
import { Action, ActionCreator } from 'typescript-fsa';

type ActionProposer<Payload> = Payload extends void
  ? () => void
  : (action: Payload) => void;

export function usePropose<
  State,
  BaseAction,
  Payload,
  TAction extends BaseAction & Action<Payload>
>(
  collabodux: Collabodux<State, BaseAction>,
  actionCreator: ActionCreator<Payload>,
) {
  return ((payload: Payload) => {
    collabodux.propose(actionCreator(payload) as TAction);
  }) as ActionProposer<Payload>;
}
