import { PatchStateManager } from './patch-state-manager';
import { diff3, JSONObject } from 'json-diff3';

function makeManager() {
  return new PatchStateManager<JSONObject, JSONObject>(
    (raw = {}) => raw,
    (base = {}, local, remote) => diff3(base, local, remote) as JSONObject,
  );
}
describe('PatchStateManager', () => {
  it('setLocal', () => {
    const manager = makeManager();
    expect(manager.setLocal({ first: 'hello' })).toBe(true);
    expect(manager.local).toEqual({ first: 'hello' });
    expect(manager.getLocalPatches()).toEqual([
      { op: 'replace', path: '', value: { first: 'hello' } },
    ]);
    expect(manager.setLocal({ first: 'hello' })).toBe(false);
  });

  it('getLocalPatches', () => {
    const manager = makeManager();
    manager.setLocal({ first: 'hello' });
    expect(manager.getLocalPatches()).toEqual([
      { op: 'replace', path: '', value: { first: 'hello' } },
    ]);
  });

  it('mergeRemote', () => {
    const manager = makeManager();
    expect(manager.vtag).toEqual('ROOT');
    expect(manager.hasRemote).toEqual(false);
    expect(manager.mergeRemote({ last: 'world' }, '1')).toBe(true);
    expect(manager.hasRemote).toEqual(true);
    expect(manager.vtag).toEqual('1');
    expect(manager.local).toEqual({
      last: 'world',
    });
  });

  it('acceptLocalChanges', () => {
    const manager = makeManager();
    manager.setLocal({ first: 'hello' });
    manager.acceptLocalChanges({ first: 'hello' }, '1');
    expect(manager.getLocalPatches()).toEqual([]);
  });

  it('patchRemote', () => {
    const manager = makeManager();
    expect(
      manager.patchRemote([{ op: 'replace', path: '', value: 'world' }], '1'),
    ).toBe(true);
  });

  it('patchRemote and merge', () => {
    const manager = makeManager();
    manager.setLocal({ first: 'hello' });
    expect(
      manager.patchRemote(
        [{ op: 'replace', path: '', value: { last: 'world' } }],
        '1',
      ),
    ).toBe(true);
    expect(manager.vtag).toEqual('1');
    expect(manager.local).toEqual({
      first: 'hello',
      last: 'world',
    });
    expect(manager.getLocalPatches()).toEqual([
      { op: 'add', path: '/first', value: 'hello' },
    ]);
  });

  it('patchRemote throws when patch results in undefined', () => {
    const manager = makeManager();
    expect(() => manager.patchRemote([], '1')).toThrow(
      'patch results in undefined',
    );
  });

  it('patchRemote throws when patch is invalid', () => {
    const manager = makeManager();
    expect(() =>
      manager.patchRemote(
        [{ op: 'replace', path: '/foo/bar', value: '' }],
        '1',
      ),
    ).toThrow('[op:replace] path not found: /foo/bar');
  });
});
