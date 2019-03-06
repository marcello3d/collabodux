import shallowequal from 'shallowequal';
import { Draft } from 'immer';
import { createMutatorFactory, MutatorFn } from './use-mutate';
import { ModelWithUsersType, UserType } from './user-model';
import { EditMetadata, NoUndo } from './edit-merge';

const createMutator = createMutatorFactory<ModelWithUsersType, EditMetadata>();

export function ensureUser(
  draft: Draft<ModelWithUsersType>,
  session: string,
): Draft<UserType> {
  if (!draft.users[session]) {
    draft.users[session] = {
      username: '',
      focus: undefined,
      select: undefined,
      selectedItem: undefined,
    };
  }
  return draft.users[session];
}

export const removeUsers = <State extends ModelWithUsersType>({
  users,
}: {
  users: string[];
}): MutatorFn<State, EditMetadata> => (draft) => {
  users.forEach((user) => {
    delete draft.users[user];
  });
  return NoUndo;
};

export const setUserName = <State extends ModelWithUsersType>({
  session,
  username,
  initial = false,
}: {
  session: string;
  username: string;
  initial?: boolean;
}): MutatorFn<State, EditMetadata> => (draft) => {
  ensureUser(draft, session).username = username;
  return initial ? NoUndo : { type: `set-username-${session}`, merge: 10 };
};

export const setUserFocus = <State extends ModelWithUsersType>({
  session,
  focus,
  select,
}: {
  session: string;
  focus?: string;
  select?: [number, number];
}): MutatorFn<State, EditMetadata> => (draft) => {
  const user = ensureUser(draft, session);
  user.focus = focus;
  if (!shallowequal(user.select, select)) {
    user.select = select;
  }
  return NoUndo;
};

export const setUserSelectedItem = <State extends ModelWithUsersType>({
  session,
  key,
}: {
  session: string;
  key?: string;
}): MutatorFn<State, EditMetadata> => (draft) => {
  ensureUser(draft, session).selectedItem = key;
  return NoUndo;
};
