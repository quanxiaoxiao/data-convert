import test from 'ava'; // eslint-disable-line
import convert from '../src/index.mjs';

test('convert data', (t) => {
  t.deepEqual(convert({
    name: 'string',
    age: 'integer',
    obj: convert({
      test: 'string',
      num: 'number',
      bool: 'boolean',
    }),
  })({
    name: 'cqq',
    age: '22',
    obj: {
      test: '111',
      num: '33.3',
      bool: 'true',
    },
  }), {
    name: 'cqq',
    age: 22,
    obj: {
      test: '111',
      num: 33.3,
      bool: true,
    },
  });
});
