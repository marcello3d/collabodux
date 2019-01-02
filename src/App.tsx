import React from 'react';
import styles from './App.module.css';
import {
  useMappedLocalState,
  useSession,
  useSessions,
} from './client/collabodux-hooks';
import {
  addTodo,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
  setUserFocus,
  setUserName,
} from './dux/actions';
import { usePropose } from './client/collabodux-fsa-hooks';
import { ModelState, User } from './dux/model';
import { collabodux } from './dux/connection';
import { useUserMap } from './dux/use-user-map';
import Focus from './components/Focus';

export function App() {
  const proposeSetTitle = usePropose(collabodux, setTitle);
  const proposeSetSubtitle = usePropose(collabodux, setSubtitle);
  const proposeSetTodoDone = usePropose(collabodux, setTodoDone);
  const proposeSetTodoLabel = usePropose(collabodux, setTodoLabel);
  const proposeAddTodo = usePropose(collabodux, addTodo);
  const proposeSetUserName = usePropose(collabodux, setUserName);

  const currentSession = useSession(collabodux);
  const { title, subtitle, todos } = useMappedLocalState(
    collabodux,
    (state: ModelState) => {
      const { title = '', subtitle = '', todos = [], users = {} } = state;
      return {
        title,
        subtitle,
        todos,
      };
    },
  );
  const userMap = useUserMap(collabodux);

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabodux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <nav className={styles.nav}>
        <input
          type="text"
          disabled={!currentSession}
          value={currentSession ? userMap[currentSession].username : ''}
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
            const { username = '' } = userMap[session];
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
            <Focus focusId="title">
              <input
                value={title}
                onChange={({ target }) =>
                  proposeSetTitle({ title: target.value })
                }
              />
            </Focus>
          </label>
        </div>
        <div>
          <label>
            Subtitle:{' '}
            <Focus focusId="subtitle">
              <input
                value={subtitle}
                data-focus-id="subtitle"
                onChange={({ target }) =>
                  proposeSetSubtitle({ subtitle: target.value })
                }
              />
            </Focus>
          </label>
        </div>
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
              <Focus focusId={`todos/${index}/label`}>
                <input
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
              </Focus>
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
