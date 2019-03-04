import React from 'react';
import styles from './App.module.css';
import { useMappedLocalState, useUndoRedo } from '@collabodux/react-hooks';
import {
  addTodo,
  moveTodo,
  setLongText,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
} from './model/mutators';
import { collabodux } from './model/connection';
import FocusInput from '../components/FocusInput';
import FocusTextarea from '../components/FocusTextarea';
import Users from '../components/Users';
import Focus from '../components/Focus';
import { useMutate } from '../dux/mutator';

export function App() {
  const mutate = useMutate(collabodux);

  const { title, subtitle, longtext, todos } = useMappedLocalState(
    collabodux,
    ({ title, subtitle, longtext, todos }) => ({
      title,
      subtitle,
      longtext,
      todos,
    }),
  );
  const { undo, redo } = useUndoRedo(collabodux);

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabodux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <Users collabodux={collabodux} />
      <main>
        <div>
          <button onClick={undo} disabled={!undo}>
            Undo
          </button>
          <button onClick={redo} disabled={!redo}>
            Redo
          </button>
        </div>
        <div>
          <label>
            Title:{' '}
            <FocusInput
              collabodux={collabodux}
              focusId="title"
              value={title}
              onChange={({ target }) =>
                mutate(setTitle({ title: target.value }))
              }
            />
          </label>
        </div>
        <div>
          <label>
            Subtitle:{' '}
            <FocusInput
              collabodux={collabodux}
              focusId="subtitle"
              value={subtitle}
              onChange={({ target }) =>
                mutate(
                  setSubtitle({
                    subtitle: target.value,
                  }),
                )
              }
            />
          </label>
        </div>
        <div>
          <label htmlFor="longtext">Long Text:</label>
        </div>
        <div>
          <FocusTextarea
            collabodux={collabodux}
            focusId="longtext"
            id="longtext"
            value={longtext}
            cols={80}
            rows={20}
            onChange={({ target }) =>
              mutate(
                setLongText({
                  text: target.value,
                }),
              )
            }
          />
        </div>
        <div>Todo list:</div>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>
              <Focus collabodux={collabodux} focusId={`todos/${index}/done`}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={({ target }) =>
                    mutate(
                      setTodoDone({
                        index,
                        done: target.checked,
                      }),
                    )
                  }
                  data-index={index}
                />
              </Focus>{' '}
              <FocusInput
                collabodux={collabodux}
                focusId={`todos/${index}/label`}
                type="text"
                value={todo.label}
                onChange={({ target }) => {
                  console.log('onchange');
                  mutate(setTodoLabel({ index, label: target.value }));
                }}
                data-index={index}
              />{' '}
              <Focus collabodux={collabodux} focusId={`todos/${index}/move-up`}>
                <button
                  onClick={() =>
                    mutate(moveTodo({ index, newIndex: index - 1 }))
                  }
                >
                  🔼
                </button>
              </Focus>{' '}
              <Focus
                collabodux={collabodux}
                focusId={`todos/${index}/move-down`}
              >
                <button
                  onClick={() =>
                    mutate(moveTodo({ index, newIndex: index + 1 }))
                  }
                >
                  🔽
                </button>
              </Focus>
            </li>
          ))}
          <li>
            <Focus collabodux={collabodux} focusId="todos/add">
              <button onClick={() => mutate(addTodo())}>Add…</button>
            </Focus>
          </li>
        </ul>
      </main>
    </div>
  );
}
