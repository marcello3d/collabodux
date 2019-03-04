import { diff3, JSONObject, JSONValue } from 'json-diff3';
import * as IoPaths from 'io-ts-path';
import { MergableType } from './io-ts-util';
import { Type } from 'io-ts';

export function getMerger<State extends JSONObject>(
  stateType: Type<State>,
  validateAndNormalize,
) {
  return (base, local, remote) =>
    validateAndNormalize(
      diff3(base, local, remote, {
        handleMerge(base, left, right, path): JSONValue {
          const type = IoPaths.type(stateType, path);
          console.log(
            `conflict at ${path} type=${type.name}: `,
            base,
            left,
            right,
          );
          if (type instanceof MergableType) {
            return type.merge(base, left, right);
          }
          throw new Error(`cannot merge /${path.join('/')}`);
        },
        getArrayItemKey(item: any, index) {
          return (typeof item === 'object' && item.key) || index;
        },
      }),
    );
}
