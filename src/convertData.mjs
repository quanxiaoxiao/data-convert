import _ from 'lodash';
import convertDataValue from './convertDataValue.mjs';

const isTypeValid = (type) => [
  'number',
  'string',
  'integer',
  'boolean',
  'array',
  'json',
  'object',
].includes(type);

const convertData = (schema) => {
  const keys = Object.keys(schema);
  return (data) => keys.reduce((acc, key) => {
    const dataType = schema[key];
    if (dataType == null) {
      return acc;
    }
    const type = typeof dataType;
    if (type === 'object') {
      if (!isTypeValid(dataType.type)) {
        return acc;
      }
      let dataValue = data[key];
      if (dataType.trim && typeof dataValue === 'string') {
        dataValue = dataValue.trim();
      }
      if (dataType.schema && _.isPlainObject(dataType.schema)) {
        const convert = convertData(dataType.schema);
        if (dataType.type === 'object') {
          return {
            ...acc,
            [key]: convert(convertDataValue(dataValue, dataType.type)),
          };
        }
        if (dataType.type === 'array') {
          const arr = convertDataValue(dataValue, dataType.type);
          return {
            ...acc,
            [key]: arr.map((d) => convert(d)),
          };
        }
      }
      return {
        ...acc,
        [key]: convertDataValue(dataValue, dataType.type),
      };
    }
    if (type === 'string' && isTypeValid(type)) {
      return {
        ...acc,
        [key]: convertDataValue(data[key], dataType),
      };
    }
    return acc;
  }, {});
};

export default convertData;
