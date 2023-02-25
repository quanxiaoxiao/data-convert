import test from 'ava'; // eslint-disable-line
import select, { selectData } from '../src/select.mjs';

test('selectData', (t) => {
  t.throws(() => {
    selectData(['name', { type: 'test' }]);
  });
  t.is(
    selectData(['name', { type: 'string' }])({ name: 'aaa' }),
    'aaa',
  );
  t.is(
    selectData(['$', { type: 'integer' }])('33.3'),
    33,
  );
  t.is(
    selectData(['', { type: 'integer' }])('33.3'),
    33,
  );
});

test('select invalid', (t) => {
  t.throws(() => {
    select('');
  });
  t.throws(() => {
    select([]);
  });
  t.throws(() => {
    select(1);
  });
  t.throws(() => {
    select({});
  });
  t.throws(() => {
    select({
      type: 'object',
    });
  });
  t.throws(() => {
    select({
      type: 'object',
      properties: [],
    });
  });
  t.throws(() => {
    select({ type: 'cqq' });
  });

  t.throws(() => {
    select({
      type: 'object',
      properties: {
        name: '$name:aaa',
      },
    });
  });

  t.throws(() => {
    select({
      type: 'object',
      properties: '$name:string',
    });
  });
});

test('data type by: boolean,integer,string,number', (t) => {
  t.is(
    select({ type: 'string' })('33'),
    '33',
  );
  t.is(
    select({ type: 'integer' })('33.3'),
    33,
  );
  t.is(
    select({ type: 'number' })('33.3'),
    33.3,
  );
  t.is(
    select({ type: 'boolean' })('true'),
    true,
  );
  t.is(
    select({ type: 'boolean' })('false'),
    false,
  );
  t.is(
    select({ type: 'integer' })('xxx'),
    null,
  );

  t.is(
    select({
      type: 'string',
      properties: ['name', { type: 'string' }],
    })({ name: '33.3' }),
    '33.3',
  );
  t.is(
    select({
      type: 'string',
      properties: ['$', { type: 'integer' }],
    })('33.3'),
    33,
  );
  t.is(
    select({
      type: 'string',
      properties: ['name', { type: 'integer' }],
    })({ name: '33.3' }),
    33,
  );
  t.is(
    select({
      type: 'string',
      properties: ['', { type: 'number' }],
    })('33.3'),
    33.3,
  );
  t.is(
    select({
      type: 'string',
      properties: ['name', { type: 'number' }],
    })({ name: '33.3' }),
    33.3,
  );
});

