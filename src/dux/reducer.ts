import {
  addTodo,
  setSubtitle,
  setTitle,
  setTodoDone,
  setTodoLabel,
} from './actions';
import { patch } from './immer';
import { fsaReducerBuilder } from './fsa-reducer-builder';
import { ModelState, Todo } from './model';
import { applyPatches, Patch } from 'immer';

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
  .build();
