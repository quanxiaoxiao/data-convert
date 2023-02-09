/* eslint consistent-return: 0 */
import Ajv from 'ajv/dist/2019.js'; // eslint-disable-line
// import Ajv from 'ajv';
import _ from 'lodash';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

const convertFieldListToDataSchema = (fieldList) => {
  const map = {
    [DATA_TYPE_NUMBER]: (fieldItem) => ({
      type: 'number',
      nullable: !fieldItem.required,
    }),
    [DATA_TYPE_INTEGER]: (fieldItem) => ({
      type: 'integer',
      nullable: !fieldItem.required,
    }),
    [DATA_TYPE_STRING]: (fieldItem) => ({
      type: 'string',
      nullable: !fieldItem.required,
      ...fieldItem.required ? {
        minLength: 1,
      } : {},
    }),
    [DATA_TYPE_BOOLEAN]: (fieldItem) => ({
      type: 'boolean',
      nullable: !fieldItem.required,
    }),
    [DATA_TYPE_JSON]: () => ({
      type: ['array', 'object', 'null', 'string', 'number', 'boolean'],
    }),
    [DATA_TYPE_ARRAY]: (fieldItem) => ({
      type: 'array',
      ...fieldItem.required ? {
        minItems: 1,
      } : {},
    }),
    [DATA_TYPE_OBJECT]: (fieldItem) => ({
      type: 'object',
      nullable: !fieldItem.required,
    }),
  };
  const schema = fieldList.reduce((acc, fieldItem) => {
    const projection = map[fieldItem.type];
    if (!projection) {
      return acc;
    }
    if (!_.isEmpty(fieldItem.list)) {
      if (fieldItem.type === 'object') {
        return {
          ...acc,
          [fieldItem.name]: convertFieldListToDataSchema(fieldItem.list),
        };
      }
      if (fieldItem.type === 'array') {
        return {
          ...acc,
          [fieldItem.name]: {
            type: 'array',
            items: convertFieldListToDataSchema(fieldItem.list),
            ...fieldItem.required ? {
              minItems: 1,
            } : {},
          },
        };
      }
    }
    return {
      ...acc,
      [fieldItem.name]: projection(fieldItem),
    };
  }, {});
  return {
    type: 'object',
    properties: schema,
    required: fieldList
      .filter((d) => map[d.type] && d.required)
      .map((d) => d.name),
  };
};

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
    required: {
      type: 'boolean',
      nullable: true,
    },
    schema: {
      type: 'string',
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

const getValidateList = (arr, path = []) => {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item.schema && item.schema.trim() !== '') {
      try {
        const schema = JSON.parse(item.schema);
        const ajv = new Ajv({
          strict: false,
        });
        result.push({
          path,
          validate: ajv.compile(schema),
        });
      } catch (error) {
        console.warn(`\`${item.name}\` parse schema fail ${error.message}`);
      }
    }
    if (!_.isEmpty(item.list)) {
      result.push(...getValidateList(item.list, [...path, item.name]));
    }
  }
  return result;
};

const generateValidate = (list) => {
  const fieldList = [];
  for (let i = 0; i < list.length; i++) {
    const fieldItem = list[i];
    if (!validateField(fieldItem)) {
      throw new Error(`field invalid ${JSON.stringify(validateField.errors)}`);
    }
    if (!fieldItem.schema || fieldItem.schema.trim() === '') {
      fieldList.push({
        type: fieldItem.type,
        name: fieldItem.name,
        required: !!fieldItem.required,
        list: fieldItem.list,
      });
    }
  }
  const validate = (new Ajv({
    strict: false,
  }))
    .compile(convertFieldListToDataSchema(fieldList));
  return validate;
};

const checkDataValid = (list) => {
  if (_.isEmpty(list)) {
    return () => {};
  }
  const validate = generateValidate(list);
  const validateList = getValidateList(list, []);
  return (data) => {
    if (!validate(data)) {
      return JSON.stringify(validate.errors);
    }
    for (let i = 0; i < validateList.length; i++) {
      const validateItem = validateList[i];
      const dataValue = _.isEmpty(validateItem.path)
        ? data
        : validateItem.path.reduce((acc, dataKey) => {
          if (acc == null || !Object.hasOwnProperty.call(acc, dataKey)) {
            return null;
          }
          return acc[dataKey];
        }, data);
      if (!validateItem.validate(dataValue)) {
        return JSON.stringify(validateItem.validate.errors);
      }
    }
  };
};

export default checkDataValid;
