import Benchmark from 'benchmark';
import { createPatch as rfc6902CreatePatch } from 'rfc6902';
import { compare as fastCompare } from 'fast-json-patch';

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
const base2 = {
  name: {
    first: 'katrina',
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

new Benchmark.Suite()
  .add('rfc6902', () => {
    rfc6902CreatePatch(base, base2);
  })
  .add('fast-json-patch', () => {
    fastCompare(base, base2);
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
