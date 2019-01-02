import {
  addTodo,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel, setUserFocus, setUserName,
} from './actions';
import { patch } from './immer';
import { fsaReducerBuilder } from './fsa-reducer-builder';
import { ModelState, Todo, User } from './model';
import { applyPatches, Draft, Patch } from 'immer';

export const applyPatch = (state: ModelState, patch: Patch[]) =>
  applyPatches(state, patch);

export const reducer = fsaReducerBuilder<ModelState, Patch[]>()
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
      const todo: Todo = {
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
    setUserName,
    patch((draft, { session, username }) => {
      ensureUser(draft, session).username = username;
    }),
  )
  .add(
    setUserFocus,
    patch((draft, { session, focus, selectStart, selectEnd }) => {
      const user = ensureUser(draft, session);
      user.focus = focus;
      user.selectStart = selectStart;
      user.selectEnd = selectEnd;
    }),
  )
  .build();

function ensureUser(draft: Draft<ModelState>, session: string): User {
  if (!draft.users) {
    draft.users = {};
  }
  if (!draft.users[session]) {
    draft.users[session] = {};
  }
  return draft.users[session];
}
