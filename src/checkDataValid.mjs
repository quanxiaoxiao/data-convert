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
    return {
      ...acc,
      [fieldItem.dataKey]: projection(fieldItem),
    };
  }, {});
  return {
    type: 'object',
    properties: schema,
    required: fieldList
      .filter((d) => map[d.type] && d.required)
      .map((d) => d.dataKey),
  };
};

const checkDataValid = (list, data) => {
  if (_.isEmpty(list)) {
    return;
  }
  const fieldList = [];
  const validateList = [];
  for (let i = 0; i < list.length; i++) {
    const fieldItem = list[i];
    if (!fieldItem.dataType || !fieldItem.dataKey) {
      continue;
    }
    const defaultSchema = {
      type: fieldItem.dataType,
      required: !!fieldItem.required,
      dataKey: fieldItem.dataKey,
    };
    if (!fieldItem.schema) {
      fieldList.push(defaultSchema);
    } else {
      try {
        const schema = JSON.parse(fieldItem.schema);
        if (_.isPlainObject(schema)) {
          const ajv = new Ajv({
            strict: false,
          });
          const validate = ajv.compile(schema);
          validateList.push(validate);
        } else {
          fieldList.push(defaultSchema);
        }
      } catch (error) {
        console.warn(`\`${fieldItem.dataKey}\` ${error.message}`);
        fieldList.push(defaultSchema);
      }
    }
  }
  const schema = convertFieldListToDataSchema(fieldList);
  const validate = (new Ajv({
    strict: false,
  })).compile(schema);
  if (!validate(data)) {
    return JSON.stringify(validate.errors);
  }
  for (let i = 0; i < validateList.length; i++) {
    const validateItem = validateList[i];
    if (!validateItem(data)) {
      return JSON.stringify(validateItem.errors);
    }
  }
};

export default checkDataValid;
