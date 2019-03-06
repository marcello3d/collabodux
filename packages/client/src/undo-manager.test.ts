import { diff3, JSONObject } from 'json-diff3';
import { UndoMerger, UndoManager } from './undo-manager';

function makeManager<Metadata>(mergeEdit?: UndoMerger<JSONObject, Metadata>) {
  return new UndoManager<JSONObject, Metadata>(
    (base, local, remote) => diff3(base, local, remote) as JSONObject,
    mergeEdit,
  );
}

function makeTypeBasedManager() {
  return makeManager<{ type: string }>(
    (undo, { type }) => undo.metadata.type === type,
  );
}

function makeTimeBasedManager() {
  return makeManager<{ time: number }>(
    (undo, { time }) => time < undo.metadata.time + 10,
  );
}

function makeLengthBasedManager() {
  return makeManager(({ count }) => count < 5);
}

describe('UndoManager', () => {
  it('undo one local edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    expect(state).toEqual({
      firstName: 'foo',
    });
    expect(manager.nextUndo).toBeDefined();
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('double-undo one edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    expect(manager.nextUndo).toBeDefined();
    state = manager.undo(state);
    expect(manager.nextUndo).toBeUndefined();
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('undo-redo one local edit', () => {
    const manager = makeManager();

    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    expect(manager.nextUndo).toBeDefined();
    state = manager.undo(state);
    expect(manager.nextUndo).toBeUndefined();
    expect(manager.nextRedo).toBeDefined();
    state = manager.redo(state);
    expect(manager.nextRedo).toBeUndefined();
    expect(state).toEqual({
      firstName: 'foo',
    });
  });

  it('undo-double-redo one local edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    state = manager.undo(state);
    state = manager.redo(state);
    state = manager.redo(state);
    expect(state).toEqual({
      firstName: 'foo',
    });
  });

  it('redo with no edits', () => {
    const manager = makeManager();
    let state = {};
    state = manager.redo(state);
    expect(state).toEqual({});
  });

  it('undo two local edits', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
        lastName: 'foo',
      },
      {},
    );
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('cannot redo after edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    state = manager.undo(state);
    expect(manager.nextRedo).toBeDefined();
    manager.trackEdit(
      state,
      {
        firstName: 'foo',
        lastName: 'foo',
      },
      {},
    );
    expect(manager.nextRedo).toBeUndefined();
  });

  it('split edits based on metadata', () => {
    const manager = makeTypeBasedManager();
    let state = {};
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
      },
      { type: 'a' },
    );
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
        lastName: 'foo',
      },
      { type: 'b' },
    );
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: 'foo',
    });
  });
  it('merge edits based on metadata', () => {
    const manager = makeTypeBasedManager();
    let state = {};
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
      },
      { type: 'a' },
    );
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
        lastName: 'foo',
      },
      { type: 'a' },
    );
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('split edits based on edit count', () => {
    const manager = makeLengthBasedManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: '1' }, {});
    state = manager.trackEdit(state, { firstName: '2' }, {});
    state = manager.trackEdit(state, { firstName: '3' }, {});
    state = manager.trackEdit(state, { firstName: '4' }, {});
    state = manager.trackEdit(state, { firstName: '5' }, {});
    state = manager.trackEdit(state, { firstName: '6' }, {});
    state = manager.trackEdit(state, { firstName: '7' }, {});
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: '5',
    });
  });
  it('split edits based on "time"', () => {
    const manager = makeTimeBasedManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: '1' }, { time: 0 });
    state = manager.trackEdit(state, { firstName: '2' }, { time: 5 });
    state = manager.trackEdit(state, { firstName: '3' }, { time: 10 });
    state = manager.trackEdit(state, { firstName: '4' }, { time: 20 });
    state = manager.trackEdit(state, { firstName: '5' }, { time: 50 });
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: '4',
    });
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: '3',
    });
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: '2',
    });
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('undo-redo local edit after snapshot', () => {
    const manager = makeTypeBasedManager();
    let state = {};
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
      },
      { type: 'a' },
    );
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
        lastName: 'foo',
      },
      { type: 'b' },
    );
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: 'foo',
    });
    state = manager.redo(state);
    expect(state).toEqual({
      firstName: 'foo',
      lastName: 'foo',
    });
  });

  it('undo with remote edits', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    state = {
      firstName: 'foo',
      lastName: 'foo',
    };
    state = manager.undo(state);
    expect(state).toEqual({
      lastName: 'foo',
    });
  });

  it('undo-redo with remote edits', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    // Untracked edit
    state = {
      firstName: 'foo',
      lastName: 'foo',
    };
    state = manager.undo(state);
    state = manager.redo(state);
    expect(state).toEqual({
      firstName: 'foo',
      lastName: 'foo',
    });
  });

  it('undo two local edits with non undo edit in middle', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' }, {});
    // Untracked edit
    state = {
      firstName: 'foo',
      lastName: 'foo',
    };
    state = manager.trackEdit(
      state,
      {
        firstName: 'foobar',
        lastName: 'foo',
      },
      {},
    );
    state = manager.undo(state);
    expect(state).toEqual({
      lastName: 'foo',
    });
  });
});
