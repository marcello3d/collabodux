import { compressPatches } from './immer';

describe('compressPatches', () => {
  it('does nothing for empty patch list', () => {
    expect(compressPatches({}, [])).toEqual([]);
  });
  it('returns same list for uncompressible list', () => {
    expect(
      compressPatches({}, [{ op: 'add', path: ['foo'], value: 'bar' }]),
    ).toEqual([{ op: 'add', path: ['foo'], value: 'bar' }]);
  });
  it('compresses double replace', () => {
    expect(
      compressPatches({}, [
        { op: 'replace', path: ['foo'], value: 'bar1' },
        { op: 'replace', path: ['foo'], value: 'bar2' },
      ]),
    ).toEqual([{ op: 'add', path: ['foo'], value: 'bar2' }]);
  });
  it('compresses add-replace', () => {
    expect(
      compressPatches({}, [
        { op: 'add', path: ['foo'], value: 'bar1' },
        { op: 'replace', path: ['foo'], value: 'bar2' },
      ]),
    ).toEqual([{ op: 'add', path: ['foo'], value: 'bar2' }]);
  });
});
