export interface ModelState {
  title?: string;
  subtitle?: string;
  todos?: Todo[];
  users?: Record<string, User>;
}

export interface User {
  username?: string;
  focus?: string;
}

export interface Todo {
  done: boolean;
  label: string;
}
