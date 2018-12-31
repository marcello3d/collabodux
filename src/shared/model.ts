export interface ModelState {
  title: string;
  todos: Todo[];
}
export const initialModelState = {
  title: '',
  todos: [],
};

export interface Todo {
  done: boolean;
  label: string;
}
