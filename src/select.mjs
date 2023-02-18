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

const generateData = (d, fieldList) => {
  const obj = {};
  for (let i = 0; i < fieldList.length; i++) {
    const fieldItem = fieldList[i];
    obj[fieldItem.name] = fieldItem.fn(d);
  }
  return obj;
};

const getDataValue = (data, dataKey, defaultValue = null) => _.get(data, dataKey, defaultValue);

const checkDataTypeSupport = (dataType) => {
  if (!['string', 'number', 'boolean', 'integer'].includes(dataType)) {
    throw new Error(`\`${dataType}\` not support`);
  }
};

const test = (exp) => {
  const convertFieldList = (express) => {
    const keys = Object.keys(express);
    const fieldList = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const ref = express[key];
      const item = {
        name: key,
        fn: () => ref,
      };
      if (typeof ref === 'string' && ref.startsWith('$')) {
        if (ref === '$') {
          item.fn = (d) => d;
        } else {
          const arr = ref.slice(1).split(':');
          if (arr.length > 2) {
            throw new Error(`\`${ref}\` invalid`);
          }
          const dataKey = arr[0].trim();
          const dataType = (arr[1] || '').trim();
          if (dataType) {
            checkDataTypeSupport(dataType);
            item.fn = (d) => convertDataValue(getDataValue(d, dataKey), dataType);
          } else {
            item.fn = (d) => getDataValue(d, dataKey);
          }
        }
      } else if (_.isPlainObject(ref)) {
        const subFieldList = convertFieldList(ref);
        item.fn = (d) => generateData(d, subFieldList);
      } else if (Array.isArray(ref)
        && ref.length === 2
        && typeof ref[0] === 'string'
        && _.isPlainObject(ref[1])) {
        if (!ref[0].startsWith('$')) {
          throw new Error(`\`${JSON.stringify(ref)}\` invalid`);
        }
        const _schema = ref[1];
        const dataType = _schema.type;
        const dataKey = ref[0].slice(1);
        if (dataType === 'object' || dataType === 'array') {
          const subFieldList = convertFieldList(_schema.properties);
          if (dataType === 'array') {
            item.fn = (d) => {
              const dataValue = getDataValue(d, dataKey);
              if (!Array.isArray(dataValue)) {
                return [];
              }
              return dataValue.map((dd) => generateData(dd, subFieldList));
            };
          } else {
            item.fn = (d) => generateData(getDataValue(d, dataKey), subFieldList);
          }
        } else {
          checkDataTypeSupport(dataType);
          item.fn = (d) => convertDataValue(getDataValue(d, dataKey), dataType);
        }
      }
      fieldList.push(item);
    }
    return fieldList;
  };
  const fieldList = convertFieldList(exp);
  return (data) => generateData(data, fieldList);
};

const select = (schema) => {
  if (!validate(schema)) {
    throw new Error(`select schema \`${JSON.stringify(schema)}\` invalid`);
  }
  const dataType = schema.type;
  if (dataType !== 'array' && dataType !== 'object') {
    return (data) => convertDataValue(data, dataType);
  }
  const convert = test(schema.properties);
  if (dataType === 'array') {
    return (data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map((d) => convert(d));
    };
  }
  return convert;
};

export default select;
