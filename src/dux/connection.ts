import { Connection } from '../client/ws';
import { applyPatches, Patch } from 'immer';
import { Collabodux } from '../client/collabodux';
import { reducer } from './reducer';
import { loadState, removeUsers, setUserName } from './actions';
import { randomAnimalName } from '../utils/names';
import { compressPatches } from './immer';

export const connection = new Connection(
  // new WebSocket(`ws://${location.hostname}:4000`),
  new WebSocket(`wss://collabodux1.now.sh:443`),
);

export const collabodux = new Collabodux(
  connection,
  (newState) => loadState({ newState }),
  reducer,
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
        collabodux.propose(removeUsers({ users: obsoleteUsers }));
      }
    }
  }
  if (collabodux.session !== session) {
    session = collabodux.session;
    if (session) {
      collabodux.propose(
        setUserName({
          session,
          priorUsername: '',
          username: randomAnimalName(),
        }),
      );
    }
  }
});
