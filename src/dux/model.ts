import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { defaulted, mergable, optional } from './io-ts-util';
import { JSONObject } from 'json-diff3';
import uuid from 'uuid/v4';
import { diff3MergeStrings } from '../utils/merge-edits';

const mergableDefaultEmptyString = mergable(
  defaulted(t.string, ''),
  diff3MergeStrings,
);
const mergableString = mergable(t.string, diff3MergeStrings);

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
    label: mergableDefaultEmptyString,
  },
  'Todo',
);
export interface ITodo extends t.TypeOf<typeof Todo> {}

export const ModelState = t.type(
  {
    title: mergableDefaultEmptyString,
    subtitle: mergableDefaultEmptyString,
    longtext: mergableDefaultEmptyString,
    todos: defaulted(t.array(Todo), []),
    users: defaulted(t.record(t.string, User), {}),
  },
  'ModelState',
);

export interface IModelState extends t.TypeOf<typeof ModelState>, JSONObject {}

export function validateAndNormalize(state: any = {}): IModelState {
  return ModelState.decode(state).getOrElseL((errors) => {
    throw new Error(failure(errors).join('\n'));
  });
}
