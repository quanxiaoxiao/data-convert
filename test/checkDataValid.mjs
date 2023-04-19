import test from 'ava'; // eslint-disable-line
import checkDataValid from '../src/checkDataValid.mjs';

test('checkDataValid', (t) => {
  let validate = checkDataValid([]);
  t.is(validate({}), undefined);
  t.is(validate({ name: 'cqq' }), undefined);
  t.throws(() => {
    checkDataValid([
      {
        type: 'string',
      },
    ]);
  });
  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: true,
    },
  ]);
  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      message: '123',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'integer',
          },
        },
      },
    },
  ]);
  t.is(validate({ name: 'aaaaaaa' })[2], '123');
  t.true(validate({ name: 111 }) == null);
  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
    },
  ]);
  t.true(validate({ name: '' }) == null);
  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: false,
    },
  ]);
  t.true(validate({ name: '' }) == null);
  t.true(validate({ name: 123 }) != null);
  validate = checkDataValid([
    {
      name: 'array',
      type: 'array',
      required: true,
    },
  ]);
  t.true(!!validate({ array: [] }));
  validate = checkDataValid([
    {
      name: 'array',
      type: 'array',
      required: true,
    },
  ]);
  t.true(!validate({ array: ['1'] }));
});

test('checkDataValid schema2', (t) => {
  const validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'dataType',
      type: 'string',
      required: true,
      schema: {
        type: 'object',
        properties: {
          dataType: {
            enum: [
              'string',
              'number',
              'object',
              'integer',
              'array',
              'json',
              'boolean',
            ],
          },
        },
        required: ['dataType'],
      },
    },
  ]);
  t.true(!validate({ name: 'cqq', dataType: 'string' }));
  t.true(!!validate({ name: 'cqq', dataType: 'strings' }));
});

test('checkDataValid individual', (t) => {
  const fieldList = [
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'type',
      type: 'number',
      required: true,
    },
    {
      name: 'dataType',
      type: 'string',
      required: true,
      schema: {
        type: 'object',
        required: ['dataType', 'type'],
        if: {
          properties: {
            type: {
              enum: [5, 6, 8],
            },
          },
        },
        then: {
          properties: {
            dataType: {
              const: 'number',
            },
          },
        },
        else: {
          if: {
            properties: {
              type: {
                enum: [7, 15],
              },
            },
          },
          then: {
            properties: {
              dataType: {
                const: 'array',
              },
            },
          },
          else: {
            properties: {
              dataType: {
                enum: [
                  'string',
                  'number',
                  'object',
                  'integer',
                  'array',
                  'json',
                  'boolean',
                ],
              },
            },
          },
        },
      },
    },
  ];
  const validate = checkDataValid(fieldList);
  t.true(!validate({
    name: 'aaa',
    type: 5,
    dataType: 'number',
  }));
  t.true(!!validate({
    name: 'aaa',
    type: 5,
    dataType: 'string',
  }));
  t.true(!!validate({
    name: 'aaa',
    type: 6,
    dataType: 'string',
  }));
  t.true(!!validate({
    name: 'aaa',
    type: 8,
    dataType: 'string',
  }));
  t.true(!validate({
    name: 'aaa',
    type: 8,
    dataType: 'number',
  }));
  t.true(!validate({
    name: 'aaa',
    type: 1,
    dataType: 'string',
  }));
  t.true(!validate({
    name: 'aaa',
    type: 7,
    dataType: 'array',
  }));
  t.true(!!validate({
    name: 'aaa',
    type: 7,
    dataType: 'string',
  }));
  t.true(!!validate({
    name: 'aaa',
    type: 15,
    dataType: 'string',
  }));
  t.true(!validate({
    name: 'aaa',
    type: 15,
    dataType: 'array',
  }));
});

