import { Connection } from '../client/ws';
import { Patch } from 'immer';
import { Collabodux } from '../client/collabodux';
import { applyPatch, reducer } from './reducer';
import { setUserName } from './actions';
import { randomAnimalName } from '../utils/names';

export const connection = new Connection<Patch[]>(
  new WebSocket('ws://localhost:4000'),
);

export const collabodux = new Collabodux(connection, reducer, applyPatch);

let session: string | undefined = undefined;
collabodux.subscribe(() => {
  if (collabodux.session !== session) {
    session = collabodux.session;
    if (session) {
      collabodux.propose(setUserName({
        session,
        username: randomAnimalName(),
      }))
    }
  }
});
