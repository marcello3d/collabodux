import shallowequal from 'shallowequal';
import { Draft } from 'immer';
import { createMutatorFactory } from './use-mutate';
import { ModelWithUsersType, UserType } from './user-model';

const createMutator = createMutatorFactory<ModelWithUsersType>();

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

export const removeUsers = createMutator<{
  users: string[];
}>(
  (draft, { users }) => {
    users.forEach((user) => {
      delete draft.users[user];
    });
  },
  false,
  false,
);

export const setUserName = createMutator<{
  session: string;
  username: string;
}>(
  (draft, { session, username }) => {
    ensureUser(draft, session).username = username;
  },
  true,
  true,
);

export const setUserFocus = createMutator<{
  session: string;
  focus?: string;
  select?: [number, number];
}>(
  (draft, { session, focus, select }) => {
    const user = ensureUser(draft, session);
    user.focus = focus;
    if (!shallowequal(user.select, select)) {
      user.select = select;
    }
  },
  false,
  false,
);

export const setUserSelectedItem = createMutator<{
  session: string;
  key?: string;
}>(
  (draft, { session, key }) => {
    ensureUser(draft, session).selectedItem = key;
  },
  false,
  true,
);
