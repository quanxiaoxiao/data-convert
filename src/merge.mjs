import _ from 'lodash';

const merge = (obj1, obj2) => {
  if (!_.isPlainObject(obj1) && !_.isPlainObject(obj2)) {
    return {};
  }
  if (!_.isPlainObject(obj1)) {
    return obj2;
  }
  if (!_.isPlainObject(obj2)) {
    return obj1;
  }
  const keys = Object.keys(obj2);
  return keys.reduce((acc, dataKey) => {
    const originValue = obj1[dataKey];
    const currentValue = obj2[dataKey];
    if (_.isPlainObject(currentValue) && _.isPlainObject(originValue)) {
      return {
        ...acc,
        [dataKey]: merge(originValue, currentValue),
      };
    }
    if (typeof currentValue === 'undefined') {
      return acc;
    }
    return {
      ...acc,
      [dataKey]: currentValue,
    };
  }, obj1);
};

export default merge;
