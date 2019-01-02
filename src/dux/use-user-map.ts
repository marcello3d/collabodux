import { useMappedLocalState, useSessions } from '../client/collabodux-hooks';
import { ModelState, User } from './model';
import { Collabodux } from '../client/collabodux';

export function useUserMap<Action, Patch>(
  collabodux: Collabodux<ModelState, Action, Patch>,
): Record<string, User> {
  const sessions = useSessions(collabodux);
  const users = useMappedLocalState(collabodux, ({ users = {} }) => users);
  const map: Record<string, User> = {};
  for (const session of sessions) {
    map[session] = users[session] || {};
  }
  return map;
}
