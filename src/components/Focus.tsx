import React from 'react';
import toMaterialStyle from 'material-color-hash';

import { useSession } from '../client/collabodux-hooks';
import { setUserFocus } from '../dux/actions';
import { useDispatch } from '../dux/collabodux-fsa-hooks';
import { collabodux } from '../dux/connection';
import styles from './Focus.module.css';
import { useUserMap } from '../dux/use-user-map';
import { reducer } from '../dux/reducer';

export default function Focus({
  focusId,
  children,
}: {
  focusId: string;
  children: React.ReactNode;
}) {
  const proposeSetUserFocus = useDispatch(collabodux, reducer, setUserFocus);
  const currentSession = useSession(collabodux);
  const sessionMap = useUserMap(collabodux);
  const otherFocuses = Object.keys(sessionMap).filter(
    (session) =>
      session !== currentSession && sessionMap[session].focus === focusId,
  );
  function onFocus() {
    if (currentSession) {
      proposeSetUserFocus({
        session: currentSession,
        focus: focusId,
      });
    }
  }
  function onBlur() {
    if (currentSession) {
      // proposeSetUserFocus({
      //   session: currentSession,
      //   focus: undefined,
      // });
    }
  }
  const boxShadow = otherFocuses
    .map(
      (session, index) =>
        `0 0 0 ${2 * (1 + index)}px ${
          toMaterialStyle(session, 500).backgroundColor
        }`,
    )
    .join(',');
  otherFocuses.reverse();
  return (
    <span
      onClick={onFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      className={styles.root}
      style={{ boxShadow }}
    >
      {otherFocuses.length > 0 && (
        <span
          className={styles.tagWrapper}
          style={{ left: `${-2 * otherFocuses.length}px` }}
        >
          {otherFocuses.map((session) => {
            const { username = 'Unknown' } = sessionMap[session];
            const { color, backgroundColor } = toMaterialStyle(session, 500);
            return (
              <span
                key={session}
                className={styles.tag}
                style={{ color, backgroundColor }}
              >
                {username}
              </span>
            );
          })}
        </span>
      )}
      {children}
    </span>
  );
}
