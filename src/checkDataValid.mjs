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

const generateFieldValidate = (fieldList) => {
  const result = [];
  const map = {
    [DATA_TYPE_NUMBER]: () => ({
      type: 'number',
    }),
    [DATA_TYPE_INTEGER]: (fieldItem) => ({
      type: 'number',
      match: (v) => {
        if (!Number.isInteger(v)) {
          return [fieldItem.name, DATA_TYPE_INVALID, null];
        }
        return null;
      },
    }),
    [DATA_TYPE_STRING]: (fieldItem) => ({
      type: 'string',
      match: (v) => {
        if (fieldItem.required) {
          if (v === '') {
            return [fieldItem.name, DATA_VALUE_EMPTY, null];
          }
          if (fieldItem.trim && v.trim() === '') {
            return [fieldItem.name, DATA_VALUE_EMPTY, null];
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
    [DATA_TYPE_ARRAY]: (fieldItem) => ({
      type: 'object',
      match: (v) => {
        if (!Array.isArray(v)) {
          return [fieldItem.name, DATA_TYPE_INVALID, null];
        }
        if (fieldItem.required && v.length === 0) {
          return [fieldItem.name, DATA_VALUE_EMPTY, null];
        }
        return null;
      },
    }),
    [DATA_TYPE_OBJECT]: (fieldItem) => ({
      type: 'object',
      match: (v) => {
        if (!_.isPlainObject(v)) {
          return [fieldItem.name, DATA_TYPE_INVALID, null];
        }
        return null;
      },
    }),
  };
  for (let i = 0; i < fieldList.length; i++) {
    const fieldItem = fieldList[i];
    if (!validateField(fieldItem)) {
      throw new Error(`field \`${JSON.stringify(fieldItem)}\` invalid ${JSON.stringify(validateField.errors)}`);
    }
    if (!fieldItem.schema) {
      const handler = map[fieldItem.type](fieldItem);
      const next = !_.isEmpty(fieldItem.list) ? generateFieldValidate(fieldItem.list) : null;
      result.push((data) => {
        const v = data[fieldItem.name];
        if (v == null) {
          if (fieldItem.required) {
            return [fieldItem.name, DATA_VALUE_EMPTY, null];
          }
          return null;
        }
        const dataType = typeof v;
        if (Array.isArray(handler.type)) {
          if (!handler.type.include(dataType)) {
            return [fieldItem.name, DATA_TYPE_INVALID, null];
          }
        } else if (handler.type !== dataType) {
          return [fieldItem.name, DATA_TYPE_INVALID, null];
        }
        if (handler.match) {
          const ret = handler.match(v);
          if (ret) {
            return ret;
          }
        }
        if (next) {
          if (fieldItem.type === 'array') {
            return v.find((d) => next.some((validate) => validate(d)));
          }
          if (v != null) {
            return next.some((validate) => validate(v));
          }
        }
        return null;
      });
    } else {
      try {
        const validate = new Ajv({
          strict: false,
        }).compile(fieldItem.schema);

        result.push((data) => {
          if (!validate(data)) {
            if (fieldItem.message) {
              return [fieldItem.name, DATA_VALUE_INVALID, fieldItem.message];
            }
            return [fieldItem.name, DATA_VALUE_INVALID, JSON.stringify(validate.errors)];
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
    return () => {};
  }
  const validateList = generateFieldValidate(list);
  return (data) => {
    if (!_.isPlainObject(data)) {
      return 'data invalid';
    }
    for (let i = 0; i < validateList.length; i++) {
      const validate = validateList[i];
      const ret = validate(data);
      if (ret) {
        return ret;
      }
    }
  };
};

export default checkDataValid;
