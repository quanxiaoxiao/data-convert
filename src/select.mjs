import _ from 'lodash';
import Ajv from 'ajv';
import convertDataValue from './convertDataValue.mjs';

const ajv = new Ajv();

const validate = ajv.compile({
  type: 'object',
  anyOf: [
    {
      properties: {
        type: {
          enum: ['object', 'array'],
        },
        properties: {
          type: 'object',
        },
      },
      required: ['type', 'properties'],
      additionalProperties: false,
    },
    {
      properties: {
        type: {
          enum: ['string', 'number', 'boolean', 'integer'],
        },
      },
      required: ['type'],
      additionalProperties: false,
    },
  ],
});

const checkoutData = (ref, data) => {
  const valueType = typeof ref;
  if (ref == null
      || valueType === 'number'
      || valueType === 'boolean') {
    return ref;
  }
  if (valueType === 'string') {
    if (ref[0] === '$') {
      if (ref === '$') {
        return data;
      }
      const arr = ref.slice(1).split(':');
      if (arr.length === 2 && ['string', 'number', 'boolean', 'integer'].includes(arr[1].trim())) {
        return convertDataValue(_.get(data, arr[0].trim()), arr[1].trim());
      }
      return _.get(data, ref.slice(1), null);
    }
    return ref;
  }
  if (_.isPlainObject(ref)) {
    return Object.keys(ref).reduce((acc, subDataKey) => ({
      ...acc,
      [subDataKey]: checkoutData(ref[subDataKey], data),
    }), {});
  }
  if (Array.isArray(ref)) {
    return ref.map((d) => checkoutData(d, data));
  }
  return null;
};

const select = (express) => {
  if (!validate(express)) {
    return () => {
      throw new Error(`select express \`${JSON.stringify(express)}\` invalid`);
    };
  }
  if (express.type !== 'array' && express.type !== 'object') {
    return (data) => convertDataValue(data, express.type);
  }
  const dataKeys = Object.keys(express.properties);
  if (express.type === 'array') {
    return (data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map((d) => dataKeys.reduce((acc, dataKey) => ({
        ...acc,
        [dataKey]: checkoutData(express.properties[dataKey], d),
      }), {}));
    };
  }
  return (data) => dataKeys.reduce((acc, dataKey) => ({
    ...acc,
    [dataKey]: checkoutData(express.properties[dataKey], data),
  }), {});
};

export default select;
