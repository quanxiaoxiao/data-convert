import _ from 'lodash';

const checkoutData = (ref, data) => {
  const valueType = typeof ref;
  if (ref == null
      || valueType === 'number'
      || valueType === 'boolean') {
    return ref;
  }
  if (valueType === 'string') {
    if (ref[0] === '$') {
      if (ref === '$') {
        return data;
      }
      return _.get(data, ref.slice(1), null);
    }
    return ref;
  }
  if (_.isPlainObject(ref)) {
    return Object.keys(ref).reduce((acc, subDataKey) => ({
      ...acc,
      [subDataKey]: checkoutData(ref[subDataKey], data),
    }), {});
  }
  if (Array.isArray(ref)) {
    return ref.map((d) => checkoutData(d, data));
  }
  return null;
};

export default checkoutData;
