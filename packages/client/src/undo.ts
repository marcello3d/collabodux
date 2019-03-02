import { JSONObject } from 'json-diff3';
import { Merger } from './index';

type Undo<State> = {
  before: State;
  after: State;
  complete: boolean;
};
type UndoSet<State> = Undo<State>[];

export class UndoManager<State extends JSONObject> {
  private _snapshot = false;
  private _undos: UndoSet<State>[] = [];
  private _state: State;
  private _redos: UndoSet<State>[] = [];

  constructor(initialState: State, private readonly merger: Merger<State>) {
    this._state = initialState;
  }

  /**
   * Get current state
   */
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

  /**
   * Specify a new document based on local edits.
   *
   * These edits will be undo-able
   *
   * @param newState
   */
  addLocalEdit(newState: State): void {
    if (this._snapshot) {
      this._undos.push([]);
      this._snapshot = false;
    }
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

  /**
   * Specify a new document based on remote edits (or local edits you don't
   * want to allow undoing, such as mode and selection changes).
   *
   * These edits will not be undo-able
   *
   * @param newState
   */
  addRemoteEdit(newState: State): void {
    const { undo } = this.lastUndo;
    if (!undo.complete) {
      undo.after = this._state;
      undo.complete = true;
    }
    this._state = newState;
  }

  /**
   * Ends the current undo group (if there is one)
   *
   * Subsequent edits will be part of a new undo set
   */
  snapshot(): void {
    if (this._undos.length === 0) {
      return;
    }
    const { undo } = this.lastUndo;
    undo.complete = true;
    this._snapshot = true;
  }

  /**
   * Is undo available
   */
  canUndo(): boolean {
    return this._undos.length > 0;
  }

  /**
   * Is redo available
   */
  canRedo(): boolean {
    return this._redos.length > 0;
  }
  /**
   * Undo the last undo set of local changes
   */
  undo(): boolean {
    if (this._undos.length === 0) {
      return false;
    }
    const { undo, set } = this.lastUndo;
    undo.complete = true;
    for (let i = set.length; --i >= 0; ) {
      const { before, after } = set[i];
      this._state = this.merger(after, before, this._state);
    }
    this._undos.pop();
    this._redos.push(set);
    return true;
  }

  /**
   * Redo the last undo (if any)
   */
  redo(): boolean {
    const set = this._redos.pop();
    if (!set) {
      return false;
    }
    for (const { before, after } of set) {
      this._state = this.merger(before, after, this._state);
    }
    this._undos.push(set);
    return true;
  }
}
