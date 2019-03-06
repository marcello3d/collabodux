import uuid from 'uuid/v4';

import { createMutatorFactory } from '../../dux/use-mutate';
import { ITodo, ModelStateType } from './model';
import { moveArrayItem } from '../../utils/array-move';

const createMutator = createMutatorFactory<ModelStateType>();

export const setTitle = createMutator<{
  title: string;
}>(
  (draft, { title }) => {
    draft.title = title;
  },
  true,
  true,
);

export const setSubtitle = createMutator<{
  subtitle: string;
}>(
  (draft, { subtitle }) => {
    draft.subtitle = subtitle;
  },
  true,
  true,
);

export const setLongText = createMutator<{
  text: string;
}>(
  (draft, { text }) => {
    draft.longtext = text;
  },
  true,
  true,
);

export const setTodoDone = createMutator<{
  index: number;
  done: boolean;
}>(
  (draft, { index, done }) => {
    if (draft.todos && draft.todos[index]) {
      draft.todos[index].done = done;
    }
  },
  true,
  true,
);

export const setTodoLabel = createMutator<{
  index: number;
  label: string;
}>(
  (draft, { index, label }) => {
    if (draft.todos && draft.todos[index]) {
      draft.todos[index].label = label;
    }
  },
  true,
  true,
);

export const moveTodo = createMutator<{
  index: number;
  newIndex: number;
}>(
  ({ todos }, { index, newIndex }) => {
    moveArrayItem(todos, index, newIndex);
  },
  true,
  true,
);

export const addTodo = createMutator<void>(
  (draft) => {
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
  },
  true,
  true,
);
