import { JSONObject } from 'json-diff3';

type Undo<State> = {
  before: State;
  after: State;
};
type UndoSet<State> = Undo<State>[];
type UndoMerger<State> = (base: State, local: State, remote: State) => State;

export class UndoManager<State extends JSONObject> {
  private _snapshot = false;
  private _undos: UndoSet<State>[] = [];
  private _redos: UndoSet<State>[] = [];

  constructor(private readonly mergeStates: UndoMerger<State>) {}

  /**
   * Track edit in current undo set
   */
  trackEdit(before: State, after: State): State {
    const undos = this._undos;
    if (undos.length === 0 || this._snapshot) {
      undos.push([]);
      this._snapshot = false;
    }
    const set = undos[undos.length - 1];
    const undo = set[set.length - 1];
    if (undo && undo.after === before) {
      // Optimization, if multiple edits happen in sequence, we can use
      // the first "before" and last "after"
      undo.after = after;
    } else {
      set.push({
        before,
        after,
      });
    }
    this._redos = [];
    return after;
  }

  /**
   * Ends the current undo group (if there is one)
   *
   * Subsequent edits will be part of a new undo set
   */
  snapshot(): void {
    this._snapshot = true;
  }

  /**
   * Is undo available
   */
  get hasUndo(): boolean {
    return this._undos.length > 0;
  }

  /**
   * Is redo available
   */
  get hasRedo(): boolean {
    return this._redos.length > 0;
  }

  /**
   * Undo the last undo set of local changes
   */
  undo(state: State): State {
    const set = this._undos.pop();
    if (set) {
      for (let i = set.length; --i >= 0; ) {
        const { before, after } = set[i];
        state = this.mergeStates(after, before, state);
      }
      this._redos.push(set);
    }
    return state;
  }

  /**
   * Redo the last undo (if any)
   */
  redo(state: State): State {
    const set = this._redos.pop();
    if (set) {
      for (const { before, after } of set) {
        state = this.mergeStates(before, after, state);
      }
      this._undos.push(set);
    }
    return state;
  }
}
