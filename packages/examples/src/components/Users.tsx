import styles from './Users.module.css';
import Focus from './Focus';
import React from 'react';
import { reducer } from '../vectors/model/reducer';
import { useSession } from '@collabodux/react-hooks';
import { useUserMap } from '../dux/use-user-map';
import { Collabodux } from '@collabodux/client';
import { ModelWithUsersType } from '../dux/user-model';
import { useMutate } from '../dux/mutator';
import { setUserName } from '../dux/user-mutators';

export default function Users<T extends ModelWithUsersType>({
  collabodux,
}: {
  collabodux: Collabodux<T>;
}) {
  const mutate = useMutate(collabodux);
  const currentSession = useSession(collabodux);
  const userMap = useUserMap(collabodux);

  const currentUsername =
    currentSession && userMap[currentSession]
      ? userMap[currentSession].username
      : '';
  return (
    <nav className={styles.root}>
      <input
        type="text"
        disabled={!currentSession}
        value={currentUsername}
        placeholder="Username…"
        onChange={
          currentSession
            ? ({ target }) =>
                mutate(
                  setUserName({
                    session: currentSession,
                    username: target.value,
                  }),
                )
            : undefined
        }
      />
      <ul>
        {Object.keys(userMap).map((session) => {
          if (session === currentSession) {
            return;
          }
          const { username } = userMap[session];
          return (
            <li key={session}>
              <Focus
                collabodux={collabodux}
                focusId={`users/${session}/username`}
              >
                {username}
              </Focus>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
