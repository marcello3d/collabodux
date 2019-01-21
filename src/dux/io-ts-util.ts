import * as t from 'io-ts';
import { Mixed, NumberType } from 'io-ts';
import { Context } from 'io-ts';

export function optional<R extends Mixed>(type: R) {
  return t.union([type, t.undefined]);
}

export function defaultBoolean(defaultValue: boolean = false) {
  return defaulted(t.boolean, defaultValue);
}

export function defaultString(defaultValue: string = '') {
  return defaulted(t.string, defaultValue);
}

export function defaulted<T extends t.Any>(
  type: T,
  defaultValue: t.TypeOf<T> | (() => t.TypeOf<T>),
): t.Type<t.TypeOf<T>, any> {
  return new t.Type(
    type.name,
    (v: any): v is T => type.is(v),
    (v: any, context: Context) => {
      if (v !== undefined) {
        return type.validate(v, context);
      } else {
        if (defaultValue instanceof Function) {
          return type.validate(defaultValue(), context);
        } else {
          return type.validate(defaultValue, context);
        }
      }
    },
    (v: any) => type.encode(v),
  );
}
