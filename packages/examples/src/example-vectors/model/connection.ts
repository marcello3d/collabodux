import { Collabodux, Connection } from '@collabodux/client';
import { ModelState, validateAndNormalize } from './model';
import { JSONValue, Path } from 'json-diff3';
import * as IoPaths from 'io-ts-path';
import { MergableType } from '../../dux/io-ts-util';
import { addUserManagement } from '../../dux/user-cleanup';

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

addUserManagement(collabodux);
