import _ from 'lodash';

const keywords = [
  '$map',
  '$reduce',
  '$filter',
  '$group',
];

const handler = {
  $map: (obj) => {
    if (!_.isPlainObject(obj)) {
      return (data) => data;
    }
    const keys = Object
      .keys(obj);
    return (arr) => {
      if (!Array.isArray(arr)) {
        return [];
      }
      const fn = (d) => keys.reduce((acc, dataKey) => {
        const dataValue = obj[dataKey];
        if (dataValue == null) {
          return acc;
        }
        if (dataValue === 1) {
          return {
            ...acc,
            [dataKey]: _.get(d, dataKey, null),
          };
        }
        const dataValueType = typeof dataValue;
        if (dataValueType === 'string') {
          if (dataValue[0] === '$') {
            return {
              ...acc,
              [dataKey]: _.get(d, dataValue.slice(1)),
            };
          }
          return {
            ...acc,
            [dataKey]: dataValue,
          };
        }
        if (_.isPlainObject(dataValueType)) {
          return acc;
        }
        return acc;
      }, {});
      return arr.map(fn);
    };
  },
};

export default (express) => {
  if (!Array.isArray(express)) {
    console.error(`express invalid \`${JSON.stringify(express)}\``);
    return () => null;
  }
  const commandList = [];
  for (let i = 0; i < express.length; i++) {
    const expressItem = express[i];
    const keys = Object.keys(expressItem);
    if (keys.length === 1 && keywords.includes(keys[0])) {
      const obj = expressItem[keys[0]];
      commandList.push({
        commandName: keys[0],
        fn: handler[keys[0]](obj),
      });
    }
  }
  return (data) => {
    if (!Array.isArray(data)) {
      console.error(`data invalid \`${JSON.stringify(data)}\``);
      return null;
    }
    if (_.isEmpty(commandList)) {
      return data;
    }
    return commandList.reduce((acc, cur) => cur.fn(acc), data);
  };
};
