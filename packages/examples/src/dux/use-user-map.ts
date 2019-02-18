import { useMappedLocalState, useSessions } from '@collabodux/react-hooks';
import { Collabodux } from '@collabodux/client';
import { ModelWithUsersType, UserType } from './user-model';

export function useUserMap<T extends ModelWithUsersType>(
  collabodux: Collabodux<T>,
): Record<string, UserType> {
  const sessions = useSessions(collabodux);
  const users = useMappedLocalState(collabodux, ({ users }) => users);
  const map: Record<string, UserType> = {};
  for (const session of sessions) {
    map[session] = users[session] || {};
  }
  return map;
}
