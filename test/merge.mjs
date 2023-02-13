import test from 'ava'; // eslint-disable-line
import merge from '../src/merge.mjs';

test('merge', (t) => {
  t.deepEqual(merge(111, { name: 'aaa' }), { name: 'aaa' });
  t.deepEqual(merge({ name: 'aaa' }, 111), { name: 'aaa' });
  t.deepEqual(merge([333], [222]), {});
  t.deepEqual(merge(
    {},
    {},
  ), {});
  t.deepEqual(merge(
    {
      name: 'quan',
    },
    {
      name: 'cqq',
    },
  ), {
    name: 'cqq',
  });
  t.deepEqual(merge(
    {
      name: 'quan',
      age: 22,
    },
    {
      name: 'cqq',
    },
  ), {
    name: 'cqq',
    age: 22,
  });
  t.deepEqual(merge(
    {
      name: 'quan',
      age: 22,
    },
    {
      name: 'cqq',
      foo: 'aaa',
    },
  ), {
    name: 'cqq',
    age: 22,
    foo: 'aaa',
  });
  t.deepEqual(merge(
    {
      name: 'quan',
      obj: {
        age: 33,
        name: 'xxx',
      },
    },
    {
      obj: {
        name: 'obj2',
      },
    },
  ), {
    name: 'quan',
    obj: {
      age: 33,
      name: 'obj2',
    },
  });
  t.deepEqual(merge(
    {
      name: 'quan',
      obj: {
        list: [1],
        sub: {},
      },
    },
    {
      obj: {
        name: 'obj2',
        list: [],
        foo: {
          bar: 'xxx',
        },
      },
    },
  ), {
    name: 'quan',
    obj: {
      name: 'obj2',
      list: [],
      sub: {},
      foo: {
        bar: 'xxx',
      },
    },
  });
  t.deepEqual(merge({
    name: 'cqq',
    obj: {
      name: 'obj',
      sub: {
        age: 22,
      },
    },
  }), {
    name: 'cqq',
    obj: {
      name: 'obj',
      sub: {
        age: 22,
      },
    },
  });
  t.deepEqual(merge(null, {
    name: 'cqq',
    obj: {
      name: 'obj',
      sub: {
        age: 22,
      },
    },
  }), {
    name: 'cqq',
    obj: {
      name: 'obj',
      sub: {
        age: 22,
      },
    },
  });
  t.deepEqual(merge({
    name: 'cqq',
    obj: {
      name: 'obj',
      sub: {
        age: 22,
      },
    },
  }, {
    obj: {
      name: 'foo',
      sub: null,
    },
  }), {
    name: 'cqq',
    obj: {
      name: 'foo',
      sub: null,
    },
  });
});
