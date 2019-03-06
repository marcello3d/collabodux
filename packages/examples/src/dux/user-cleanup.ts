import { ModelWithUsersType } from './user-model';
import { Collabodux } from '@collabodux/client';
import { useMutate } from './use-mutate';
import { removeUsers, setUserName } from './user-mutators';
import { randomAnimalName } from '../utils/names';

export function addUserManagement(collabodux: Collabodux<ModelWithUsersType>) {
  const mutate = useMutate(collabodux);

  let lastSession: string | undefined = undefined;
  let lastSessions: string[] = [];

  function cleanupSessions() {
    const sessionSet = new Set(collabodux.sessions);
    const obsoleteUsers = Object.keys(collabodux.localState.users).filter(
      (session) => !sessionSet.has(session),
    );
    if (obsoleteUsers.length > 0) {
      mutate(removeUsers({ users: obsoleteUsers }));
    } else {
      console.debug('nothing to clean up!');
    }
  }

  return collabodux.subscribeSessions(({ session, sessions }) => {
    if (lastSessions !== sessions) {
      lastSessions = sessions;
      if (sessions.length < Object.keys(collabodux.localState.users).length) {
        // Cleanup old sessions on a random timer so not everyone slams the server at the same time
        // Time delay is dependent on the number of users.
        const delay = 100 + Math.random() * (sessions.length - 1) * 50;
        console.debug(`Waiting ${delay} ms before cleanup`);
        setTimeout(cleanupSessions, delay);
      }
    }
    if (lastSession !== session) {
      lastSession = session;
      if (lastSession) {
        mutate(
          setUserName({
            session: lastSession,
            username: randomAnimalName(),
          }),
          false,
          false,
        );
      }
    }
  });
}
