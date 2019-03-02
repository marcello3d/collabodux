import { JSONObject } from 'json-diff3';
import { Merger } from './index';

type Undo<State> = {
  before: State;
  after: State;
  complete: boolean;
};
type UndoSet<State> = Undo<State>[];

export class UndoManager<State extends JSONObject> {
  private _undos: UndoSet<State>[] = [];
  private _state: State;
  private _redos: UndoSet<State>[] = [];

  constructor(initialState: State, private readonly merger: Merger<State>) {
    this._state = initialState;
  }

  get state(): State {
    return this._state;
  }

  private get lastUndo(): { set: UndoSet<State>; undo: Undo<State> } {
    if (this._undos.length === 0) {
      this._undos.push([]);
    }
    const set = this._undos[this._undos.length - 1];
    if (set.length === 0) {
      set.push({
        before: this._state,
        after: this._state,
        complete: false,
      });
    }
    return { set, undo: set[set.length - 1] };
  }

  addLocalEdit(newState: State): void {
    const { undo, set } = this.lastUndo;
    if (undo.complete) {
      set.push({
        before: this._state,
        after: newState,
        complete: false,
      });
    } else {
      undo.after = newState;
    }
    this._redos = [];
    this._state = newState;
  }
  addRemoteEdit(newState: State): void {
    const { undo } = this.lastUndo;
    if (!undo.complete) {
      undo.after = this._state;
      undo.complete = true;
    }
    this._state = newState;
  }
  snapshot(): void {
    const { undo } = this.lastUndo;
    undo.complete = true;
    this._undos.push([]);
  }
  undo(): void {
    if (this._undos.length === 0) {
      return;
    }
    const { undo, set } = this.lastUndo;
    undo.complete = true;
    for (let i = set.length; --i >= 0; ) {
      const { before, after } = set[i];
      this._state = this.merger(after, before, this._state);
    }
    this._undos.pop();
    this._redos.push(set);
  }
  redo(): void {
    const set = this._redos.pop();
    if (!set) {
      return;
    }
    for (const { before, after } of set) {
      this._state = this.merger(before, after, this._state);
    }
    this._undos.push(set);
  }
}
