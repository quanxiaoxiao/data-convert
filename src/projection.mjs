import _ from 'lodash';
import checkoutData from './lib/checkoutData.mjs';
import generateLogics from './lib/generateLogics.mjs';

const keywords = [
  '$map',
  '$get',
  '$filter',
  '$join',
  '$reduce',
  '$group',
  '$find',
];

const handler = {
  $map: (express) => {
    if (!_.isPlainObject(express)) {
      console.warn(`$map express \`${JSON.stringify(express)}\` invalid`);
      return (arr) => (Array.isArray(arr) ? arr.map(() => ({})) : []);
    }
    const dataKeys = Object
      .keys(express);
    return (arr) => {
      if (!Array.isArray(arr)) {
        return [];
      }
      return arr.map((d) => dataKeys.reduce((acc, dataKey) => ({
        ...acc,
        ...checkoutData(dataKey, _.get(d, dataKey, null), express[dataKey], d),
      }), {}));
    };
  },
  $get: (express) => (d) => _.get(d, express, null),
  $filter: (express) => {
    if (!_.isPlainObject(express) && !Array.isArray(express)) {
      console.warn(`$filter express \`${JSON.stringify(express)}\` invalid`);
      return (arr) => (Array.isArray(arr) ? arr : []);
    }
    const logicList = [];
    if (Array.isArray(express)) {
      for (let i = 0; i < express.length; i++) {
        const and = generateLogics(express[i]);
        if (and) {
          logicList.push(and);
        }
      }
    } else {
      const and = generateLogics(express);
      if (and) {
        logicList.push(and);
      }
    }
    if (_.isEmpty(logicList)) {
      return (arr) => (Array.isArray(arr) ? arr : []);
    }
    return (arr) => {
      if (!Array.isArray(arr)) {
        return [];
      }
      return arr.filter((d) => logicList.some((and) => and.every((expressItem) => expressItem.match(d[expressItem.dataKey]))));
    };
  },
};

export default (express) => {
  if (!Array.isArray(express)) {
    console.warn(`express invalid \`${JSON.stringify(express)}\``);
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
    if (_.isEmpty(commandList)) {
      return data;
    }
    return commandList.reduce((acc, cur) => cur.fn(acc), data);
  };
};
