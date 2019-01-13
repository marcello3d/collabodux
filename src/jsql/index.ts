// What if types were defined in JavaScript
// Then we can define subtrees and partial queries using the objects.
//   We can use typescript to validate
//
// Eg type= c.object({
//   users: c.record(c.key, c.object({
//     username: c.string
//   })
//
//   type.q.users._.username

export interface JSQLType<T> {
  decode(encoded: any): T;
}
export interface JSQLOptionalType<T> extends JSQLType<T | undefined> {}

export type StaticType<T> = T extends ObjectMap
  ? { [K in keyof T]: StaticType<T[K]> }
  : T extends JSQLStringType
    ? string
    : T extends undefined
      ? undefined
      : unknown;



class Optional<T> implements JSQLOptionalType<T> {
  constructor(private type:JSQLType<T>) {}
  decode(encoded: any): T | undefined {
    if (encoded === null || encoded === undefined) {
      return undefined;
    }
    return this.type.decode(encoded);
  }
}


type ObjectMap = Record<string | number, JSQLType<any>>;

class JSQLObjectType<T extends ObjectMap> implements JSQLType<StaticType<T>> {
  private _keys: string[];
  constructor(public readonly fields: T) {
    this._keys = Object.keys(fields);
  }

  decode(encoded: any): StaticType<T> {
    const obj: Record<any, any> = {};
    this._keys.forEach((key) => {
      const value = this.fields[key].decode(encoded[key]);
      if (value !== undefined) {
        obj[key] = value;
      }
    });
    return obj as StaticType<T>;
  }

  readonly optional = new Optional(this);
}


class JSQLStringType implements JSQLType<string> {
  decode(encoded: any): string {
    if (typeof encoded !== 'string') {
      throw new Error('expected string');
    }
    return String(encoded);
  }

  readonly optional = new Optional(this);
}

export function object<T extends ObjectMap>(keys: T): JSQLObjectType<T> {
  return new JSQLObjectType(keys);
}
export const string = new JSQLStringType();
