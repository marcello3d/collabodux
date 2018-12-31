import React, { useCallback } from 'react';
import styles from './App.module.css';
import { useClientLocalState } from './client/useClient';
import { initialModelState, ModelState } from './shared/model';
import { Client } from './client/client';
import { Connection } from './client/ws';


const connection = new Connection(new WebSocket('ws://localhost:4000'));
const client = new Client<ModelState>(initialModelState, connection);

export function App() {
  const {
    title,
    subtitle,
    todos,
  } = useClientLocalState(client);
  const onTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      client.propose((draft) => {
        draft.title = value;
      })
    },
    [client]
  );
  const onSubtitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      client.propose((draft) => {
        draft.subtitle = value;
      })
    },
    [client]
  );
  const onToggleTodo = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.currentTarget.getAttribute('data-index'));
      const checked = event.currentTarget.checked;
      client.propose((draft) => {
        draft.todos[index].done = checked;
      })
    },
    [client]
  );
  const onChangeTodo = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.currentTarget.getAttribute('data-index'));
      const value = event.currentTarget.value;
      client.propose((draft) => {
        draft.todos[index].label = value;
      })
    },
    [client]
  );
  const onClickAddTodo = useCallback(
    () => client.propose((draft) => {
      draft.todos.push({
        label: '',
        done: false,
      });
    }),
    [client]
  );
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabadux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <main>
        <div>
          <label>Title: <input value={title} onChange={onTitleChange} /></label>
        </div>
        <div>
          <label>Subtitle: <input value={subtitle} onChange={onSubtitleChange} /></label>
        </div>
        <ul>
          {todos.map((todo, index) =>
            <li key={index}>
              <input type="checkbox" checked={todo.done} onChange={onToggleTodo} data-index={index} /> <input type="text" value={todo.label} onChange={onChangeTodo} data-index={index} />
            </li>)
          }
          <li><button onClick={onClickAddTodo}>Add…</button></li>
        </ul>
      </main>
    </div>
  );
}
