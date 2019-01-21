import { Connection } from '../client/ws';
import { Collabodux } from '../client/collabodux';
import { removeUsers, setUserName } from './actions';
import { randomAnimalName } from '../utils/names';
import { validateAndNormalize } from './model';
import { reducer } from './reducer';
import { dispatch } from './collabodux-fsa-hooks';

export const connection = new Connection(
  new WebSocket(`ws://${location.hostname}:4000`),
  // new WebSocket(`wss://collabodux1.now.sh:443`),
);

export const collabodux = new Collabodux(connection, validateAndNormalize);

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

