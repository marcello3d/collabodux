import {
  addTodo,
  loadState,
  removeUsers,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
  setUserFocus,
  setUserName,
} from './actions';
import { patch } from './immer';
import { fsaReducerBuilder } from './fsa-reducer-builder';
import { IModelState, ITodo, IUser, validateAndAddDefaults } from './model';
import { applyPatches, Draft, Patch } from 'immer';
import shallowequal from 'shallowequal';

export const reducer = fsaReducerBuilder<IModelState, Patch>()
  .add(loadState, (state, { newState }) => validateAndAddDefaults(newState))
  .add(
    setTitle,
    patch((draft, { title }) => {
      draft.title = title;
    }),
  )
  .add(
    setSubtitle,
    patch((draft, { subtitle }) => {
      draft.subtitle = subtitle;
    }),
  )
  .add(
    addTodo,
    patch((draft) => {
      const todo: ITodo = {
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
    patch((draft, { index, label }) => {
      if (draft.todos && draft.todos[index]) {
        draft.todos[index].label = label;
      }
    }),
  )
  .add(
    setTodoDone,
    patch((draft, { index, done }) => {
      if (draft.todos && draft.todos[index]) {
        draft.todos[index].done = done;
      }
    }),
  )
  .add(
    removeUsers,
    patch((draft, { users }) => {
      users.forEach((user) => {
        delete draft.users[user];
      });
    }),
  )
  .add(
    setUserName,
    patch((draft, { session, username }) => {
      ensureUser(draft, session).username = username;
    }),
  )
  .add(
    setUserFocus,
    patch((draft, { session, focus, select }) => {
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
