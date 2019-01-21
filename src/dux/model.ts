import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { defaulted, optional } from './io-ts-util';
import { JSONObject } from 'json-diff3';
import uuid from 'uuid/v4';

export const User = t.type(
  {
    username: t.string,
    focus: optional(t.string),
    select: optional(t.tuple([t.number, t.number])),
  },
  'User',
);
export interface IUser extends t.TypeOf<typeof User> {}

export const Todo = t.type(
  {
    key: defaulted(t.string, uuid),
    done: defaulted(t.boolean, false),
    label: defaulted(t.string, ''),
  },
  'Todo',
);
export interface ITodo extends t.TypeOf<typeof Todo> {}

export const ModelState = t.type(
  {
    title: defaulted(t.string, ''),
    subtitle: defaulted(t.string, ''),
    longtext: defaulted(t.string, ''),
    todos: defaulted(t.array(Todo), []),
    users: defaulted(t.dictionary(t.string, User), {}),
  },
  'ModelState',
);

export interface IModelState extends t.TypeOf<typeof ModelState>, JSONObject {}

export function validateAndNormalize(state: any = {}): IModelState {
  return ModelState.decode(state).getOrElseL((errors) => {
    throw new Error(failure(errors).join('\n'));
  });
}
