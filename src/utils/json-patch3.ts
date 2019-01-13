import deepEqual from 'fast-deep-equal';
import { diff3MergeIndices } from 'node-diff3';
import { Index } from './merge-edits';

export type JSONLiteral = string | number | boolean | null;
export type JSONValue = JSONLiteral | JSONObject | JSONArray;
export interface JSONObject extends Record<string, JSONValue> {}
export interface JSONArray extends Array<JSONValue> {}

export type PathKey = string | number;
export type Path = PathKey[];
export interface Handler {
  getArrayItemKey(
    item: JSONValue,
    index: number,
    arrayPath: Path,
  ): string;
  handleMerge(
    o: JSONValue | undefined,
    a: JSONValue,
    b: JSONValue,
    path: Path,
  ): JSONValue;
}
export function getArrayItemKeyStringValue(
  item: JSONValue,
  index: number,
): string {
  return String(item);
}
export function getArrayItemKeyIndex(
  item: JSONValue,
  index: number,
): string {
  return String(index);
}
export function throwingMerge(o: JSONValue, a: JSONValue, b: JSONValue, path: Path): JSONValue {
  throw new Error(`Conflict at /${path.join('/')}`);
}

export function diff3(
  orig: JSONValue,
  a: JSONValue,
  b: JSONValue,
  {
    getArrayItemKey = getArrayItemKeyStringValue,
    handleMerge = throwingMerge,
  }: Partial<Handler> = {},
  basePath: Path = [],
): JSONValue {
  if (deepEqual(a, b)) {
    // Merging to same thing
    return b;
  }
  if (deepEqual(orig, a)) {
    // Only b changed
    return b;
  }
  if (deepEqual(orig, b)) {
    // Only a changed
    return a;
  }

  const typeo = type(orig);
  const typea = type(a);
  const typeb = type(b);
  if (typea === typeb && typea === typeo) {
    if (typea === 'array') {
      return diff3Array(
        orig as JSONArray,
        a as JSONArray,
        b as JSONArray,
        { getArrayItemKey, handleMerge },
        basePath,
      );
    }
    if (typea === 'object') {
      return diff3Object(
        orig as JSONObject,
        a as JSONObject,
        b as JSONObject,
        { getArrayItemKey, handleMerge },
        basePath,
      );
    }
  }
  return handleMerge(orig, a, b, basePath);
}

function diff3Array(
  orig: JSONValue[],
  a: JSONValue[],
  b: JSONValue[],
  handler: Handler,
  path: Path,
): JSONValue[] {
  const getKey = (item: JSONValue, index: number) => handler.getArrayItemKey(item, index, path);
  const origKeys = orig.map(getKey);
  const aKeys = a.map(getKey);
  const bKeys = b.map(getKey);

  const obj = diff3ObjectInternal(
    orig,
    a,
    b,
    Object.keys(orig),
    Object.keys(a),
    Object.keys(b),
    handler,
    path,
  )

  // const result: JSONValue[] = [];
  // const sides: JSONValue[][] = [a, orig, b];
  // const indices: Index[] = diff3MergeIndices(aKeys, origKeys, bKeys);
  // for (let i = 0; i < indices.length; i++) {
  //   const index: Index = indices[i];
  //   if (index[0] === -1) {
  //     const [, aStart, aLength, , , bStart, bLength] = index;
  //     const aEnd = aStart + aLength;
  //     for (let j = aStart; j<aEnd; j++) {
  //       result.push(a[j]);
  //     }
  //     const bEnd = bStart + bLength;
  //     for (let j = bStart; j<bEnd; j++) {
  //       result.push(b[j]);
  //     }
  //   } else {
  //     const [side, start, length] = index;
  //     const arr = sides[side];
  //     const end = start + length;
  //     for (let j = start; j<end; j++) {
  //       result.push(arr[j]);
  //     }
  //   }
  // }
  // return result;
}

function diff3Object(
  orig: JSONObject,
  a: JSONObject,
  b: JSONObject,
  handler: Handler,
  path: Path,
): JSONObject {
  return diff3ObjectInternal(
    orig,
    a,
    b,
    Object.keys(orig),
    Object.keys(a),
    Object.keys(b),
    handler,
    path,
  )
}

function diff3ObjectInternal<T extends JSONObject | JSONArray>(
  orig: T,
  a: T,
  b: T,
  origKeys: string[],
  aKeys: string[],
  bKeys: string[],
  handler: Handler,
  path: Path,
): T {
  const newObject: JSONObject = {};
  const origKeySet = new Set(origKeys);
  const remainingBKeySet = new Set(bKeys);
  // possibilities:
  // key in: a          --- use a
  // key in: b          --- use b
  // key in: a, b, orig --- if a === orig, use b,
  //                        if b === orig, use a,
  //                        else conflict
  // key in: a, orig    --- if a === orig, use none
  //                        else conflict
  // key in: b, orig    --- if b === orig, use none
  //                        else conflict
  // key in: a, b       --- conflict
  // key in: orig       --- use none
  aKeys.forEach((key) => {
    const inOrig = origKeySet.has(key);
    const inB = remainingBKeySet.has(key);
    if (!inB && !inOrig) {
      // key is new in a
      newObject[key] = a[key];
    } else {
      // Possible conflict
      newObject[key] = diff3(orig[key], a[key], b[key], handler, [
        ...path,
        key,
      ]);
      if (inB) {
        remainingBKeySet.delete(key);
      }
    }
  });
  // Remaining b keys that weren't in a
  remainingBKeySet.forEach((key) => {
    const inOrig = origKeySet.has(key);
    if (inOrig) {
      newObject[key] = diff3(orig[key], a[key], b[key], handler, [
        ...path,
        key,
      ]);
    } else {
      // key is new in b
      newObject[key] = b[key];
    }
  });
  return newObject;
}

export function type(object: any): typeof object {
  const type = typeof object;
  if (type !== 'object') {
    return type;
  }
  if (object === null) {
    return 'null';
  }
  if (Array.isArray(object)) {
    return 'array';
  }
  return 'object';
}
