import { diff3, JSONObject } from 'json-diff3';
import { UndoManager } from './undo-manager';

function makeManager() {
  return new UndoManager<JSONObject>(
    (base, local, remote) => diff3(base, local, remote) as JSONObject,
  );
}

describe('UndoManager', () => {
  it('undo one local edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' });
    expect(state).toEqual({
      firstName: 'foo',
    });
    expect(manager.hasUndo).toBe(true);
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('double-undo one edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' });
    expect(manager.hasUndo).toBe(true);
    state = manager.undo(state);
    expect(manager.hasUndo).toBe(false);
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('undo-redo one local edit', () => {
    const manager = makeManager();

    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' });
    expect(manager.hasUndo).toBe(true);
    state = manager.undo(state);
    expect(manager.hasUndo).toBe(false);
    expect(manager.hasRedo).toBe(true);
    state = manager.redo(state);
    expect(manager.hasRedo).toBe(false);
    expect(state).toEqual({
      firstName: 'foo',
    });
  });

  it('undo-double-redo one local edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' });
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
    state = manager.trackEdit(state, { firstName: 'foo' });
    state = manager.trackEdit(state, {
      firstName: 'foo',
      lastName: 'foo',
    });
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('cannot redo after edit', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, { firstName: 'foo' });
    state = manager.undo(state);
    expect(manager.hasRedo).toBe(true);
    manager.trackEdit(state, {
      firstName: 'foo',
      lastName: 'foo',
    });
    expect(manager.hasRedo).toBe(false);
  });

  it('undo local edit after snapshot', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, {
      firstName: 'foo',
    });
    manager.snapshot();
    state = manager.trackEdit(state, {
      firstName: 'foo',
      lastName: 'foo',
    });
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: 'foo',
    });
  });

  it('undo local edit after snapshot', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, {
      firstName: 'foo',
    });
    manager.snapshot();
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('undo local edit after snapshot', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, {
      firstName: 'foo',
    });
    manager.snapshot();
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('initial snapshot', () => {
    const manager = makeManager();
    let state = {};
    manager.snapshot();
    state = manager.trackEdit(state, {
      firstName: 'foo',
      lastName: 'foo',
    });
    state = manager.undo(state);
    state = manager.undo(state);
    expect(state).toEqual({});
  });

  it('double snapshot', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, {
      firstName: 'foo',
    });
    manager.snapshot();
    manager.snapshot();
    state = manager.trackEdit(state, {
      firstName: 'foo',
      lastName: 'foo',
    });
    state = manager.undo(state);
    expect(state).toEqual({
      firstName: 'foo',
    });
  });

  it('undo-redo local edit after snapshot', () => {
    const manager = makeManager();
    let state = {};
    state = manager.trackEdit(state, {
      firstName: 'foo',
    });
    manager.snapshot();
    state = manager.trackEdit(state, {
      firstName: 'foo',
      lastName: 'foo',
    });
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
    state = manager.trackEdit(state, { firstName: 'foo' });
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
    state = manager.trackEdit(state, { firstName: 'foo' });
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
    state = manager.trackEdit(state, { firstName: 'foo' });
    // Untracked edit
    state = {
      firstName: 'foo',
      lastName: 'foo',
    };
    state = manager.trackEdit(state, {
      firstName: 'foobar',
      lastName: 'foo',
    });
    state = manager.undo(state);
    expect(state).toEqual({
      lastName: 'foo',
    });
  });
});
