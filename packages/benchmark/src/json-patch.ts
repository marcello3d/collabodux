import Benchmark from 'benchmark';
import jsonTouchPatch, { Operation } from 'json-touch-patch';
import { applyPatch as rfc6902ApplyPatch } from 'rfc6902';
import { applyPatch as fastApplyPatch } from 'fast-json-patch';
import produce, { applyPatches, Patch } from 'immer';

const base = {
  name: {
    first: 'steve',
    lots: 123,
    and: 123,
    lotss: 123,
    of: 123,
    other: 123,
    keys: 123,
    andd: 123,
    keysss: 123,
    'okay?': 123,
  },
  lots: 123,
  and: 123,
  lotss: 123,
  of: 123,
  other: 123,
  keys: 123,
  andd: 123,
  keysss: 123,
  'okay?': 123,
};
const jsonPatches: Operation[] = [
  { op: 'replace', path: '/name/first', value: 'katrina' },
  { op: 'replace', path: '/name/then', value: 'katrina' },
];
const immerPatches: Patch[] = [
  { op: 'replace', path: ['name', 'first'], value: 'katrina' },
  { op: 'replace', path: ['name', 'then'], value: 'katrina' },
];

new Benchmark.Suite()
  .add('json-touch-patch', () => {
    jsonTouchPatch(base, jsonPatches);
  })
  .add('immer + rfc6902', () => {
    produce(base, (draft) => {
      rfc6902ApplyPatch(draft, jsonPatches);
    });
  })
  .add('immer + fast-json-patch', () => {
    produce(base, (draft) => {
      fastApplyPatch(draft, jsonPatches);
    });
  })
  .add('immer applyPatches', () => {
    applyPatches(base, immerPatches);
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // run async
  .run({ async: true });
