import { removeUsers, setUserName } from './actions';
import { randomAnimalName } from '../utils/names';
import { ModelState, validateAndNormalize } from './model';
import { reducer } from './reducer';
import { dispatch } from './collabodux-fsa-hooks';
import { JSONValue, Path } from 'json-diff3';
import * as IoPaths from 'io-ts-path';
import { MergableType } from './io-ts-util';
import { Collabodux, Connection } from '@collabodux/client';

export const connection = new Connection(
  // new WebSocket(`ws://${location.hostname}:4000`),
  `wss://collabodux2.now.sh:443`,
);

export const collabodux = new Collabodux(
  connection,
  validateAndNormalize,
  {
    handleMerge(
      base: JSONValue | undefined,
      left: JSONValue,
      right: JSONValue,
      path: Path,
    ): JSONValue {
      const type = IoPaths.type(ModelState, path);
      console.log(`conflict at ${path} type=${type}: `, base, left, right);
      if (type instanceof MergableType) {
        return type.merge(base, left, right);
      }
      throw new Error(`cannot merge /${path.join('/')}`);
    },
    getArrayItemKey(item: any, index: number, arrayPath: Path): string {
      return item.key;
    },
  },
  // for simulating high latency connections, set this:
  // 5 * 1000,
);

let lastSession: string | undefined = undefined;
let lastSessions: string[] = [];

function cleanupSessions() {
  const sessionSet = new Set(collabodux.sessions);
  const obsoleteUsers = Object.keys(collabodux.localState.users).filter(
    (session) => !sessionSet.has(session),
  );
  if (obsoleteUsers.length > 0) {
    dispatch(collabodux, reducer, removeUsers({ users: obsoleteUsers }));
  } else {
    console.debug('nothing to clean up!');
  }
}

collabodux.subscribeSessions(({ session, sessions }) => {
  if (lastSessions !== sessions) {
    lastSessions = sessions;
    if (sessions.length < Object.keys(collabodux.localState.users).length) {
      // Cleanup old sessions on a random timer so not everyone slams the server at the same time
      // Time delay is dependent on the number of users.
      const delay = 100 + Math.random() * (sessions.length - 1) * 50;
      console.debug(`Waiting ${delay} ms before cleanup`);
      setTimeout(cleanupSessions, delay);
    }
  }
  if (lastSession !== session) {
    lastSession = session;
    if (lastSession) {
      dispatch(
        collabodux,
        reducer,
        setUserName({
          session: lastSession,
          username: randomAnimalName(),
        }),
      );
    }
  }
});
