import React from 'react';
import styles from './App.module.css';
import { useMappedLocalState } from '@collabodux/react-hooks';
import { setTitle } from './dux/actions';
import { useDispatch } from './dux/collabodux-fsa-hooks';
import { collabodux } from './dux/connection';
import FocusInput from './components/FocusInput';
import { reducer } from './dux/reducer';
import Canvas from './components/Canvas';
import Users from './components/Users';

export function App() {
  const proposeSetTitle = useDispatch(collabodux, reducer, setTitle);
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
      <Users />
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
        <Canvas />
      </main>
    </div>
  );
}
