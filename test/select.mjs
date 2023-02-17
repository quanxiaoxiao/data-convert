import test from 'ava'; // eslint-disable-line
import select from '../src/select.mjs';

test('select invalid', (t) => {
  t.throws(() => {
    select('')([]);
  });
  t.throws(() => {
    select([])([]);
  });
  t.throws(() => {
    select(1)([]);
  });
  t.throws(() => {
    select({})([]);
  });
  t.throws(() => {
    select({
      type: 'object',
    })([]);
  });
  t.throws(() => {
    select({
      type: 'object',
      properties: [],
    })([]);
  });
  t.throws(() => {
    select({ type: 'cqq' })([]);
  });
});

test('select', (t) => {
  t.is(
    select({
      type: 'string',
    })({}),
    '{}',
  );
  t.is(
    select({
      type: 'string',
    })([]),
    '[]',
  );
  t.is(
    select({
      type: 'number',
    })([]),
    null,
  );
  t.is(
    select({
      type: 'number',
    })('3.3'),
    3.3,
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: 'name',
        age: '$age',
      },
    })('asdfw'),
    {
      name: 'name',
      age: null,
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: 'name',
        age: '$age',
      },
    })({
      name: 'cqq',
      age: 33,
      big: 'foo',
    }),
    {
      name: 'name',
      age: 33,
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: '$name',
        age: '$age',
      },
    })({
      name: 'cqq',
      age: '33',
      big: 'foo',
    }),
    {
      name: 'cqq',
      age: '33',
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: '$name',
        obj: {
          name: '$obj.name',
          age: '$obj.age',
          foo: '$obj.foo',
        },
      },
    })({
      name: 'cqq',
      big: 'foo',
      obj: {
        name: 'obj',
        age: 99,
      },
    }),
    {
      name: 'cqq',
      obj: {
        name: 'obj',
        age: 99,
        foo: null,
      },
    },
  );
});

test('select convert data value', (t) => {
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: 'name',
        age: '$age:number',
      },
    })({
      age: '33',
    }),
    {
      name: 'name',
      age: 33,
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: 'name',
        big: '$big : integer',
        age: '$age: number',
        obj: {
          good: '$good:boolean',
        },
      },
    })({
      age: '33',
      big: '23.3',
      good: 'true',
    }),
    {
      name: 'name',
      big: 23,
      age: 33,
      obj: {
        good: true,
      },
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: '$name:aaa',
      },
    })({
      name: 'cqq',
      age: '33',
      big: '23.3',
      good: 'true',
    }),
    {
      name: null,
    },
  );
});
