import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { defaulted, mergable, optional } from './io-ts-util';
import { JSONObject } from 'json-diff3';
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
    selectedShape: optional(t.string),
    select: optional(t.tuple([t.number, t.number])),
  },
  'User',
);
export interface IUser extends t.TypeOf<typeof User> {}

const ShapeEnum = t.keyof({
  ellipse: null,
  rect: null,
});

export const Shape = t.type(
  {
    key: t.string,
    type: ShapeEnum,
    x: t.number,
    y: t.number,
    w: t.number,
    h: t.number,
    strokeColor: optional(t.string),
    strokeWidth: optional(t.number),
    fillColor: optional(t.string),
  },
  'Todo',
);
export interface IShape extends t.TypeOf<typeof Shape> {}

export const Canvas = t.type({
  width: t.number,
  height: t.number,
  shapes: t.array(Shape),
});
export interface ICanvas extends t.TypeOf<typeof Canvas> {}
export const ModelState = t.type(
  {
    title: mergableDefaultEmptyString,
    canvas: optional(Canvas),
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
