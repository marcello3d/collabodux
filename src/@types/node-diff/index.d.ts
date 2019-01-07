declare module 'node-diff3' {
  export function diff3MergeIndices(
    a: string[],
    original: string[],
    b: string[],
  ): number[][];
  export function diff3Merge(
    a: string[],
    original: string[],
    b: string[],
    excludeFalseConflicts: boolean,
  ): (
    | { ok: string[] }
    | {
        conflict: {
          a: string[];
          aIndex: number;
          o: string[];
          oIndex: number;
          b: string[];
          bIndex: number;
        };
      })[];
}
