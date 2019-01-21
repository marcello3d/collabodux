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
    handleMerge(o: JSONValue | undefined, a: JSONValue, b: JSONValue, path: Path): JSONValue {
      if (typeof o === 'string' && typeof a === 'string' && typeof b === 'string') {
        return diff3MergeStrings(o, a, b);
      }
      throw new Error(`cannot merge /${path.join('/')}`);
    },
    getArrayItemKey(item: any, index: number, arrayPath: Path): string {
      return item.key;
    }
  },
  5 * 1000,
);

let session: string | undefined = undefined;
let sessions: string[] | undefined = undefined;
collabodux.subscribe((state) => {
  if (collabodux.sessions !== sessions) {
    sessions = collabodux.sessions;
    if (sessions) {
      const sessionSet = new Set(sessions);
      const obsoleteUsers = Object.keys(state.users).filter(
        (session) => !sessionSet.has(session),
      );
      if (obsoleteUsers.length > 0) {
        dispatch(collabodux, reducer, removeUsers({ users: obsoleteUsers }));
      }
    }
  }
  if (collabodux.session !== session) {
    session = collabodux.session;
    if (session) {
      dispatch(collabodux, reducer,
        setUserName({
          session,
          username: randomAnimalName(),
        }),
      );
    }
  }
});

