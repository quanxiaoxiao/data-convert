import _ from 'lodash';
import Ajv from 'ajv';
import convertDataValue from './convertDataValue.mjs';

const validate = new Ajv().compile({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      type: {
        enum: [
          'number',
          'string',
          'boolean',
          'json',
          'array',
          'object',
          'integer',
        ],
      },
      trim: {
        type: 'boolean',
        nullable: true,
      },
      list: {
        $ref: '#',
      },
    },
    required: [
      'name',
      'type',
    ],
  },
});

const walk = (data, fieldList) => {
  const result = {};
  for (let i = 0; i < fieldList.length; i++) {
    const fieldItem = fieldList[i];
    result[fieldItem.name] = convertDataValue(_.get(data, fieldItem.name), fieldItem.type);
    if (fieldItem.trim && fieldItem.type === 'string' && typeof result[fieldItem.name] === 'string') {
      result[fieldItem.name] = result[fieldItem.name].trim();
    }
    if (!_.isEmpty(fieldItem.list)) {
      if (fieldItem.type === 'array') {
        if (Array.isArray(result[fieldItem.name])) {
          result[fieldItem.name] = result[fieldItem.name].map((d) => walk(d, fieldItem.list));
        } else {
          result[fieldItem.name] = [];
        }
      } else if (fieldItem.type === 'object') {
        result[fieldItem.name] = walk(result[fieldItem.name], fieldItem.list);
      }
    }
  }
  return result;
};

const checkoutDataValue = (fieldList) => {
  if (!validate(fieldList)) {
    throw new Error(validate.errors.join(','));
  }
  return (data) => walk(data, fieldList);
};

export default checkoutDataValue;
