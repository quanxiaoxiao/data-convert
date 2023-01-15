import convertDataValue from './convertDataValue.mjs';
import checkDataValid from './checkDataValid.mjs';

const convert = (schema) => {
  const keys = Object.keys(schema);
  return (data) => keys.reduce((acc, key) => {
    const dataType = schema[key];
    if (typeof dataType === 'function') {
      return {
        ...acc,
        [key]: dataType(data[key]),
      };
    }
    const v = convertDataValue(data[key], dataType);
    return {
      ...acc,
      [key]: v,
    };
  }, {});
};

export default convert;

export {
  convertDataValue,
  checkDataValid,
};
