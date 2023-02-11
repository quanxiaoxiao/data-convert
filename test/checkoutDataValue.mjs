import test from 'ava'; // eslint-disable-line
import checkoutDataValue from '../src/checkoutDataValue.mjs';

test('checkoutDataValue', (t) => {
  t.deepEqual(
    checkoutDataValue([
      {
        name: 'name',
        type: 'string',
        trim: true,
      },
      {
        name: 'age',
        type: 'integer',
        trim: false,
      },
    ])({
      name: '  xxx  ',
      age: '33',
    }),
    {
      name: 'xxx',
      age: 33,
    },
  );
});
