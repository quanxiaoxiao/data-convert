import _ from 'lodash';
import Ajv from 'ajv';
import checkoutData from './lib/checkoutData.mjs';
import generateLogics from './lib/generateLogics.mjs';

const keywords = [
  '$map',
  '$get',
  '$filter',
  '$group',
  '$find',
  '$join',
  '$limit',
  // '$reduce',
  // '$count',
  // '$sort',
];

const handler = {
  $reduce: {
    schema: {
      type: 'object',
      properties: {
        initialValue: {
          type: ['array', 'string', 'number'],
        },
        in: {
          type: 'object',
        },
      },
      additionalProperties: false,
      required: ['initialValue', 'in'],
    },
  },
  $map: {
    schema: {
      type: ['object', 'string'],
    },
    fn: (express) => {
      if (typeof express === 'string') {
        return (arr) => {
          if (!Array.isArray(arr)) {
            return [];
          }
          const padValue = (d) => express.replace(/{{([^}]+)}}/g, (a, b) => {
            const v = d[b];
            if (v == null) {
              return '';
            }
            return `${v}`;
          });
          return arr.map((d) => padValue(d));
        };
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
  },
  $get: {
    schema: {
      type: 'string',
      minLength: 1,
      nullable: false,
    },
    fn: (express) => (d) => _.get(d, express, null),
  },
  $filter: {
    schema: {
      type: ['array', 'object'],
    },
    fn: (express) => {
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
  },
  $find: {
    schema: {
      type: ['array', 'object'],
    },
    fn: (express) => {
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
        return (arr) => (Array.isArray(arr) ? arr[0] ?? null : null);
      }
      return (arr) => {
        if (!Array.isArray(arr)) {
          return null;
        }
        return arr.find((d) => logicList.some((and) => and.every((expressItem) => expressItem.match(d[expressItem.dataKey]))));
      };
    },
  },
  $group: {
    schema: {
      type: 'string',
      nullable: false,
    },
    fn: (groupName) => (arr) => {
      if (!Array.isArray(arr)) {
        return {};
      }
      return _.groupBy(arr, groupName);
    },
  },
  $join: {
    schema: {
      type: 'string',
      nullable: false,
    },
    fn: (separator) => (arr) => {
      if (!Array.isArray(arr)) {
        return '';
      }
      return arr.join(separator);
    },
  },
};

export default (express) => {
  if (!Array.isArray(express)) {
    throw new Error(`express invalid \`${JSON.stringify(express)}\``);
  }
  const commandList = [];
  for (let i = 0; i < express.length; i++) {
    const expressItem = express[i];
    const keys = Object.keys(expressItem);
    if (keys.length === 1) {
      const commandName = keys[0];
      if (!keywords.includes(commandName)) {
        throw new Error(`unkown command \`${commandName}\``);
      } else {
        const obj = expressItem[commandName];
        const commandHandler = handler[commandName];
        if (commandHandler.schema) {
          const ajv = new Ajv();
          const validate = ajv.compile(commandHandler.schema);
          if (!validate(obj)) {
            throw new Error(`command \`${commandName}\` invalid \`${JSON.stringify(obj)}\``);
          }
        }
        commandList.push({
          commandName,
          fn: commandHandler.fn(obj),
        });
      }
    } else {
      throw new Error(`express invalid \`${JSON.stringify(expressItem)}\``);
    }
  }
  return (data) => {
    if (_.isEmpty(commandList)) {
      return data;
    }
    return commandList.reduce((acc, cur) => cur.fn(acc), data);
  };
};
