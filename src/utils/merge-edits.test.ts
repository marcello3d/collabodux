import { mergeTwoStringEdits } from './merge-edits';

describe('mergeTwoStringEdits', () => {
  it('works with one-sided change', () => {
    expect(mergeTwoStringEdits('', 'hello', '')).toEqual('hello');
  });
  it('merges non-conflicting adds', () => {
    expect(mergeTwoStringEdits('word.', 'hello. word.', 'word. bye.')).toEqual(
      'hello. word. bye.',
    );
  });
  it('merges conflicting adds', () => {
    expect(mergeTwoStringEdits('', 'hello', 'world')).toEqual('helloworld');
  });
  it('merges non-conflicting deletes', () => {
    expect(mergeTwoStringEdits('one two three', 'one two', 'two three')).toEqual(
      'two',
    );
  });
  it('merges conflicting deletes 1', () => {
    expect(
      mergeTwoStringEdits('one two three', 'one three', 'two three'),
    ).toEqual('three');
  });
  it('merges conflicting deletes 2', () => {
    expect(mergeTwoStringEdits('one two three', 'one two', 'two three')).toEqual(
      'two',
    );
  });
  it('merges conflicting edits 1', () => {
    expect(mergeTwoStringEdits('two', 'one', 'two three')).toEqual(
      'one three',
    );
  });
});
