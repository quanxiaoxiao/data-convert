import Ajv from 'ajv';
import _ from 'lodash';

const normalTypes = ['number', 'string', 'boolean', 'null'];

// '$not',
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
    console.warn(`$filter \`${dataKey}\` invalid op \`${opName}\``);
    return null;
  }
  if (opItem.schema) {
    const ajv = new Ajv();
    const validate = ajv.compile(opItem.schema);
    if (!validate(valueMatch[opName])) {
      console.warn(`$filter \`${dataKey}\` invalid op, \`${JSON.stringify(validate.errors)}\``);
      return null;
    }
  }
  return opItem.fn(valueMatch[opName]);
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
        console.warn(`$filter \`${dataKey}\` invalid op, \`${JSON.stringify(valueMatch)}\``);
        continue;
      }
      const opName = opNames[0];
      if (opName === '$and' || opName === '$or') {
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        if (!validate(valueMatch[opName])) {
          console.warn(`$filter \`${dataKey}\` invalid op, \`${JSON.stringify(validate.errors)}\``);
          continue;
        }
        const compareList = [];
        for (let j = 0; j < valueMatch[opName].length; j++) {
          const matchItem = valueMatch[opName][j];
          const compare = generateCompare(Object.keys(matchItem)[0], matchItem, dataKey);
          if (compare) {
            compareList.push(compare);
          }
        }
        if (!_.isEmpty(compareList)) {
          if (opName === '$and') {
            and.push({
              dataKey,
              match: (d) => compareList.every((match) => match(d)),
            });
          } else if (opName === '$or') {
            and.push({
              dataKey,
              match: (d) => compareList.some((match) => match(d)),
            });
          }
        }
      } else {
        const compare = generateCompare(opName, valueMatch, dataKey);
        if (compare) {
          and.push({
            dataKey,
            match: compare,
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
