import test from 'ava'; // eslint-disable-line
import convert from '../src/convertData.mjs';

test('convertData', (t) => {
  t.deepEqual(convert({
    name: 'string',
    age: 'integer',
  })({
    name: 'cqq',
    age: '22',
  }), {
    name: 'cqq',
    age: 22,
  });

  t.deepEqual(convert({
    name: {
      type: 'string',
      trim: true,
    },
  })({
    name: '  cqq',
  }), {
    name: 'cqq',
  });
  t.deepEqual(convert({
    name: {
      type: 'string',
      trim: true,
    },
  })({
    name: '   ',
  }), {
    name: '',
  });
  t.deepEqual(convert({
    age: {
      type: 'integer',
    },
  })({
    age: ' 1  ',
  }), {
    age: null,
  });
  t.deepEqual(convert({
    age: {
      type: 'integer',
      trim: true,
    },
  })({
    age: ' 1  ',
  }), {
    age: 1,
  });
});

test('convertData nest', (t) => {
  t.deepEqual(convert({
    name: 'string',
    age: 'integer',
    obj: {
      type: 'object',
      schema: {
        test: 'string',
        num: 'number',
        bool: 'boolean',
      },
    },
  })({
    name: 'cqq',
    age: '22',
    obj: {
      test: '111',
      num: '33.3',
      bool: 'true',
    },
  }), {
    name: 'cqq',
    age: 22,
    obj: {
      test: '111',
      num: 33.3,
      bool: true,
    },
  });
  t.deepEqual(convert({
    name: 'string',
    age: 'integer',
    obj: {
      type: 'object',
      schema: {
        test: 'string',
        num: 'number',
        bool: 'boolean',
      },
    },
  })({
    name: 'cqq',
    age: '22',
    obj: JSON.stringify({
      test: '111',
      num: '33.3',
      bool: 'true',
    }),
  }), {
    name: 'cqq',
    age: 22,
    obj: {
      test: '111',
      num: 33.3,
      bool: true,
    },
  });
  t.deepEqual(convert({
    name: 'string',
    age: 'integer',
    obj: {
      type: 'object',
      schema: {
        test: {
          type: 'string',
          trim: true,
        },
        num: {
          type: 'integer',
          trim: true,
        },
        bool: 'boolean',
      },
    },
  })({
    name: 'cqq',
    age: '22',
    obj: JSON.stringify({
      test: '   111',
      num: '   33   ',
      bool: 'true',
    }),
  }), {
    name: 'cqq',
    age: 22,
    obj: {
      test: '111',
      num: 33,
      bool: true,
    },
  });
});

test('convertData array', (t) => {
  t.deepEqual(convert({
    list: {
      type: 'array',
    },
  })({
    list: [
      {
        name: 'cqq',
        age: '22',
      },
    ],
  }), {
    list: [
      {
        name: 'cqq',
        age: '22',
      },
    ],
  });
  t.deepEqual(convert({
    list: {
      type: 'array',
      schema: {
        name: 'string',
        age: 'integer',
      },
    },
  })({
    list: [
      {
        name: 'cqq',
        age: '22',
      },
    ],
  }), {
    list: [
      {
        name: 'cqq',
        age: 22,
      },
    ],
  });
});
