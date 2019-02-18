import { useMappedLocalState, useSessions } from '@collabodux/react-hooks';
import { ModelStateType, UserType } from './model';
import { Collabodux } from '@collabodux/client';

export function useUserMap<Action>(
  collabodux: Collabodux<ModelStateType>,
): Record<string, UserType> {
  const sessions = useSessions(collabodux);
  const users = useMappedLocalState(collabodux, ({ users }) => users);
  const map: Record<string, UserType> = {};
  for (const session of sessions) {
    map[session] = users[session] || {};
  }
  return map;
}
