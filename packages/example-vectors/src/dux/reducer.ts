import {
  addShape,
  createCanvas,
  removeUsers,
  setTitle,
  setUserFocus,
  setUserName,
  setUserSelectedShape,
  updateShape,
} from './actions';
import { fsaReducerBuilder } from './fsa-reducer-builder';
import { ModelStateType, UserType } from './model';
import produce, { Draft } from 'immer';
import shallowequal from 'shallowequal';

function ensureUser(
  draft: Draft<ModelStateType>,
  session: string,
): Draft<UserType> {
  if (!draft.users[session]) {
    draft.users[session] = {
      username: '',
      focus: undefined,
      select: undefined,
      selectedShape: undefined,
    };
  }
  return draft.users[session];
}

export const reducer = fsaReducerBuilder<ModelStateType>()
  .add(
    setTitle,
    produce((draft, { title }) => {
      draft.title = title;
    }),
  )
  .add(
    createCanvas,
    produce((draft, { width, height }) => {
      draft.canvas = { width, height, shapes: [] };
    }),
  )
  .add(
    addShape,
    produce((draft, { shape }) => {
      if (draft.canvas) {
        draft.canvas.shapes.push(shape);
      }
    }),
  )
  .add(
    updateShape,
    produce((draft, { key, shape }) => {
      if (draft.canvas) {
        const existingShape = draft.canvas.shapes.find(
          ({ key: _key }) => key === _key,
        );
        if (existingShape) {
          Object.assign(existingShape, shape);
        }
      }
    }),
  )
  .add(
    removeUsers,
    produce((draft, { users }) => {
      users.forEach((user) => {
        delete draft.users[user];
      });
    }),
  )
  .add(
    setUserName,
    produce((draft, { session, username }) => {
      ensureUser(draft, session).username = username;
    }),
  )
  .add(
    setUserFocus,
    produce((draft, { session, focus, select }) => {
      const user = ensureUser(draft, session);
      user.focus = focus;
      if (!shallowequal(user.select, select)) {
        user.select = select;
      }
    }),
  )
  .add(
    setUserSelectedShape,
    produce((draft, { session, key }) => {
      ensureUser(draft, session).selectedShape = key;
    }),
  )
  .build();
