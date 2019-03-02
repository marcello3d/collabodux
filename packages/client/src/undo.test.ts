import { diff3, JSONObject } from 'json-diff3';
import { UndoManager } from './undo';

function makeManager() {
  return new UndoManager<JSONObject>(
    {},
    (base, local, remote) => diff3(base, local, remote) as JSONObject,
  );
}

describe('UndoManager', () => {
  it('undo one local edit', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    expect(manager.state).toEqual({
      firstName: 'foo',
    });
    manager.undo();
    expect(manager.state).toEqual({});
  });

  it('double-undo one edit', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.undo();
    manager.undo();
    expect(manager.state).toEqual({});
  });

  it('undo-redo one local edit', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.undo();
    manager.redo();
    expect(manager.state).toEqual({
      firstName: 'foo',
    });
  });

  it('undo-double-redo one local edit', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.undo();
    manager.redo();
    manager.redo();
    expect(manager.state).toEqual({
      firstName: 'foo',
    });
  });

  it('redo with no edits', () => {
    const manager = makeManager();
    manager.redo();
    expect(manager.state).toEqual({});
  });

  it('undo two local edits', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.addLocalEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.undo();
    expect(manager.state).toEqual({});
  });

  it('undo local edit after snapshot', () => {
    const manager = makeManager();
    manager.addLocalEdit({
      firstName: 'foo',
    });
    manager.snapshot();
    manager.addLocalEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.undo();
    expect(manager.state).toEqual({
      firstName: 'foo',
    });
  });

  it('undo-redo local edit after snapshot', () => {
    const manager = makeManager();
    manager.addLocalEdit({
      firstName: 'foo',
    });
    manager.snapshot();
    manager.addLocalEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.undo();
    expect(manager.state).toEqual({
      firstName: 'foo',
    });
    manager.redo();
    expect(manager.state).toEqual({
      firstName: 'foo',
      lastName: 'foo',
    });
  });

  it('undo with remote edits', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.addRemoteEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.undo();
    expect(manager.state).toEqual({
      lastName: 'foo',
    });
  });

  it('undo-redo with remote edits', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.addRemoteEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.undo();
    manager.redo();
    expect(manager.state).toEqual({
      firstName: 'foo',
      lastName: 'foo',
    });
  });

  it('undo two local edits with non undo edit in middle', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.addRemoteEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.addLocalEdit({
      firstName: 'foobar',
      lastName: 'foo',
    });

    manager.undo();
    expect(manager.state).toEqual({
      lastName: 'foo',
    });
  });

  it('undo two local edits with non undo edit in middle', () => {
    const manager = makeManager();
    manager.addLocalEdit({ firstName: 'foo' });
    manager.addRemoteEdit({
      firstName: 'foo',
      lastName: 'foo',
    });
    manager.addLocalEdit({
      firstName: 'foobar',
      lastName: 'foo',
    });
    manager.undo();
    expect(manager.state).toEqual({
      lastName: 'foo',
    });
  });
});
