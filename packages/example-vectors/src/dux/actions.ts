import actionCreatorFactory from 'typescript-fsa';
import { ShapeType } from './model';

const actionCreator = actionCreatorFactory();

export const setTitle = actionCreator<{
  title: string;
}>('SET_TITLE');

export const createCanvas = actionCreator<{
  width: number;
  height: number;
}>('CREATE_CANVAS');

export const setLongText = actionCreator<{
  text: string;
}>('SET_LONG_TEXT');

export const setTodoDone = actionCreator<{
  index: number;
  done: boolean;
}>('SET_TODO_DONE');

export const setTodoLabel = actionCreator<{
  index: number;
  label: string;
}>('SET_TODO_LABEL');

export const moveTodo = actionCreator<{
  index: number;
  newIndex: number;
}>('MOVE_TODO');

export const addShape = actionCreator<{
  shape: ShapeType;
}>('ADD_SHAPE');

export const updateShape = actionCreator<{
  key: string;
  shape: Partial<ShapeType>;
}>('UPDATE_SHAPE');

export const removeUsers = actionCreator<{
  users: string[];
}>('REMOVE_USERS');

export const setUserName = actionCreator<{
  session: string;
  username: string;
}>('SET_USER_NAME');

export const setUserFocus = actionCreator<{
  session: string;
  focus?: string;
  select?: [number, number];
}>('SET_USER_FOCUS');

export const setUserSelectedShape = actionCreator<{
  session: string;
  key?: string;
}>('SET_SELECTED_SHAPE');
