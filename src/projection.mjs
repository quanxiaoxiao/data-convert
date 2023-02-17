import _ from 'lodash';
import Ajv from 'ajv';
import compare from '@quanxiaoxiao/compare';
import select from './select.mjs';

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
  $limit: {
    schema: {
      type: 'integer',
    },
    fn: (limit) => (arr) => {
      if (!Array.isArray(arr)) {
        return [];
      }
      return arr.slice(0, limit);
    },
  },
  /*
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
    fn: () => {
    },
  },
  */
  $map: {
    schema: {
      type: ['object', 'string'],
    },
    fn: (express) => {
      if (typeof express === 'string') {
        return (arr) => {
          const padValue = (d) => express.replace(/{{([^}]+)}}/g, (a, b) => {
            const v = d[b];
            if (v == null) {
              return '';
            }
            return `${v}`;
          });
          if (arr == null) {
            return null;
          }
          if (_.isPlainObject(arr)) {
            return padValue(arr);
          }
          if (!Array.isArray(arr)) {
            return [];
          }
          return arr.map((d) => padValue(d));
        };
      }
      const handleAtObject = select({
        type: 'object',
        properties: express,
      });
      const handleAtArray = select({
        type: 'array',
        properties: express,
      });
      return (v) => {
        if (v == null) {
          return null;
        }
        if (Array.isArray(v)) {
          return handleAtArray(v);
        }
        return handleAtObject(v);
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
      const match = compare(express);
      return (arr) => {
        if (!Array.isArray(arr)) {
          return [];
        }
        return arr.filter((d) => match(d));
      };
    },
  },
  $find: {
    schema: {
      type: ['array', 'object'],
    },
    fn: (express) => {
      const match = compare(express);
      return (arr) => {
        if (!Array.isArray(arr)) {
          return null;
        }
        return arr.find((d) => match(d));
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
          const ajv = new Ajv({
            strict: false,
          });
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
