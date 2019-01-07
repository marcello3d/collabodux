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
import { usePropose } from './client/collabodux-fsa-hooks';
import { collabodux } from './dux/connection';
import { useUserMap } from './dux/use-user-map';
import Focus from './components/Focus';
import FocusInput from './components/FocusInput';
import FocusTextarea from './components/FocusTextarea';

export function App() {
  const proposeSetTitle = usePropose(collabodux, setTitle);
  const proposeSetSubtitle = usePropose(collabodux, setSubtitle);
  const proposeSetLongText = usePropose(collabodux, setLongText);
  const proposeSetTodoDone = usePropose(collabodux, setTodoDone);
  const proposeSetTodoLabel = usePropose(collabodux, setTodoLabel);
  const proposeAddTodo = usePropose(collabodux, addTodo);
  const proposeSetUserName = usePropose(collabodux, setUserName);

  const currentSession = useSession(collabodux);
  const { title, subtitle, longtext, todos } = useMappedLocalState(
    collabodux,
    ({ title, subtitle, longtext, todos }) => {
      return { title, subtitle, longtext, todos };
    },
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
                    priorUsername: currentUsername,
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
        <p>
          <label>
            Title:{' '}
            <FocusInput
              focusId="title"
              value={title}
              onChange={({ target }) =>
                proposeSetTitle({ priorTitle: title, title: target.value })
              }
            />
          </label>
        </p>
        <p>
          <label>
            Subtitle:{' '}
            <FocusInput
              focusId="subtitle"
              value={subtitle}
              onChange={({ target }) =>
                proposeSetSubtitle({
                  priorSubtitle: subtitle,
                  subtitle: target.value,
                })
              }
            />
          </label>
        </p>
        <p>
          <label htmlFor="longtext">Long Text:</label>
          <div>
            <FocusTextarea
              focusId="longtext"
              id="longtext"
              value={longtext}
              cols={80}
              rows={20}
              onChange={({ target }) =>
                proposeSetLongText({
                  priorText: longtext,
                  text: target.value,
                })
              }
            />
          </div>
        </p>
        <p>
          Todo list:
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
                      priorLabel: todo.label,
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
        </p>
      </main>
    </div>
  );
}
