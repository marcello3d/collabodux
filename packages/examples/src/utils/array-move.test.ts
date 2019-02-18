import { moveArrayItem } from './array-move';

describe('moveArrayItem', () => {
  it('does +1 move', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 0, 1);
    expect(array).toEqual([2, 1, 3]);
  });
  it('does +2 move', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 0, 2);
    expect(array).toEqual([2, 3, 1]);
  });
  it('does -1 move', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 2, 1);
    expect(array).toEqual([1, 3, 2]);
  });
  it('does -2 move', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 2, 0);
    expect(array).toEqual([3, 1, 2]);
  });
  it('does nothing for index === newIndex', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 1, 1);
    expect(array).toEqual([1, 2, 3]);
  });
  it('does nothing for index > length', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 3, 2);
    expect(array).toEqual([1, 2, 3]);
  });
  it('does nothing for newIndex > length', () => {
    const array = [1, 2, 3];
    moveArrayItem(array, 0, 4);
    expect(array).toEqual([1, 2, 3]);
  });
});
