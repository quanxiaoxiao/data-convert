import test from 'ava'; // eslint-disable-line
import checkDataValid from '../src/checkDataValid.mjs';

test('checkDataValid', (t) => {
  let ret = checkDataValid([], {});
  t.is(ret, undefined);
  ret = checkDataValid([
    {
      dataKey: 'name',
      dataType: 'string',
      required: true,
    },
  ], { name: '' });
  t.true(!!ret);
  ret = checkDataValid([
    {
      dataKey: 'name',
      dataType: 'string',
    },
  ], { name: '' });
  t.true(!ret);
  ret = checkDataValid([
    {
      dataKey: 'array',
      dataType: 'array',
      required: true,
    },
  ], { array: [] });
  t.true(!!ret);
  ret = checkDataValid([
    {
      dataKey: 'array',
      dataType: 'array',
      required: true,
    },
  ], { array: ['1'] });
  t.true(!ret);
});

test('checkDataValid individual', (t) => {
  const fieldList = [
    {
      dataKey: 'name',
      dataType: 'string',
      required: true,
    },
    {
      dataKey: 'type',
      dataType: 'number',
      required: true,
    },
    {
      dataKey: 'dataType',
      dataType: 'string',
      required: true,
      schema: JSON.stringify({
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
      }),
    },
  ];
  let ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 5,
    dataType: 'number',
  });
  t.true(!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 5,
    dataType: 'string',
  });
  t.true(!!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 6,
    dataType: 'string',
  });
  t.true(!!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 8,
    dataType: 'string',
  });
  t.true(!!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 8,
    dataType: 'number',
  });
  t.true(!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 1,
    dataType: 'string',
  });
  t.true(!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 7,
    dataType: 'array',
  });
  t.true(!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 7,
    dataType: 'string',
  });
  t.true(!!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 15,
    dataType: 'string',
  });
  t.true(!!ret);
  ret = checkDataValid(fieldList, {
    name: 'aaa',
    type: 15,
    dataType: 'array',
  });
  t.true(!ret);
});
