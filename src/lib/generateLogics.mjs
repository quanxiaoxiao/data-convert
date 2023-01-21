import Ajv from 'ajv';
import _ from 'lodash';

const normalTypes = ['number', 'string', 'boolean', 'null'];

// '$nor',

const ops = {
  $ne: {
    schema: {
      type: normalTypes,
    },
    fn: (a) => (v) => v !== a,
  },
  $eq: {
    schema: {
      type: normalTypes,
    },
    fn: (a) => (v) => v === a,
  },
  $gt: {
    schema: {
      type: 'number',
      nullable: false,
    },
    fn: (a) => (v) => v > a,
  },
  $lt: {
    schema: {
      type: 'number',
      nullable: false,
    },
    fn: (a) => (v) => v < a,
  },
  $lte: {
    schema: {
      type: 'number',
      nullable: false,
    },
    fn: (a) => (v) => v === a || v < a,
  },
  $gte: {
    schema: {
      type: 'number',
      nullable: false,
    },
    fn: (a) => (v) => v === a || v > a,
  },
  $in: {
    schema: {
      type: 'array',
      oneOf: [
        {
          items: {
            type: 'number',
          },
        },
        {
          items: {
            type: 'string',
          },
        },
      ],
      minItems: 1,
      uniqueItems: true,
    },
    fn: (a) => (v) => a.includes(v),
  },
  $nin: {
    schema: {
      type: 'array',
      oneOf: [
        {
          items: {
            type: 'number',
          },
        },
        {
          items: {
            type: 'string',
          },
        },
      ],
      minItems: 1,
      uniqueItems: true,
    },
    fn: (a) => (v) => !a.includes(v),
  },
  $regex: {
    schema: {
      type: ['string', 'array'],
      if: {
        type: 'string',
      },
      then: {
        minLength: 1,
      },
      else: {
        items: {
          type: 'string',
        },
        minItems: 1,
      },
    },
    fn: (a) => {
      let regexp;
      if (Array.isArray(a)) {
        const [pattern, flags] = a;
        regexp = new RegExp(pattern, flags ?? '');
      } else {
        regexp = new RegExp(a);
      }
      return (v) => regexp.test(v);
    },
  },
};

const oneOf = Object.keys(ops).map((opName) => ({
  properties: {
    [opName]: ops[opName].schema,
  },
  required: [opName],
  additionalProperties: false,
}));

const schema = {
  type: 'array',
  items: {
    type: 'object',
    oneOf,
  },
  minItems: 1,
};

const generateCompare = (opName, valueMatch, dataKey) => {
  const opItem = ops[opName];
  if (!opItem) {
    throw new Error(`\`${dataKey}\` invalid op \`${opName}\``);
  }
  if (opItem.schema) {
    const ajv = new Ajv();
    const validate = ajv.compile(opItem.schema);
    if (!validate(valueMatch[opName])) {
      throw new Error(`\`${dataKey}\` invalid op, \`${JSON.stringify(validate.errors)}\``);
    }
  }
  return opItem.fn(valueMatch[opName]);
};

const generateOpMatch = (opName, valueMatch, dataKey) => {
  if (opName === '$and' || opName === '$or') {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    if (!validate(valueMatch[opName])) {
      throw new Error(`\`${dataKey}\` invalid op, \`${JSON.stringify(validate.errors)}\``);
    }
    const compareList = [];
    for (let i = 0; i < valueMatch[opName].length; i++) {
      const matchItem = valueMatch[opName][i];
      const compare = generateCompare(Object.keys(matchItem)[0], matchItem, dataKey);
      compareList.push(compare);
    }
    if (_.isEmpty(compareList)) {
      return null;
    }
    if (opName === '$and') {
      return (d) => compareList.every((match) => match(d));
    }
    return (d) => compareList.some((match) => match(d));
  }
  const compare = generateCompare(opName, valueMatch, dataKey);
  return (d) => compare(d);
};

const generateLogics = (obj) => {
  const and = [];
  const dataKeys = Object.keys(obj);
  for (let i = 0; i < dataKeys.length; i++) {
    const dataKey = dataKeys[i];
    const valueMatch = obj[dataKey];
    if (_.isPlainObject(valueMatch)) {
      const opNames = Object.keys(valueMatch);
      if (opNames.length !== 1) {
        throw new Error(`\`${dataKey}\` invalid op, \`${JSON.stringify(valueMatch)}\``);
      }
      const opName = opNames[0];
      if (opName === '$not') {
        if (_.isEmpty(valueMatch.$not)) {
          continue;
        }
        const ajv = new Ajv();
        const validate = ajv.compile({
          type: 'object',
          properties: {
            ...oneOf.reduce((acc, schemaItem) => ({
              ...acc,
              ...schemaItem.properties,
            }), {}),
            $and: schema,
            $or: schema,
          },
          additionalProperties: false,
        });
        if (!validate(valueMatch.$not)) {
          throw new Error(`$not \`${dataKey}\` invalid op, \`${JSON.stringify(validate.errors)}\``);
        }
        const compare = generateOpMatch(Object.keys(valueMatch.$not)[0], valueMatch.$not, dataKey);
        if (compare) {
          and.push({
            dataKey,
            match: (d) => !compare(d),
          });
        }
      } else {
        const opMatch = generateOpMatch(opName, valueMatch, dataKey);
        if (opMatch) {
          and.push({
            dataKey,
            match: opMatch,
          });
        }
      }
    } else {
      and.push({
        dataKey,
        match: (v) => v === valueMatch,
      });
    }
  }
  return and;
};

export default generateLogics;
