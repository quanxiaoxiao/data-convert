import _ from 'lodash';
import Ajv from 'ajv';
import ops from './lib/ops.mjs';
import checkoutData from './lib/checkoutData.mjs';

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
    /*
    if (Array.isArray(express)) {
    }
    */
    const and = [];
    const dataKeys = Object.keys(express);
    for (let i = 0; i < dataKeys.length; i++) {
      const dataKey = dataKeys[i];
      const valueMatch = express[dataKey];
      if (_.isPlainObject(valueMatch)) {
        const opNames = Object.keys(valueMatch);
        if (opNames.length !== 1 || !ops[opNames[0]]) {
          console.warn(`$filter \`${dataKey}\` invalid op, \`${JSON.stringify(valueMatch)}\``);
          continue;
        }
        const opName = opNames[0];
        const opItem = ops[opName];
        if (opItem.schema) {
          const ajv = new Ajv();
          const validate = ajv.compile(opItem.schema);
          if (!validate(valueMatch[opName])) {
            console.warn(`$filter \`${dataKey}\` invalid op, \`${JSON.stringify(validate.errors)}\``);
            continue;
          }
        }
        and.push({
          dataKey,
          match: opItem.fn(valueMatch[opName]),
        });
      } else {
        and.push({
          dataKey,
          match: (v) => v === valueMatch,
        });
      }
    }
    return (arr) => {
      if (!Array.isArray(arr)) {
        return [];
      }
      return arr.filter((d) => and.every((expressItem) => expressItem.match(d[expressItem.dataKey])));
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
