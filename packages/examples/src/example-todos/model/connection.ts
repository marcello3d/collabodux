import { Collabodux, Connection } from '@collabodux/client';
import { ModelState, ModelStateType, validateAndNormalize } from './model';
import { addUserManagement } from '../../dux/user-cleanup';
import { getMerger } from '../../dux/io-ts-merge';
import { EditMetadata, mergeEdit } from '../../dux/edit-merge';
import { JSONObject } from 'json-diff3';

export const connection = new Connection(
  `ws://${location.hostname}:4000`,
  // `wss://collabodux2.now.sh:443`,
);

export const collabodux = new Collabodux<
  ModelStateType,
  JSONObject,
  EditMetadata
>(
  connection,
  validateAndNormalize,
  getMerger(ModelState, validateAndNormalize),
  mergeEdit,
  // for simulating high latency connections, set this:
  // 5 * 1000,
);

addUserManagement(collabodux);
