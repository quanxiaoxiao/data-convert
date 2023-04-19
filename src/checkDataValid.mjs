/* eslint consistent-return: 0 */
import Ajv from 'ajv/dist/2019.js'; // eslint-disable-line
import _ from 'lodash';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

const DATA_EMPTY = 0;
const DATA_TYPE_INVALID = 1;
const DATA_VALUE_EMPTY = 2;
const DATA_VALUE_INVALID = 3;

const validateField = (new Ajv({ strict: false })).compile({
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    type: {
      enum: [
        'number',
        'string',
        'boolean',
        'integer',
        'json',
        'array',
        'object',
      ],
    },
    message: {
      type: 'string',
      nullable: true,
    },
    required: {
      type: 'boolean',
      nullable: true,
    },
    schema: {
      type: 'object',
      nullable: true,
    },
    list: {
      type: 'array',
      items: {
        $ref: '#',
      },
      nullable: true,
    },
  },
  required: ['name', 'type'],
});

const checkDataValueValid = (validateList, v) => {
  for (let i = 0; i < validateList.length; i++) {
    const validate = validateList[i];
    const ret = validate(v);
    if (ret) {
      return ret;
    }
  }
};

const check = (fieldItem, data) => {
  const map = {
    [DATA_TYPE_NUMBER]: () => ({
      type: 'number',
    }),
    [DATA_TYPE_INTEGER]: () => ({
      type: 'number',
      match: (v) => {
        if (!Number.isInteger(v)) {
          return [DATA_TYPE_INVALID, null];
        }
        return null;
      },
    }),
    [DATA_TYPE_STRING]: (d) => ({
      type: 'string',
      match: (v) => {
        if (d.required) {
          if (v === '') {
            return [DATA_VALUE_EMPTY, null];
          }
          if (d.trim && v.trim() === '') {
            return [DATA_VALUE_EMPTY, null];
          }
        }
        return null;
      },
    }),
    [DATA_TYPE_BOOLEAN]: () => ({
      type: 'boolean',
    }),
    [DATA_TYPE_JSON]: () => ({
      type: ['object', 'string', 'number', 'boolean'],
    }),
    [DATA_TYPE_ARRAY]: (d) => ({
      type: 'object',
      match: (v) => {
        if (!Array.isArray(v)) {
          return [DATA_TYPE_INVALID, null];
        }
        if (d.required && v.length === 0) {
          return [DATA_VALUE_EMPTY, null];
        }
        return null;
      },
    }),
    [DATA_TYPE_OBJECT]: (d) => ({
      type: 'object',
      match: (v) => {
        if (!_.isPlainObject(v)) {
          return [DATA_TYPE_INVALID, null];
        }
        if (d.required && _.isEmpty(v)) {
          return [DATA_VALUE_EMPTY, null];
        }
        return null;
      },
    }),
  };
  const v = data[fieldItem.name];
  if (v == null) {
    if (fieldItem.required) {
      return [DATA_VALUE_EMPTY, null];
    }
    if (fieldItem.type === 'array') {
      return [DATA_VALUE_INVALID, null];
    }
    return null;
  }
  const dataType = typeof v;
  const handler = map[fieldItem.type](fieldItem);
  if (Array.isArray(handler.type)) {
    if (!handler.type.include(dataType)) {
      return [DATA_TYPE_INVALID, null];
    }
  } else if (handler.type !== dataType) {
    return [DATA_TYPE_INVALID, null];
  }
  if (handler.match) {
    const ret = handler.match(v);
    if (ret) {
      return ret;
    }
  }
  return null;
};

const generateFieldValidate = (fieldList, parentName) => {
  const result = [];
  for (let i = 0; i < fieldList.length; i++) {
    const fieldItem = fieldList[i];
    if (!validateField(fieldItem)) {
      throw new Error(`field \`${JSON.stringify(fieldItem)}\` invalid ${JSON.stringify(validateField.errors)}`);
    }
    const pathName = parentName ? `${parentName}.${fieldItem.name}` : fieldItem.name;
    if (!fieldItem.schema) {
      const next = !_.isEmpty(fieldItem.list)
        ? generateFieldValidate(fieldItem.list, pathName)
        : null;

      const fn = (data) => {
        const ret = check(fieldItem, data);
        if (ret) {
          return [pathName, ...ret];
        }
        const v = data[fieldItem.name];
        if (_.isEmpty(next) || v == null) {
          return null;
        }
        if (fieldItem.type === 'object') {
          const invalid = checkDataValueValid(next, v);
          if (invalid) {
            return invalid;
          }
        }
        if (fieldItem.type === 'array') {
          for (let j = 0; j < v.length; j++) {
            const invalid = checkDataValueValid(next, v[j]);
            if (invalid) {
              return [invalid[0].replace(new RegExp(`${fieldItem.name}\\.([^.]+)$`), (a, b) => `${fieldItem.name}.${j}.${b}`), ...invalid.slice(1)];
            }
          }
        }
      };
      result.push(fn);
    } else {
      try {
        const validate = new Ajv({
          strict: false,
        }).compile(fieldItem.schema);

        result.push((data) => {
          if (!validate(data)) {
            if (fieldItem.message) {
              return [pathName, DATA_VALUE_INVALID, fieldItem.message];
            }
            return [pathName, DATA_VALUE_INVALID, JSON.stringify(validate.errors)];
          }
          return null;
        });
      } catch (error) {
        throw new Error(`\`${fieldItem}\` parse schema fail, \`${JSON.stringify(fieldItem.schema)}\``);
      }
    }
  }
  return result;
};

const checkDataValid = (list) => {
  if (_.isEmpty(list)) {
    return () => null;
  }
  const validateList = generateFieldValidate(list);
  return (data) => {
    if (!_.isPlainObject(data)) {
      return ['', DATA_EMPTY, 'data invalid'];
    }
    return checkDataValueValid(validateList, data);
  };
};

export default checkDataValid;
