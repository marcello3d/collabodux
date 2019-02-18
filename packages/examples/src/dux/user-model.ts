import * as t from 'io-ts';
import { defaulted, optional } from './io-ts-util';

export const User = t.type(
  {
    username: t.string,
    focus: optional(t.string),
    selectedItem: optional(t.string),
    select: optional(t.tuple([t.number, t.number])),
  },
  'User',
);
export type UserType = t.TypeOf<typeof User>;

export const usersPartialType = {
  users: defaulted(t.record(t.string, User), {}),
};

const UserPartialType = t.type(usersPartialType);

export type ModelWithUsersType = t.TypeOf<typeof UserPartialType>;
