import { diff3Merge } from 'node-diff3';

export function mergeTwoStringEdits(original: string, a: string, b: string): string {
  return mergeTwoEdits(
    Array.from(original),
    Array.from(a),
    Array.from(b),
  ).map((arr) => arr.join('')).join('');
}
export function mergeTwoEdits(original: string[], a: string[], b: string[]): string[][] {
  return diff3Merge(
    a,
    original,
    b,
    true,
  ).map((result): string[] =>
    'ok' in result
      ? result.ok
      : result.conflict.a.concat(result.conflict.b),
  );
}
