declare module 'json-touch-patch' {
  export interface AddOperation {
    op: 'add';
    path: string;
    value: any;
  }
  export interface RemoveOperation {
    op: 'remove';
    path: string;
  }
  export interface ReplaceOperation {
    op: 'replace';
    path: string;
    value: any;
  }
  export interface MoveOperation {
    op: 'move';
    from: string;
    path: string;
  }
  export interface CopyOperation {
    op: 'copy';
    from: string;
    path: string;
  }
  export interface TestOperation {
    op: 'test';
    path: string;
    value: any;
  }
  export declare type Operation =
    | AddOperation
    | RemoveOperation
    | ReplaceOperation
    | MoveOperation
    | CopyOperation
    | TestOperation;

  interface API {
    get(path: string);
    add(path: string, value: any);
    remove(path: string);
    replace(path: string, value: any);
    move(from: string, path: string);
    copy(from: string, path: string);
    test(path: string, expected: any);
    deepEqual();
    shallowCopy();
    toKeys();
  }
  interface Options {
    custom?: Record<string, (api: API) => boolean | string>;
    partial?: boolean;
    strict?: boolean;
    error?: boolean;
    // opts.custom: object custom operator definition.
    // opts.partial: boolean not reject patches if error occurs (partial patching)
    // opts.strict: boolean throw an exception if error occurs
    // opts.error: object point to a cause patch if error occurs
  }
  export default function patch<T>(
    prevObject: T,
    patches: Operation[],
    options?: Options,
  ): T;
}
