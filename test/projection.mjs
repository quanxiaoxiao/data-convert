import test from 'ava'; // eslint-disable-line
import _ from 'lodash';
import projection from '../src/projection.mjs';

test('projection', (t) => {
  t.throws(() => {
    projection('aaa')([]);
  });
  t.throws(() => {
    projection([
      {
        $filter: {},
        $get: 'aa',
      },
    ])([]);
  });
  t.throws(() => {
    projection([
      {
        $notFound: 'xxxxx',
      },
    ])([]);
  });
  t.deepEqual(projection([])('bbb'), 'bbb');
  t.deepEqual(projection([])([{ name: 'cqq' }]), [{ name: 'cqq' }]);
});

test('projection get', (t) => {
  t.throws(() => {
    projection([
      {
        $get: {},
      },
    ])({ name: 'aaa' });
  });
  t.is(
    projection([
      {
        $get: 'data.list',
      },
    ])(null),
    null,
  );
  t.is(
    projection([
      {
        $get: 'data.name',
      },
    ])({ data: {} }),
    null,
  );
  t.is(
    projection([
      {
        $get: 'data.name',
      },
    ])({ data: { name: 'cqq' } }),
    'cqq',
  );
  t.deepEqual(
    projection([
      {
        $get: 'data.list',
      },
    ])({ data: { list: [{ name: 'cqq' }] } }),
    [{ name: 'cqq' }],
  );
  t.is(
    projection([
      {
        $get: 'endDate',
      },
    ])({ endDate: 333 }),
    333,
  );
});

test('projection map', (t) => {
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
        },
      },
    ])('asdf'),
    { name: 1 },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: '$name',
        },
      },
    ])({ cqq: 'xxx' }),
    { name: null },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          test: true,
          big: '$cqq',
        },
      },
    ])({ cqq: 'xxx' }),
    { test: true, big: 'xxx' },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          test: '$',
        },
      },
    ])('xxx'),
    { test: 'xxx' },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          test: '$',
        },
      },
    ])(false),
    { test: false },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          arr: ['$name', 'cqq', 3, true, { big: '$age' }, { foo: 1 }],
        },
      },
    ])({ name: 'xxx', age: 30 }),
    {
      arr: ['xxx', 'cqq', 3, true, { big: 30 }, { foo: 1 }],
    },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          test: true,
        },
      },
    ])({ cqq: 'xxx' }),
    { test: true },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
          age: 1,
        },
      },
    ])({ name: 'cqq', age: 30, big: 'foo' }),
    { name: 1, age: 1 },
  );
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
  t.throws(() => {
    projection([
      {
        $map: 1,
      },
    ]);
  });
  t.throws(() => {
    projection([
      {
        $map: true,
      },
    ]);
  });
  t.throws(() => {
    projection([
      {
        $map: null,
      },
    ]);
  });
  t.throws(() => {
    projection([
      {
        $map: ['name'],
      },
    ]);
  });
  t.deepEqual(
    projection([
      {
        $map: {
          name: 'xxx',
        },
      },
    ])({}),
    { name: 'xxx' },
  );
  t.deepEqual(
    projection([
      {
        $map: 'cqq',
      },
    ])(['11', '22']),
    ['cqq', 'cqq'],
  );
  t.deepEqual(
    projection([
      {
        $map: 'cqq,{{name}}',
      },
    ])([{ name: 'aa' }, { name: 'bb' }]),
    ['cqq,aa', 'cqq,bb'],
  );
  t.deepEqual(
    projection([
      {
        $map: '{{name}}-{{age}}-{{cqq}}',
      },
    ])([{ name: 'aa', age: 33 }, { name: 'bb', age: 34 }]),
    ['aa-33-', 'bb-34-'],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 'xxx',
        },
      },
    ])('asd'),
    { name: 'xxx' },
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
        },
      },
    ])(data),
    [
      { name: 1 },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
          quan: '$',
        },
      },
    ])(data),
    [
      { name: 1, quan: JSON.parse(JSON.stringify(data[0])) },
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
          age: '$age',
        },
      },
    ])(data),
    [
      { name: 1, age: 30 },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          empty: null,
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
          age: '$age',
          name: null,
        },
      },
    ])(data),
    [
      { age: 30, name: null },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          obj: '$obj',
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
          name: '$name',
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
  t.deepEqual(
    projection([
      {
        $map: {
          name: '$name',
          sub: {},
        },
      },
    ])(data),
    [
      {
        name: 'cqq',
        sub: {},
      },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: 1,
          sub: {
            empty: 1,
          },
        },
      },
    ])(data),
    [
      {
        name: 1,
        sub: {
          empty: 1,
        },
      },
    ],
  );
  t.deepEqual(
    projection([
      {
        $map: {
          name: '$name',
          aa: {
            name: '$names',
            cc: 'cc',
          },
          obj: {
            name: '$name',
          },
          bb: {
            cc: {
              dd: '$foo',
              name: 'xxx',
              aa: '$obj.name',
              ee: '$ee',
              big: '$obj.empty',
            },
          },
        },
      },
    ])(data),
    [
      {
        name: 'cqq',
        obj: {
          name: 'cqq',
        },
        aa: {
          name: null,
          cc: 'cc',
        },
        bb: {
          cc: {
            dd: 'foo',
            name: 'xxx',
            aa: 'obj',
            ee: null,
            big: null,
          },
        },
      },
    ],
  );
});

