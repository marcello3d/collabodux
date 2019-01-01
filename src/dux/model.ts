export interface ModelState {
  title?: string;
  subtitle?: string;
  todos?: Todo[];
  users?: {
    [key: string]: {
      username: string;
      focusElement: string;
      selectionStart: number;
      selectionEnd: number;
    }
  }
}

export interface Todo {
  done: boolean;
  label: string;
}
