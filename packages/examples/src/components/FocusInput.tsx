import React, { useRef } from 'react';
import getCaretCoordinates from 'textarea-caret';

import { useSession } from '@collabodux/react-hooks';
import { useUserMap } from '../dux/use-user-map';
import toMaterialStyle from 'material-color-hash';

import styles from './Focus.module.css';
import { updateInputValueMovingSelection } from '../utils/update-cursor-positions';
import { Collabodux } from '@collabodux/client';
import { ModelWithUsersType } from '../dux/user-model';
import { useMutate } from '../dux/mutator';
import { setUserFocus } from '../dux/user-mutators';

export default function FocusInput<T extends ModelWithUsersType>({
  focusId,
  textarea = false,
  value = '',
  collabodux,
  ...rest
}: {
  focusId: string;
  value: string;
  textarea?: boolean;
  collabodux: Collabodux<T>;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const mutate = useMutate(collabodux);
  const currentSession = useSession(collabodux);
  const sessionMap = useUserMap(collabodux);
  const otherFocuses = Object.keys(sessionMap).filter((session) => {
    const { focus, select } = sessionMap[session];
    return session !== currentSession && focus === focusId && select;
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  function onFocus() {
    if (currentSession && inputRef.current) {
      const { selectionStart, selectionEnd } = inputRef.current;
      mutate(
        setUserFocus({
          session: currentSession,
          focus: focusId,
          select:
            selectionStart === null || selectionEnd === null
              ? undefined
              : [selectionStart, selectionEnd],
        }),
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
  if (
    inputRef.current &&
    updateInputValueMovingSelection(value, inputRef.current)
  ) {
    onFocus();
  }
  return (
    <span className={styles.root} style={{ boxShadow }}>
      {otherFocuses.length > 0 && (
        <span
          className={styles.tagWrapper}
          style={{ left: `${-2 * otherFocuses.length}px` }}
        >
          {otherFocuses.map((session) => {
            const { username } = sessionMap[session];
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
      {otherFocuses.map((session) => {
        const { select } = sessionMap[session];
        if (!inputRef.current) {
          // TODO: recompute once inputRef is available
          return;
        }
        const [selectStart, selectEnd] = select!; // we filtered out falsy selects earlier
        const startCaret = getCaretCoordinates(inputRef.current, selectStart);
        const endCaret = getCaretCoordinates(inputRef.current, selectEnd);
        const { backgroundColor } = toMaterialStyle(session, 500);
        return (
          <div
            key={session}
            style={{
              position: 'absolute',
              backgroundColor,
              opacity: 0.5,
              left: `${startCaret.left}px`,
              width: `${Math.max(endCaret.left - startCaret.left, 2)}px`,
              top: `${startCaret.top - 3}px`,
              height: `1em`,
              zIndex: -1,
            }}
          />
        );
      })}
      <input
        ref={inputRef}
        {...rest}
        value={value}
        onSelect={onFocus}
        onInput={onFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          background: 'none',
          padding: '3px',
          margin: 0,
          border: 'solid 1px #ddd',
          borderRadius: '2px',
        }}
      />
    </span>
  );
}
