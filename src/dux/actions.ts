import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory();

export const setTitle = actionCreator<{
  title: string;
}>('SET_TITLE');

export const setSubtitle = actionCreator<{
  subtitle: string;
}>('SET_SUBTITLE');

export const setTodoDone = actionCreator<{
  index: number;
  done: boolean;
}>('SET_TODO_DONE');

export const setTodoLabel = actionCreator<{
  index: number;
  label: string;
}>('SET_TODO_LABEL');

export const addTodo = actionCreator('ADD_TODO');
