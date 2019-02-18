import { useMappedLocalState, useSessions } from '@collabodux/react-hooks';
import { IModelState, IUser } from './model';
import { Collabodux } from '@collabodux/client';

export function useUserMap<Action>(
  collabodux: Collabodux<IModelState>,
): Record<string, IUser> {
  const sessions = useSessions(collabodux);
  const users = useMappedLocalState(collabodux, ({ users }) => users);
  const map: Record<string, IUser> = {};
  for (const session of sessions) {
    map[session] = users[session] || {};
  }
  return map;
}
