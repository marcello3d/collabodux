import uuid from 'uuid/v4';

import { createMutatorFactory } from '../../dux/use-mutate';
import { ITodo, ModelStateType } from './model';
import { moveArrayItem } from '../../utils/array-move';
import { EditMetadata } from '../../dux/edit-merge';

const createMutator = createMutatorFactory<ModelStateType, EditMetadata>();

export const setTitle = createMutator<{
  title: string;
}>((draft, { title }) => {
  draft.title = title;
  return { type: 'edit-title', merge: 10 };
});

export const setSubtitle = createMutator<{
  subtitle: string;
}>((draft, { subtitle }) => {
  draft.subtitle = subtitle;
  return { type: 'edit-subtitle', merge: 10 };
});

export const setLongText = createMutator<{
  text: string;
}>((draft, { text }) => {
  draft.longtext = text;
  return { type: 'edit-long-text', merge: 10 };
});

export const setTodoDone = createMutator<{
  index: number;
  done: boolean;
}>((draft, { index, done }) => {
  if (draft.todos && draft.todos[index]) {
    draft.todos[index].done = done;
  }
  return { type: `set-todo-done-${index}` };
});

export const setTodoLabel = createMutator<{
  index: number;
  label: string;
}>((draft, { index, label }) => {
  if (draft.todos && draft.todos[index]) {
    draft.todos[index].label = label;
  }
  return { type: `edit-todo-label-${index}` };
});

export const moveTodo = createMutator<{
  index: number;
  newIndex: number;
}>(({ todos }, { index, newIndex }) => {
  moveArrayItem(todos, index, newIndex);
  return { type: `move-todo-${index}-${newIndex}` };
});

export const addTodo = createMutator<void>((draft) => {
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
  return { type: `add-todo` };
});
