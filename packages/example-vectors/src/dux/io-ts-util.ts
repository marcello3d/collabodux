import * as t from 'io-ts';
import { Context, Mixed, Any, TypeOf, Type } from 'io-ts';

export function optional<R extends Mixed>(type: R) {
  return t.union([type, t.undefined]);
}

export function defaulted<T extends Any>(
  type: T,
  defaultValue: TypeOf<T> | (() => TypeOf<T>),
): Type<TypeOf<T>, any> {
  return new Type(
    type.name,
    type.is,
    (v: any, context: Context) => {
      if (v !== undefined) {
        return type.validate(v, context);
      }
      if (defaultValue instanceof Function) {
        return type.validate(defaultValue(), context);
      } else {
        return type.validate(defaultValue, context);
      }
    },
    type.encode,
  );
}

export function defaultBoolean(defaultValue: boolean = false) {
  return defaulted(t.boolean, defaultValue);
}

export function defaultString(defaultValue: string = '') {
  return defaulted(t.string, defaultValue);
}

type Merger<T> = (base: T, left: T, right: T) => T;

export class MergableType<T extends Any> extends Type<T> {
  constructor(type: Type<T>, public readonly merge: Merger<TypeOf<T>>) {
    super(type.name, type.is, type.validate, type.encode);
  }
}

export function mergable<T extends Any>(
  type: T,
  merge: Merger<TypeOf<T>>,
): Type<TypeOf<T>, any> {
  return new MergableType<T>(type, merge);
}
