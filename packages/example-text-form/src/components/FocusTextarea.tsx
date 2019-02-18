import React, { useRef } from 'react';
import getCaretCoordinates from 'textarea-caret';

import { useSession } from '@collabodux/react-hooks';
import { setUserFocus } from '../dux/actions';
import { useDispatch } from '../dux/collabodux-fsa-hooks';
import { collabodux } from '../dux/connection';
import { useUserMap } from '../dux/use-user-map';
import toMaterialStyle from 'material-color-hash';

import styles from './Focus.module.css';
import { updateInputValueMovingSelection } from '../utils/update-cursor-positions';
import { reducer } from '../dux/reducer';

export default function FocusTextarea({
  focusId,
  textarea = false,
  value = '',
  ...rest
}: {
  focusId: string;
  textarea?: boolean;
  value: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const proposeSetUserFocus = useDispatch(collabodux, reducer, setUserFocus);
  const currentSession = useSession(collabodux);
  const sessionMap = useUserMap(collabodux);
  const otherFocuses = Object.keys(sessionMap).filter((session) => {
    const { focus, select } = sessionMap[session];
    return session !== currentSession && focus === focusId && select;
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  function onFocus() {
    if (currentSession && textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      proposeSetUserFocus({
        session: currentSession,
        focus: focusId,
        select:
          selectionStart === null || selectionEnd === null
            ? undefined
            : [selectionStart, selectionEnd],
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
  if (
    textareaRef.current &&
    updateInputValueMovingSelection(value, textareaRef.current)
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
        if (!textareaRef.current) {
          // TODO: recompute once inputRef is available
          return;
        }
        const [selectStart, selectEnd] = select!; // we filtered out falsy selects earlier
        const startCaret = getCaretCoordinates(
          textareaRef.current,
          selectStart,
        );
        const endCaret = getCaretCoordinates(textareaRef.current, selectEnd);
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
      <textarea
        ref={textareaRef}
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