test('projection $filter', (t) => {
  const data = [
    {
      name: 'cqq',
      age: 30,
    },
    {
      name: 'quan',
      age: 31,
    },
    {
      name: 'norice',
      age: 32,
    },
    {
      name: 'foo',
      age: 29,
    },
    {
      name: 'big',
      age: 30,
    },
    {
      name: 'a1',
      age: 34,
    },
    {
      name: 'A1',
      age: 19,
    },
    {
      name: 'a2',
      age: 29,
    },
    {
      name: 'b1',
      age: 27,
    },
  ];
  t.deepEqual(
    projection([
      {
        $filter: {},
      },
    ])('xxx'),
    [],
  );
  t.deepEqual(
    projection([
      {
        $filter: {},
      },
    ])(true),
    [],
  );
  t.throws(() => {
    projection([
      {
        $filter: 'xxx',
      },
    ]);
  });
  t.deepEqual(
    projection([
      {
        $filter: [],
      },
    ])(data),
    JSON.parse(JSON.stringify(data)),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $eq: 30,
          },
        },
      },
    ])(data),
    data.filter((d) => d.age === 30),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $and: [
              {
                $gte: 30,
              },
              {
                $lt: 35,
              },
            ],
          },
        },
      },
    ])(data),
    data.filter((d) => d.age >= 30 && d.age < 35),
  );
  t.throws(() => {
    projection([
      {
        $filter: {
          age: {
            $and: [
              {
                $gte: 30,
              },
              {
                $lts: 35,
              },
            ],
          },
        },
      },
    ]);
  });
  t.throws(() => {
    projection([
      {
        $filter: {
          age: {
            $and: {},
          },
        },
      },
    ]);
  });
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $or: [
              {
                $lt: 30,
              },
              {
                $gt: 35,
              },
            ],
          },
        },
      },
    ])(data),
    data.filter((d) => d.age < 30 || d.age > 35),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: 30,
          name: 'big',
        },
      },
    ])(data),
    data.filter((d) => d.age === 30 && d.name === 'big'),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $gt: 30,
          },
        },
      },
    ])(data),
    data.filter((d) => d.age > 30),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          name: {
            $ne: 'big',
          },
        },
      },
    ])(data),
    data.filter((d) => d.name !== 'big'),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          name: {
            $regex: ['^a[0-9]$', 'i'],
          },
        },
      },
    ])(data),
    data.filter((d) => /^a[0-9]$/i.test(d.name)),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          name: {
            $regex: '^a[0-9]$',
          },
        },
      },
    ])(data),
    data.filter((d) => /^a[0-9]$/.test(d.name)),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          name: {
            $in: ['cqq', 'quan'],
          },
        },
      },
    ])(data),
    data.filter((d) => ['cqq', 'quan'].includes(d.name)),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          name: {
            $nin: ['cqq', 'quan'],
          },
        },
      },
    ])(data),
    data.filter((d) => !['cqq', 'quan'].includes(d.name)),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $gt: 33,
          },
        },
      },
    ])(data),
    data.filter((d) => d.age > 33),
  );
  t.throws(() => {
    projection([
      {
        $filter: {
          age: {
            $gt: 33,
            $lt: 18,
          },
        },
      },
    ]);
  });
  t.throws(() => {
    projection([
      {
        $filter: {
          name: {
            $in: [{}],
          },
        },
      },
    ]);
  });
  t.deepEqual(
    projection([
      {
        $filter: {
          name: {
            $not: {
              $eq: 'quan',
            },
          },
        },
      },
    ])(data),
    data.filter((d) => d.name !== 'quan'),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $not: {
              $lt: 30,
            },
          },
        },
      },
    ])(data),
    data.filter((d) => d.age >= 30),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $not: {
              $lte: 30,
            },
          },
        },
      },
    ])(data),
    data.filter((d) => d.age > 30),
  );
  t.deepEqual(
    projection([
      {
        $filter: {
          age: {
            $not: {
              $and: [
                {
                  $gte: 30,
                },
              ],
            },
          },
        },
      },
    ])(data),
    data.filter((d) => !(d.age >= 30)),
  );
  t.throws(() => {
    projection([
      {
        $filter: {
          age: {
            $not: {
              $ll: 33,
            },
          },
        },
      },
    ]);
  });
  t.deepEqual(
    projection([
      {
        $filter: [
          {
            age: 30,
          },
          {
            name: 'foo',
          },
        ],
      },
    ])(data),
    data.filter((d) => d.age === 30 || d.name === 'foo'),
  );
});

