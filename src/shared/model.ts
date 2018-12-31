export interface ModelState {
  title: string;
  subtitle: string;
  todos: Todo[];
}
export const initialModelState: ModelState = {
  title: '',
  subtitle: '',
  todos: [],
};

export interface Todo {
  done: boolean;
  label: string;
}
