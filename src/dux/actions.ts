import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory();

export const loadState = actionCreator<{
  newState: any;
}>('LOAD_STATE');

export const setTitle = actionCreator<{
  priorTitle: string;
  title: string;
}>('SET_TITLE');

export const setSubtitle = actionCreator<{
  priorSubtitle: string;
  subtitle: string;
}>('SET_SUBTITLE');

export const setLongText = actionCreator<{
  priorText: string;
  text: string;
}>('SET_LONG_TEXT');

export const setTodoDone = actionCreator<{
  index: number;
  done: boolean;
}>('SET_TODO_DONE');

export const setTodoLabel = actionCreator<{
  index: number;
  priorLabel: string;
  label: string;
}>('SET_TODO_LABEL');

export const addTodo = actionCreator('ADD_TODO');

export const removeUsers = actionCreator<{
  users: string[];
}>('REMOVE_USERS');

export const setUserName = actionCreator<{
  session: string;
  priorUsername: string;
  username: string;
}>('SET_USER_NAME');

export const setUserFocus = actionCreator<{
  session: string;
  focus?: string;
  select?: [number, number];
}>('SET_USER_FOCUS');
