import React from 'react';
import styles from './App.module.css';
import { useMappedLocalState, useSession } from './client/collabodux-hooks';
import {
  addTodo,
  setLongText,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
  setUserName,
} from './dux/actions';
import { useDispatch } from './dux/collabodux-fsa-hooks';
import { collabodux } from './dux/connection';
import { useUserMap } from './dux/use-user-map';
import Focus from './components/Focus';
import FocusInput from './components/FocusInput';
import FocusTextarea from './components/FocusTextarea';
import { reducer } from './dux/reducer';

export function App() {
  const proposeSetTitle = useDispatch(collabodux, reducer, setTitle);
  const proposeSetSubtitle = useDispatch(collabodux, reducer, setSubtitle);
  const proposeSetLongText = useDispatch(collabodux, reducer, setLongText);
  const proposeSetTodoDone = useDispatch(collabodux, reducer, setTodoDone);
  const proposeSetTodoLabel = useDispatch(collabodux, reducer, setTodoLabel);
  const proposeAddTodo = useDispatch(collabodux, reducer, addTodo);
  const proposeSetUserName = useDispatch(collabodux, reducer, setUserName);

  const currentSession = useSession(collabodux);
  const { title, subtitle, longtext, todos } = useMappedLocalState(
    collabodux,
    ({ title, subtitle, longtext, todos }) => ({
      title,
      subtitle,
      longtext,
      todos,
    }),
  );
  const userMap = useUserMap(collabodux);

  const currentUsername =
    currentSession && userMap[currentSession]
      ? userMap[currentSession].username
      : '';
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabodux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <nav className={styles.nav}>
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
      <main>
        <div>
          <label>
            Title:{' '}
            <FocusInput
              focusId="title"
              value={title}
              onChange={({ target }) =>
                proposeSetTitle({ title: target.value })
              }
            />
          </label>
        </div>
        <div>
          <label>
            Subtitle:{' '}
            <FocusInput
              focusId="subtitle"
              value={subtitle}
              onChange={({ target }) =>
                proposeSetSubtitle({
                  subtitle: target.value,
                })
              }
            />
          </label>
        </div>
        <div>
          <label htmlFor="longtext">Long Text:</label>
        </div>
        <div>
          <FocusTextarea
            focusId="longtext"
            id="longtext"
            value={longtext}
            cols={80}
            rows={20}
            onChange={({ target }) =>
              proposeSetLongText({
                text: target.value,
              })
            }
          />
        </div>
        <div>Todo list:</div>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>
              <Focus focusId={`todos/${index}/done`}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={({ target }) =>
                    proposeSetTodoDone({
                      index: Number(target.getAttribute('data-index')),
                      done: target.checked,
                    })
                  }
                  data-index={index}
                />
              </Focus>{' '}
              <FocusInput
                focusId={`todos/${index}/label`}
                type="text"
                value={todo.label}
                onChange={({ target }) =>
                  proposeSetTodoLabel({
                    index: Number(target.getAttribute('data-index')),
                    label: target.value,
                  })
                }
                data-index={index}
              />
            </li>
          ))}
          <li>
            <Focus focusId="todos/add">
              <button onClick={() => proposeAddTodo()}>Add…</button>
            </Focus>
          </li>
        </ul>
      </main>
    </div>
  );
}
