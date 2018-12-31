export interface ModelState {
  title?: string;
  subtitle?: string;
  todos?: Todo[];
}

export interface Todo {
  done: boolean;
  label: string;
}
