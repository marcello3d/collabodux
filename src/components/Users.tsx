import styles from './Users.module.css';
import Focus from './Focus';
import React from 'react';
import { useDispatch } from '../dux/collabodux-fsa-hooks';
import { collabodux } from '../dux/connection';
import { reducer } from '../dux/reducer';
import { setUserName } from '../dux/actions';
import { useSession } from '../client/collabodux-hooks';
import { useUserMap } from '../dux/use-user-map';

export default function Users() {
  const proposeSetUserName = useDispatch(collabodux, reducer, setUserName);
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
                proposeSetUserName({
                  session: currentSession,
                  username: target.value,
                })
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
              <Focus focusId={`users/${session}/username`}>{username}</Focus>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
