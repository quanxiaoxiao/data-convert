import Ajv2019 from 'ajv/dist/2019.js'; // eslint-disable-line

const ajv = new Ajv2019();

const validate = ajv.compile({
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    foo: {
      type: 'number',
    },
  },
  required: ['name', 'foo'],
  dependentSchemas: {
    foo: {
      properties: {
        bar: {
          type: 'number',
        },
      },
      required: ['bar'],
    },
  },
  additionalProperties: true,
});

const ret = validate({
  name: '111',
  age: '88',
  foo: 333,
  bar: '111',
});

console.log(ret);
