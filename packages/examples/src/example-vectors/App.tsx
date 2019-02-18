import React from 'react';
import styles from './App.module.css';
import { useMappedLocalState } from '@collabodux/react-hooks';
import { collabodux } from './model/connection';
import FocusInput from '../components/FocusInput';
import Canvas from './components/Canvas';
import Users from '../components/Users';
import { setTitle } from './model/mutators';
import { useMutate } from '../dux/mutator';

export function App() {
  const mutate = useMutate(collabodux);
  const { title } = useMappedLocalState(
    collabodux,
    ({ title, subtitle, longtext, todos }) => ({
      title,
      subtitle,
      longtext,
      todos,
    }),
  );

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        Collabodux 1 by <a href="https://marcello.cellosoft.com/">marcello</a>
      </header>
      <Users collabodux={collabodux} />
      <main>
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
        <Canvas />
      </main>
    </div>
  );
}
