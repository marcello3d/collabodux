import {
  addTodo,
  moveTodo,
  removeUsers,
  setLongText,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
  setUserFocus,
  setUserName,
} from './actions';
import { fsaReducerBuilder } from './fsa-reducer-builder';
import { IModelState, ITodo, IUser } from './model';
import produce, { Draft } from 'immer';
import shallowequal from 'shallowequal';
import uuid from 'uuid/v4';
import { moveArrayItem } from '../utils/array-move';

export const reducer = fsaReducerBuilder<IModelState>()
  .add(
    setTitle,
    produce((draft, { title }) => {
      draft.title = title;
    }),
  )
  .add(
    setSubtitle,
    produce((draft, { subtitle }) => {
      draft.subtitle = subtitle;
    }),
  )
  .add(
    setLongText,
    produce((draft, { text }) => {
      draft.longtext = text;
    }),
  )
  .add(
    addTodo,
    produce((draft) => {
      const todo: ITodo = {
        key: uuid(),
        label: '',
        done: false,
      };
      if (draft.todos) {
        draft.todos.push(todo);
      } else {
        draft.todos = [todo];
      }
    }),
  )
  .add(
    setTodoLabel,
    produce((draft, { index, label }) => {
      if (draft.todos && draft.todos[index]) {
        draft.todos[index].label = label;
      }
    }),
  )
  .add(
    setTodoDone,
    produce((draft, { index, done }) => {
      if (draft.todos && draft.todos[index]) {
        draft.todos[index].done = done;
      }
    }),
  )
  .add(
    moveTodo,
    produce(({ todos }, { index, newIndex }) => {
      moveArrayItem(todos, index, newIndex);
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
  .build();

function ensureUser(draft: Draft<IModelState>, session: string): Draft<IUser> {
  if (!draft.users[session]) {
    draft.users[session] = {
      username: '',
      focus: undefined,
      select: undefined,
    };
  }
  return draft.users[session];
}
