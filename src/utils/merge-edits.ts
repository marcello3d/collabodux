import { diff3MergeIndices } from 'node-diff3';

export function diff3MergeStrings(original: string, a: string, b: string) {
  return diff3MergeStringRanges(original, a, b).text;
}
export type ConflictIndex = [
  -1,
  number,
  number,
  number,
  number,
  number,
  number
];
export type Side = 0 | 1 | 2;
export type SideIndex = [Side, number, number];
export type Index = ConflictIndex | SideIndex;
export interface Range<T> {
  start: number;
  end: number;
  value: T;
}
export function forEachSliceRanges<T>(
  ranges: Range<T>[],
  sliceStart: number,
  sliceEnd: number,
  offset: number,
  callback: (range: Range<T>) => void,
): void {
  ranges.forEach(({ start, end, value }) => {
    if (start > sliceEnd || end < sliceStart) {
      return;
    }
    callback({
      start: offset + Math.max(0, start - sliceStart),
      end: offset + Math.min(sliceEnd - sliceStart, end - sliceStart),
      value,
    });
  });
}
export function sliceRanges<T>(
  ranges: Range<T>[],
  sliceStart: number,
  sliceEnd: number,
  offset: number = 0,
) {
  const sliced: Range<T>[] = [];
  forEachSliceRanges<T>(ranges, sliceStart, sliceEnd, offset, (range) =>
    sliced.push(range),
  );
  return sliced;
}

export function diff3MergeStringRanges<T>(
  o: string,
  a: string,
  b: string,
  oRanges: Range<T>[] = [],
  aRanges: Range<T>[] = [],
  bRanges: Range<T>[] = [],
): { text: string; ranges: Range<T>[] } {
  let result = '';
  const ranges: Range<T>[] = [];
  const sideStrings: string[] = [a, o, b];
  const sideRanges: Range<T>[][] = [aRanges, oRanges, bRanges];
  const indices: Index[] = diff3MergeIndices(a, o, b);

  const addRange = (range: Range<T>) => ranges.push(range);

  for (let i = 0; i < indices.length; i++) {
    const index: Index = indices[i];
    if (index[0] === -1) {
      const [, aStart, aLength, oStart, oLength, bStart, bLength] = index;
      const aEnd = aStart + aLength;
      const aSlice = a.slice(aStart, aEnd);
      const bEnd = oStart + bLength;
      const bSlice = b.slice(oStart, bEnd);
      forEachSliceRanges(aRanges, aStart, aEnd, result.length, addRange);
      result += aSlice;
      if (aSlice !== bSlice) {
        forEachSliceRanges(bRanges, bStart, bEnd, result.length, addRange);
        result += bSlice;
      }
    } else {
      const [side, start, length] = index;
      const end = start + length;
      forEachSliceRanges(sideRanges[side], start, end, result.length, addRange);
      result += sideStrings[side].slice(start, end);
    }
  }
  return { text: result, ranges };
}
