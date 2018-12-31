import React from 'react';
import styles from './App.module.css';
import { useMappedLocalState } from './client/collabodux-hooks';
import { Collabodux } from './client/collabodux';
import { Connection } from './client/ws';
import {
  addTodo,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
} from './dux/actions';
import { reducer } from './dux/reducer';
import { usePropose } from './client/collabodux-fsa-hooks';

const connection = new Connection(new WebSocket('ws://localhost:4000'));
const collabodux = new Collabodux(connection, reducer);

export function App() {
  const proposeSetTitle = usePropose(collabodux, setTitle);
  const proposeSetSubtitle = usePropose(collabodux, setSubtitle);
  const proposeSetTodoDone = usePropose(collabodux, setTodoDone);
  const proposeSetTodoLabel = usePropose(collabodux, setTodoLabel);
  const proposeAddTodo = usePropose(collabodux, addTodo);

  const { title, subtitle, todos } = useMappedLocalState(
    collabodux,
    ({ title = '', subtitle = '', todos = [] }) => {
      return {
        title,
        subtitle,
        todos,
      };
    },
  );
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabodux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <main>
        <div>
          <label>
            Title:{' '}
            <input
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
            <input
              value={subtitle}
              onChange={({ target }) =>
                proposeSetSubtitle({ subtitle: target.value })
              }
            />
          </label>
        </div>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>
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
              />{' '}
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
            </li>
          ))}
          <li>
            <button onClick={() => proposeAddTodo()}>Add…</button>
          </li>
        </ul>
      </main>
    </div>
  );
}
