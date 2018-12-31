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
    todos,
  } = useClientLocalState(client);
  const onTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const title = event.currentTarget.value;
      client.propose((draft) => {
        draft.title = title;
      })
    },
    []
  );
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabadux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <main>
        <input value={title} onChange={onTitleChange} />
        <ul>
          {todos.map((todo, index) =>
            <li key={index}>
              <input type="checkbox" checked={todo.done} disabled /> {todo.label}
            </li>)
          }
        </ul>
      </main>
    </div>
  );
}