test('data type by object', (t) => {
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: 'quan',
        age: '$age:integer',
      },
    })({
      age: '33.3',
    }),
    {
      name: 'quan',
      age: 33,
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: ['obj', {
        type: 'object',
        properties: {
          name: '$name',
          age: '$age:integer',
        },
      }],
    })({
      age: '44',
      name: 'quan',
      obj: {
        name: 'cqq',
        age: '30',
      },
    }),
    {
      name: 'cqq',
      age: 30,
    },
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: ['obj', {
        type: 'object',
        properties: {
          name: '$name',
          age: '$age:integer',
          aa: ['sub', {
            type: 'object',
            properties: {
              name: '$name',
              age: '$age:integer',
            },
          }],
          foo: ['aa.name', { type: 'string' }],
          bar: ['bb', { type: 'string', properties: ['cc', { type: 'string' }] }],
        },
      }],
    })({
      age: '44',
      name: 'quan',
      obj: {
        name: 'cqq',
        age: '30',
        aa: {
          name: 'aa',
        },
        bb: {
          cc: 'cc',
        },
        sub: {
          name: 'sub',
          age: '99',
        },
      },
    }),
    {
      name: 'cqq',
      age: 30,
      bar: 'cc',
      foo: 'aa',
      aa: {
        name: 'sub',
        age: 99,
      },
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

test('data type by array', (t) => {
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', {
        type: 'string',
        properties: ['name', { type: 'string' }],
      }],
    })([
      {
        age: 22,
        name: 'quan',
      },
      {
        age: 33,
        name: 'cqq',
      },
    ]),
    ['quan', 'cqq'],
  );
  /*
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', ['name', { type: 'string' }]],
    })([
      {
        age: 22,
        name: 'quan',
      },
      {
        age: 33,
        name: 'cqq',
      },
    ]),
    ['quan', 'cqq'],
  );
  */
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', { type: 'integer' }],
    })(['1', 2, 3]),
    [1, 2, 3],
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: {
        name: '$name',
        age: '$age:integer',
      },
    })([{ name: 'cqq', age: '22.8' }, { name: 'quan', age: 18.9 }]),
    [{ name: 'cqq', age: 22 }, { name: 'quan', age: 18 }],
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: {
        name: '$name',
      },
    })([{ name: 'cqq', age: '22.8' }, { name: 'quan', age: 18.9 }]),
    [{ name: 'cqq' }, { name: 'quan' }],
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', {
        type: 'number',
        properties: ['age', {
          type: 'number',
        }],
      }],
    })([{ age: '33.3', name: 'cqq' }, { age: 22.1, name: 'quan' }]),
    [33.3, 22.1],
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', { type: 'number' }],
    })(['33', '22.8', 55]),
    [33, 22.8, 55],
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: '$name',
        arr: ['list', {
          type: 'array',
          properties: ['$', { type: 'number' }],
        }],
      },
    })({
      name: 'quan',
      list: ['33', '22.8', 55],
    }),
    {
      name: 'quan',
      arr: [33, 22.8, 55],
    },
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: ['list', {
        type: 'integer',
        properties: ['age', { type: 'integer' }],
      }],
    })({
      name: 'quan',
      list: [{ age: '33.3', name: 'cqq' }, { age: 22.1, name: 'quan' }],
    }),
    [33, 22],
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: '$name',
        arr: ['list', {
          type: 'array',
          properties: [
            '$',
            {
              type: 'integer',
              properties: ['age', { type: 'integer' }],
            },
          ],
        }],
      },
    })({
      name: 'quan',
      list: [{ age: '33.3', name: 'cqq' }, { age: 22.1, name: 'quan' }],
    }),
    {
      name: 'quan',
      arr: [33, 22],
    },
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: ['obj.list', {
        type: 'object',
        properties: {
          name: '$name:string',
        },
      }],
    })({
      obj: {
        list: [
          {
            name: 'cqq',
          },
        ],
      },
    }),
    [{ name: 'cqq' }],
  );
});

test('with resolve', (t) => {
  t.is(
    select({
      type: 'string',
      properties: ['name', {
        type: 'string',
        resolve: (d) => `cqq_${d}`,
      }],
    })({
      name: 'quan',
    }),
    'cqq_quan',
  );
  t.is(
    select({
      type: 'string',
      resolve: (d) => `---${d.name}`,
      properties: ['name', {
        type: 'string',
        resolve: (d) => `cqq_${d}`,
      }],
    })({
      name: 'quan',
    }),
    'cqq_quan',
  );
  t.is(
    select({
      type: 'string',
      resolve: (a) => a.name,
    })({
      name: 'quan',
    }),
    'quan',
  );
  t.deepEqual(
    select({
      type: 'object',
      properties: {
        name: ['name', {
          type: 'string',
          resolve: (d) => `cqq_${d}`,
        }],
      },
    })({
      age: 22,
      name: 'quan',
    }),
    { name: 'cqq_quan' },
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', {
        type: 'string',
        properties: ['name', { type: 'string' }],
      }],
    })([
      {
        age: 22,
        name: 'quan',
      },
      {
        age: 33,
        name: 'cqq',
      },
    ]),
    ['quan', 'cqq'],
  );
  t.deepEqual(
    select({
      type: 'array',
      properties: ['$', {
        type: 'string',
        resolve: (d) => `cqq_${d.name}`,
      }],
    })([
      {
        age: 22,
        name: 'quan',
      },
      {
        age: 33,
        name: 'cqq',
      },
    ]),
    ['cqq_quan', 'cqq_cqq'],
  );
});
