/* eslint no-use-before-define: 0 */
import _ from 'lodash';
import Ajv from 'ajv';
import convertDataValue from './convertDataValue.mjs';

const ajv = new Ajv({
  strict: false,
});

const validate = ajv.compile({
  type: 'object',
  anyOf: [
    {
      properties: {
        type: {
          enum: ['object', 'array'],
        },
        properties: {
          anyOf: [
            {
              type: 'array',
              items: [
                {
                  type: 'string',
                },
                {
                  type: ['object', 'array'],
                },
              ],
              additionalItems: false,
            },
            {
              type: 'object',
            },
          ],
        },
      },
      required: ['type', 'properties'],
    },
    {
      properties: {
        type: {
          enum: ['string', 'number', 'boolean', 'integer'],
        },
        properties: {
          type: 'array',
          items: [
            {
              type: 'string',
            },
            {
              type: ['object', 'array'],
            },
          ],
          additionalItems: false,
        },
      },
      required: ['type'],
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

const getDataValue = (data, dataKey, defaultValue = null) => {
  if (dataKey == null || dataKey === '' || dataKey === '$') {
    return data;
  }
  return _.get(data, dataKey, defaultValue);
};

const checkDataTypeSupport = (dataType) => {
  if (!['string', 'number', 'boolean', 'integer'].includes(dataType)) {
    throw new Error(`\`${dataType}\` not support`);
  }
};

const selectDataValue = (express) => {
  if (!express.startsWith('$')) {
    throw new Error(`\`${express}\` invalid`);
  }
  const ret = express.slice(1).split(':');
  if (ret.length > 2) {
    throw new Error(`\`${express}\` invalid`);
  }
  const dataKey = ret[0].trim();
  const dataType = (ret[1] || '').trim();
  if (!dataType) {
    return (d) => getDataValue(d, dataKey);
  }
  checkDataTypeSupport(dataType);
  return (d) => convertDataValue(getDataValue(d, dataKey), dataType);
};

export const selectData = ([dataKey, schema]) => {
  if (typeof dataKey !== 'string' || !validate(schema)) {
    throw new Error(`\`${JSON.stringify(schema)}\` invalid`);
  }
  checkDataTypeSupport(schema.type);
  return (data) => {
    let dataValue = dataKey === '$' ? data : getDataValue(data, dataKey);
    if (schema.resolve) {
      dataValue = schema.resolve(dataValue);
    }
    return convertDataValue(dataValue, schema.type);
  };
};

const parse = (exp) => {
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
        item.fn = selectDataValue(ref);
      } else if (_.isPlainObject(ref)) {
        const subFieldList = convertFieldList(ref);
        item.fn = (d) => generateData(d, subFieldList);
      } else if (Array.isArray(ref)
        && ref.length === 2
        && typeof ref[0] === 'string'
        && (_.isPlainObject(ref[1]) || Array.isArray(ref[1]))) {
        const schema = ref[1];
        const next = select(schema);
        item.fn = (data) => next(getDataValue(data, ref[0]));
      }
      fieldList.push(item);
    }
    return fieldList;
  };
  const fieldList = convertFieldList(exp);
  return (data) => generateData(data, fieldList);
};

function select(schema) {
  if (Array.isArray(schema)) {
    if (_.isEmpty(schema)) {
      return (d) => d;
    }
    if (Array.isArray(schema[1])) {
      const convert = select(schema[1]);
      const dataKey = schema[0];
      return (d) => {
        const dataValue = getDataValue(d, dataKey);
        return convert(dataValue);
      };
    }
    return selectData(schema);
  }
  if (!validate(schema)) {
    throw new Error(`select schema \`${JSON.stringify(schema)}\` invalid`);
  }
  const dataType = schema.type;
  if (dataType !== 'array' && dataType !== 'object') {
    checkDataTypeSupport(dataType);
    if (Array.isArray(schema.properties)) {
      return selectData(schema.properties);
    }
    return (data) => convertDataValue(schema.resolve ? schema.resolve(data) : data, dataType);
  }
  if (dataType === 'array') {
    if (Array.isArray(schema.properties)) {
      const dataKey = schema.properties[0];
      if (/^\$\$/.test(dataKey)) {
        const convert = select(schema.properties[1]);
        return (data) => {
          if (!Array.isArray(data)) {
            return [];
          }
          return data.map((d) => convert(getDataValue(d, dataKey.slice(2))));
        };
      }
      if (Array.isArray(schema.properties[1])) {
        const convert = select({
          type: 'array',
          properties: schema.properties[1],
        });
        return (data) => {
          const arr = getDataValue(data, dataKey);
          if (!Array.isArray(arr)) {
            return [];
          }
          return convert(arr);
        };
      }
      const convert = select({
        properties: schema.properties[1].properties,
        type: 'array',
      });
      return (data) => {
        const arr = getDataValue(data, dataKey);
        if (!Array.isArray(arr)) {
          return [];
        }
        return convert(arr);
      };
    }
    const convert = parse(schema.properties);
    return (data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map((d) => convert(d));
    };
  }
  if (Array.isArray(schema.properties)) {
    const convert = select(schema.properties[1]);
    const dataKey = schema.properties[0];
    return (data) => {
      const dataValue = getDataValue(data, dataKey);
      if (dataValue == null) {
        return null;
      }
      return convert(dataValue);
    };
  }
  const convert = parse(schema.properties);
  return (d) => {
    if (d == null) {
      return null;
    }
    return convert(d);
  };
}

export default select;
