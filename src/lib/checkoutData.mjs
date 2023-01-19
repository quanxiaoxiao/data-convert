import _ from 'lodash';

const checkoutData = (dataKey, dataValue, ref, data) => {
  if (ref == null) {
    return {};
  }
  if (ref === 1) {
    return {
      [dataKey]: dataValue,
    };
  }
  if (typeof ref === 'string') {
    if (ref[0] === '$') {
      return {
        [dataKey]: _.get(data, ref.slice(1), null),
      };
    }
    return {
      [dataKey]: ref,
    };
  }
  if (_.isPlainObject(ref)) {
    if (_.isEmpty(ref)) {
      return {};
    }
    return {
      [dataKey]: Object.keys(ref).reduce((acc, subDataKey) => ({
        ...acc,
        ...checkoutData(subDataKey, _.get(dataValue, subDataKey, null), ref[subDataKey], data),
      }), {}),
    };
  }
  return {};
};

export default checkoutData;
