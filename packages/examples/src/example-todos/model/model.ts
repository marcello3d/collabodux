import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { defaulted, mergable } from '../../dux/io-ts-util';
import { JSONObject } from 'json-diff3';
import uuid from 'uuid/v4';
import { diff3MergeStrings } from '../../utils/string-diff3';
import { usersPartialType } from '../../dux/user-model';

const mergableDefaultEmptyString = mergable(
  defaulted(t.string, ''),
  diff3MergeStrings,
);

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
    ...usersPartialType,
  },
  'ModelState',
);

export interface ModelStateType
  extends t.TypeOf<typeof ModelState>,
    JSONObject {}

export function validateAndNormalize(state: any = {}): ModelStateType {
  return ModelState.decode(state).getOrElseL((errors) => {
    throw new Error(failure(errors).join('\n'));
  });
}
