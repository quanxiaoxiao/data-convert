const normalTypes = ['number', 'string', 'boolean', 'null'];

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

export default ops;
