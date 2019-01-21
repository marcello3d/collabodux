import { Connection } from '../client/ws';
import { Collabodux } from '../client/collabodux';
import { removeUsers, setUserName } from './actions';
import { randomAnimalName } from '../utils/names';
import { validateAndNormalize } from './model';
import { reducer } from './reducer';
import { dispatch } from './collabodux-fsa-hooks';
import { JSONValue, Path } from 'json-diff3';
import { diff3MergeStrings } from '../utils/merge-edits';

export const connection = new Connection(
  new WebSocket(`ws://${location.hostname}:4000`),
  // new WebSocket(`wss://collabodux1.now.sh:443`),
);

export const collabodux = new Collabodux(
  connection,
  validateAndNormalize,
  {
    handleMerge(
      o: JSONValue | undefined,
      a: JSONValue,
      b: JSONValue,
      path: Path,
    ): JSONValue {
      if (
        typeof o === 'string' &&
        typeof a === 'string' &&
        typeof b === 'string'
      ) {
        return diff3MergeStrings(o, a, b);
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