test('checkDataValid sub', (t) => {
  const fieldList = [
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'list',
      type: 'array',
      required: true,
      list: [
        {
          name: 'name',
          type: 'string',
          required: true,
        },
        {
          name: 'age',
          type: 'integer',
          required: true,
        },
      ],
    },
    {
      name: 'obj',
      type: 'object',
      required: true,
      list: [
        {
          name: 'foo',
          type: 'string',
          required: true,
        },
        {
          name: 'list',
          type: 'array',
          required: true,
          list: [
            {
              name: 'bar',
              type: 'string',
              required: true,
            },
          ],
        },
      ],
    },
  ];
  const validate = checkDataValid(fieldList);

  t.true(!validate({
    name: 'aaa',
    list: [
      {
        name: 'name',
        age: 33,
      },
    ],
    obj: {
      foo: 'foo',
      list: [
        {
          bar: 'xxxx',
        },
      ],
    },
  }));
  t.true(!!validate({
    name: 'aaa',
    list: [],
    obj: {
      foo: 'foo',
      list: [
        {
          bar: 'xxxx',
        },
      ],
    },
  }));
  t.true(!!validate({
    name: 'aaa',
    list: [
      {
        name: 'name',
        age: 'bbb',
      },
    ],
    obj: {
      foo: 'foo',
      list: [
        {
          bar: 'xxxx',
        },
      ],
    },
  }));
  t.true(!!validate({
    name: 'aaa',
    list: [
      {
        name: 'name',
        age: 44,
      },
    ],
    obj: {
      foo: 'foo',
    },
  }));
  t.true(!!validate({
    name: 'aaa',
    list: [
      {
        name: 'name',
        age: 33,
      },
    ],
    obj: {
      foo: 'foo',
      list: [
        {
          bar: 33,
        },
      ],
    },
  }));
});

test('checkDataValid schema', (t) => {
  let validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'obj',
      type: 'object',
      required: true,
      schema: {
        type: 'object',
        properties: {
          bar: {
            type: 'string',
          },
        },
        required: ['bar'],
      },
      list: [
        {
          name: 'name',
          type: 'string',
          required: true,
        },
        {
          name: 'age',
          type: 'integer',
          required: true,
        },
      ],
    },
  ]);
  t.true(!validate({
    name: 'cqq',
    bar: 'foo',
    obj: 'xxx',
  }));
  t.true(!!validate({
    name: 'cqq',
    bar: 33,
    obj: 'xxx',
  }));
  t.true(!!validate({
    name: 'cqq',
    obj: {
      name: 'quan',
      age: 33,
    },
  }));
  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'obj',
      type: 'object',
      required: true,
      schema: {
        type: 'object',
        properties: {
          obj: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              age: {
                type: 'integer',
              },
            },
            required: ['name', 'age'],
          },
        },
        required: ['obj'],
      },
      list: [
        {
          name: 'name',
          type: 'string',
          required: true,
        },
        {
          name: 'age',
          type: 'number',
          required: true,
        },
      ],
    },
  ]);
  t.true(!validate({
    name: 'cqq',
    obj: {
      name: 'quan',
      age: 33,
    },
  }));
  t.true(!!validate({
    name: 'cqq',
    obj: {
      name: 'quan',
      age: 33.3,
    },
  }));

  t.true(!!validate({
    name: 'cqq',
    obj: {
      age: 33,
    },
  }));

  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'obj',
      type: 'object',
      required: true,
      schema: {
        type: 'object',
        properties: {
          obj: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              age: {
                type: 'integer',
              },
            },
            required: ['name', 'age'],
          },
        },
        required: ['obj'],
      },
      list: [
        {
          name: 'name',
          type: 'string',
          required: true,
          schema: {
            type: 'object',
            properties: {
              big: {
                type: 'string',
              },
            },
            required: ['big'],
          },
        },
        {
          name: 'age',
          type: 'number',
          required: true,
        },
      ],
    },
  ]);
  t.true(!validate({
    name: 'cqq',
    obj: {
      big: 'xxx',
      name: 'quan',
      age: 33,
    },
  }));
  t.true(validate({
    name: 'cqq',
    obj: {
      name: 'quan',
      age: 33,
    },
  }) == null);
  t.true(validate({
    name: 'cqq',
    obj: {
      big: 44,
      name: 'quan',
      age: 33,
    },
  }) == null);
  validate = checkDataValid([
    {
      name: 'name',
      type: 'string',
      required: true,
    },
    {
      name: 'obj',
      type: 'object',
      required: true,
      list: [
        {
          name: 'name',
          type: 'string',
          required: true,
          schema: {
            type: 'object',
            properties: {
              big: {
                type: 'string',
              },
            },
            required: ['big'],
          },
        },
        {
          name: 'age',
          type: 'number',
          required: true,
        },
      ],
    },
  ]);
  t.true(validate({
    name: 'cqq',
    obj: {
      big: 'xxx',
      name: 'quan',
      age: 33,
    },
  }) == null);
  t.true(validate({
    name: 'cqq',
    obj: {
      big: 'xxx',
      age: 33,
    },
  }) == null);
  t.true(validate({
    name: 'cqq',
    obj: {
      name: 'aaa',
      age: 33,
    },
  }) != null);
  t.true(validate({
    name: 'cqq',
  }) != null);
});
