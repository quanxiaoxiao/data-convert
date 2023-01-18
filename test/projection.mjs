import test from 'ava'; // eslint-disable-line
import projection from '../src/projection.mjs';

test('projection', (t) => {
  t.is(projection('aaa')([]), null);
  t.is(projection([])('bbb'), null);
  t.deepEqual(projection([])([{ name: 'cqq' }]), [{ name: 'cqq' }]);
});

test('projection map', (t) => {
  const data = [
    {
      name: 'cqq',
      age: 30,
      foo: 'foo',
      obj: {
        name: 'obj',
        big: 'xxx',
      },
    },
  ];
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
        },
      },
    ])(data),
    [
      { name: 'cqq' },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: '$name',
        },
      },
    ])(data),
    [
      { name: 'cqq' },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 'test_123',
        },
      },
    ])(data),
    [
      { name: 'test_123' },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: '$obj.name',
        },
      },
    ])(data),
    [
      { name: 'obj' },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 'obj.name',
        },
      },
    ])(data),
    [
      { name: 'obj.name' },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
          age: 1,
        },
      },
    ])(data),
    [
      { name: 'cqq', age: 30 },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          empty: 1,
        },
      },
    ])(data),
    [
      { empty: null },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          age: 1,
          name: null,
        },
      },
    ])(data),
    [
      { age: 30 },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          obj: 1,
        },
      },
    ])(data),
    [
      {
        obj: {
          name: 'obj',
          big: 'xxx',
        },
      },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
          sub: {
            name: '$obj.name',
            age: '$age',
          },
        },
      },
    ])(data),
    [
      {
        name: 'cqq',
        sub: {
          name: 'obj',
          age: 30,
        },
      },
    ],
  );
});
