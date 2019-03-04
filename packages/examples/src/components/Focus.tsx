import React from 'react';
import toMaterialStyle from 'material-color-hash';

import { useSession } from '@collabodux/react-hooks';
import styles from './Focus.module.css';
import { useUserMap } from '../dux/use-user-map';
import { Collabodux } from '@collabodux/client';
import { ModelWithUsersType } from '../dux/user-model';
import { useMutate } from '../dux/mutator';
import { setUserFocus } from '../dux/user-mutators';

export default function Focus<T extends ModelWithUsersType>({
  focusId,
  children,
  collabodux,
}: {
  focusId: string;
  children: React.ReactNode;
  collabodux: Collabodux<T>;
}) {
  const mutate = useMutate(collabodux);
  const currentSession = useSession(collabodux);
  const sessionMap = useUserMap(collabodux);
  const otherFocuses = Object.keys(sessionMap).filter(
    (session) =>
      session !== currentSession && sessionMap[session].focus === focusId,
  );
  function onFocus() {
    if (currentSession) {
      mutate(
        setUserFocus({
          session: currentSession,
          focus: focusId,
        }),
        false,
      );
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
