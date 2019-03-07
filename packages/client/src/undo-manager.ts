import { JSONObject } from 'json-diff3';
import { Merger } from './index';

export type Undo<State, Metadata> = {
  edits: {
    before: State;
    after: State;
  }[];
  count: number;
  metadata: Metadata;
};

export class UndoManager<State extends JSONObject, Metadata = undefined> {
  private _undos: Undo<State, Metadata>[] = [];
  private _redos: Undo<State, Metadata>[] = [];

  constructor(private readonly mergeStates: Merger<State>) {}

  /**
   * Track edit in current undo set
   */
  trackEdit(
    before: State,
    after: State,
    metadata: Metadata,
    merge: boolean = false,
  ): State {
    const undos = this._undos;
    let undo = undos[undos.length - 1];
    if (undos.length === 0 || !merge) {
      undo = {
        edits: [],
        count: 0,
        metadata,
      };
      undos.push(undo);
    }
    const { edits } = undo;
    const lastEdit = edits[edits.length - 1];
    if (lastEdit && lastEdit.after === before) {
      // Optimization: if multiple edits happen in sequence, we can use
      // the first "before" and last "after"
      lastEdit.after = after;
    } else {
      edits.push({
        before,
        after,
      });
    }
    undo.count++;
    undo.metadata = metadata;
    this._redos = [];
    return after;
  }

  /**
   * Is undo available
   */
  get nextUndo(): Undo<State, Metadata> | undefined {
    return this._undos[this._undos.length - 1];
  }

  /**
   * Is redo available
   */
  get nextRedo(): Undo<State, Metadata> | undefined {
    return this._redos[this._redos.length - 1];
  }

  /**
   * Undo the last undo set of local changes
   */
  undo(state: State): State {
    const undo = this._undos.pop();
    if (undo) {
      for (let i = undo.edits.length; --i >= 0; ) {
        const { before, after } = undo.edits[i];
        state = this.mergeStates(after, before, state);
      }
      this._redos.push(undo);
    }
    return state;
  }

  /**
   * Redo the last undo (if any)
   */
  redo(state: State): State {
    const redo = this._redos.pop();
    if (redo) {
      for (const { before, after } of redo.edits) {
        state = this.mergeStates(before, after, state);
      }
      this._undos.push(redo);
    }
    return state;
  }
}
