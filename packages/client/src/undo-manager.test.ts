import { diff3, JSONObject } from 'json-diff3';
import { UndoManager } from './undo-manager';

function makeManager<Metadata>() {
  return new UndoManager<JSONObject, Metadata>(
    (base, local, remote) => diff3(base, local, remote) as JSONObject,
  );
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
      true,
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

  it('metadata is populated', () => {
    const manager = makeManager<{ type: string }>();
    let state = {};
    state = manager.trackEdit(
      state,
      {
        firstName: 'foo',
      },
      { type: 'a' },
    );
    expect(manager.nextUndo && manager.nextUndo.metadata).toEqual({
      type: 'a',
    });
  });

  it('metadata updates when merging', () => {
    const manager = makeManager<{ type: string }>();
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
      true,
    );
    expect(manager.nextUndo && manager.nextUndo.metadata).toEqual({
      type: 'b',
    });
    state = manager.undo(state);
  });

  it('undoes only tracked edits', () => {
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

  it('undoes and redoes only tracked edit', () => {
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

  it('undo two tracked edits with untracked edit in middle', () => {
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
      true,
    );
    state = manager.undo(state);
    expect(state).toEqual({
      lastName: 'foo',
    });
  });
});
