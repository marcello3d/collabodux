import {
  addTodo,
  loadState,
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
import { IModelState, ITodo, IUser, validateAndAddDefaults } from './model';
import produce, { Draft } from 'immer';
import shallowequal from 'shallowequal';
import { diff3MergeStrings } from '../utils/merge-edits';

export const reducer = fsaReducerBuilder<IModelState>()
  .add(loadState, (state, { newState }) => validateAndAddDefaults(newState))
  .add(
    setTitle,
    produce((draft, { priorTitle, title }) => {
      draft.title = diff3MergeStrings(priorTitle, draft.title, title);
    }),
  )
  .add(
    setSubtitle,
    produce((draft, { priorSubtitle, subtitle }) => {
      draft.subtitle = diff3MergeStrings(
        priorSubtitle,
        draft.subtitle,
        subtitle,
      );
    }),
  )
  .add(
    setLongText,
    produce((draft, { priorText, text }) => {
      draft.longtext = diff3MergeStrings(priorText, draft.longtext, text);
    }),
  )
  .add(
    addTodo,
    produce((draft) => {
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
    produce((draft, { index, priorLabel, label }) => {
      if (draft.todos && draft.todos[index]) {
        draft.todos[index].label = diff3MergeStrings(
          priorLabel,
          draft.todos[index].label,
          label,
        );
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
    removeUsers,
    produce((draft, { users }) => {
      users.forEach((user) => {
        delete draft.users[user];
      });
    }),
  )
  .add(
    setUserName,
    produce((draft, { session, priorUsername, username }) => {
      const user = ensureUser(draft, session);
      user.username = diff3MergeStrings(priorUsername, user.username, username);
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
