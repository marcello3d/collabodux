import { Collabodux, Connection } from '@collabodux/client';
import { validateAndNormalize, ModelState } from './model';
import { addUserManagement } from '../../dux/user-cleanup';
import { getMerger } from '../../dux/io-ts-merge';

export const connection = new Connection(
  `ws://${location.hostname}:4000`,
  // `wss://collabodux2.now.sh:443`,
);

export const collabodux = new Collabodux(
  connection,
  validateAndNormalize,
  getMerger(ModelState, validateAndNormalize),
  // for simulating high latency connections, set this:
  // 5 * 1000,
);

addUserManagement(collabodux);