test('projection $find', (t) => {
  t.throws(() => {
    projection(
      [
        {
          $find: 'xxx',
        },
      ],
    )();
  });
  const data = [
    {
      name: 'cqq',
      age: 30,
    },
    {
      name: 'quan',
      age: 31,
    },
    {
      name: 'norice',
      age: 32,
    },
    {
      name: 'foo',
      age: 29,
    },
    {
      name: 'big',
      age: 30,
    },
    {
      name: 'a1',
      age: 34,
    },
    {
      name: 'A1',
      age: 19,
    },
    {
      name: 'a2',
      age: 29,
    },
    {
      name: 'b1',
      age: 27,
    },
  ];
  t.deepEqual(
    projection([
      {
        $find: {
          name: 'cqq',
        },
      },
    ])(data),
    data.find((d) => d.name === 'cqq'),
  );
  t.deepEqual(
    projection([
      {
        $find: {
          age: {
            $gt: 28,
          },
          name: 'cqq',
        },
      },
    ])(data),
    data.find((d) => d.age > 28 && d.name === 'cqq'),
  );
  t.deepEqual(
    projection([
      {
        $find: [
          {
            name: 'cqq',
          },
          {
            name: 'quan',
          },
        ],
      },
    ])(data),
    data.find((d) => d.name === 'cqq' || d.name === 'quan'),
  );
  t.deepEqual(
    projection([
      {
        $find: [
          {
          },
        ],
      },
    ])(data),
    data[0],
  );
  t.deepEqual(
    projection([
      {
        $find: [],
      },
    ])(data),
    data[0],
  );
  t.deepEqual(
    projection([
      {
        $find: {},
      },
    ])(data),
    data[0],
  );
});

test('projection $group', (t) => {
  const data = [
    {
      name: 'cqq',
      age: 30,
    },
    {
      name: 'quan',
      age: 31,
    },
    {
      name: 'norice',
      age: 32,
    },
    {
      name: 'foo',
      age: 29,
    },
    {
      name: 'big',
      age: 30,
    },
    {
      name: 'a1',
      age: 34,
    },
    {
      name: 'A1',
      age: 19,
    },
    {
      name: 'a2',
      age: 29,
    },
    {
      name: 'b1',
      age: 27,
    },
  ];
  t.deepEqual(
    projection([
      {
        $group: 'name',
      },
    ])(data),
    _.groupBy(data, 'name'),
  );
});

test('projection $join', (t) => {
  t.is(
    projection([
      {
        $join: ';',
      },
    ])(['aa', 'bb']),
    'aa;bb',
  );
});

test('projection convert', (t) => {
  t.deepEqual(
    projection([
      {
        $convert: {
          name: 'string',
          age: 'integer',
        },
      },
    ])({
      name: 'cqq',
      big: 'foo',
      age: '33',
    }),
    {
      name: 'cqq',
      age: 33,
    },
  );
  t.deepEqual(
    projection([
      {
        $convert: {
          name: 'string',
          age: 'integer',
        },
      },
    ])([{
      name: 'cqq',
      big: 'foo',
      age: '33',
    }]),
    [{
      name: 'cqq',
      age: 33,
    }],
  );
});

test('projection pipeline', (t) => {
  const data = [
    {
      name: 'aaa',
      value: '#f00',
    },
    {
      name: 'bbb',
      value: '#ff0',
    },
  ];
  t.is(
    projection([
      {
        $map: '--color-{{name}}:{{value}};',
      },
      {
        $join: ' ',
      },
    ])(data),
    data.map((d) => `--color-${d.name}:${d.value};`).join(' '),
  );
});
