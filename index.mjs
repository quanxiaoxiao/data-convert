import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile({
  type: 'array',
  items: {
    type: 'object',
    oneOf: [
      {
        properties: {
          $gt: {
            type: 'number',
          },
        },
        required: ['$gt'],
        additionalProperties: false,
      },
      {
        properties: {
          $lt: {
            type: 'number',
          },
        },
        required: ['$lt'],
        additionalProperties: false,
      },
    ],
  },
  minItems: 1,
});

console.log(validate([
  {
    $in: [10, 30, 'true'],
  },
]));
