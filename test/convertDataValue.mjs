import test from 'ava'; // eslint-disable-line
import convertDataValue from '../src/convertDataValue.mjs';

const DATA_TYPE_NUMBER = 'number';
const DATA_TYPE_STRING = 'string';
const DATA_TYPE_BOOLEAN = 'boolean';
const DATA_TYPE_JSON = 'json';
const DATA_TYPE_ARRAY = 'array';
const DATA_TYPE_OBJECT = 'object';
const DATA_TYPE_INTEGER = 'integer';

test('convertDataValue', (t) => {
  t.is(convertDataValue('1', 999), '1');
  t.is(convertDataValue('true', 999), 'true');
  t.is(convertDataValue('false', 999), 'false');
  t.is(convertDataValue('{}', 999), '{}');
  t.is(convertDataValue('[]', 999), '[]');
  t.is(convertDataValue('"1"', 999), '"1"');
  t.is(convertDataValue(1, 999), 1);
  t.is(convertDataValue(true, 999), true);
  t.is(convertDataValue(false, 999), false);
  t.deepEqual(convertDataValue({}, 999), {});
});

test('convertDataValue string', (t) => {
  t.is(convertDataValue(1, DATA_TYPE_STRING), '1');
  t.is(convertDataValue(null, DATA_TYPE_STRING), null);
  t.is(convertDataValue(true, DATA_TYPE_STRING), 'true');
  t.is(convertDataValue(false, DATA_TYPE_STRING), 'false');
  t.is(convertDataValue(' 1', DATA_TYPE_STRING), ' 1');
  t.is(convertDataValue({ name: 'cqq' }, DATA_TYPE_STRING), '[object Object]');
  t.is(convertDataValue({
    name: 'quan',
    toString: () => 'cqq',
  }, DATA_TYPE_STRING), 'cqq');
});

test('convertDataValue integer', (t) => {
  t.is(convertDataValue('1', DATA_TYPE_INTEGER), 1);
  t.is(convertDataValue('1.1', DATA_TYPE_INTEGER), 1);
  t.is(convertDataValue('-3.1', DATA_TYPE_INTEGER), -3);
  t.is(convertDataValue(3.1, DATA_TYPE_INTEGER), 3);

  t.is(convertDataValue(1, DATA_TYPE_INTEGER), 1);
  t.true(Number.isNaN(convertDataValue(NaN, DATA_TYPE_INTEGER)));
});

test('convertDataValue number', (t) => {
  t.is(convertDataValue('1', DATA_TYPE_NUMBER), 1);
  t.is(convertDataValue('01', DATA_TYPE_NUMBER), null);
  t.is(convertDataValue('', DATA_TYPE_NUMBER), null);
  t.is(convertDataValue('a', DATA_TYPE_NUMBER), null);
  t.is(convertDataValue('1a', DATA_TYPE_NUMBER), null);
  t.is(convertDataValue('0', DATA_TYPE_NUMBER), 0);
  t.is(convertDataValue('-0', DATA_TYPE_NUMBER), null);
  t.is(convertDataValue('-1', DATA_TYPE_NUMBER), -1);
  t.is(convertDataValue('-1.5', DATA_TYPE_NUMBER), -1.5);
  t.is(convertDataValue('-2.5', DATA_TYPE_NUMBER), -2.5);
  t.is(convertDataValue('2.5', DATA_TYPE_NUMBER), 2.5);

  t.is(convertDataValue(1, DATA_TYPE_NUMBER), 1);
  t.true(Number.isNaN(convertDataValue(NaN, DATA_TYPE_NUMBER)));
});

test('convertDataValue boolean', (t) => {
  t.is(convertDataValue('', DATA_TYPE_BOOLEAN), null);
  t.is(convertDataValue('false', DATA_TYPE_BOOLEAN), false);
  t.is(convertDataValue(' false', DATA_TYPE_BOOLEAN), null);
  t.is(convertDataValue('false ', DATA_TYPE_BOOLEAN), null);
  t.is(convertDataValue('true', DATA_TYPE_BOOLEAN), true);
  t.is(convertDataValue(' true', DATA_TYPE_BOOLEAN), null);
  t.is(convertDataValue('true ', DATA_TYPE_BOOLEAN), null);

  t.is(convertDataValue(true, DATA_TYPE_BOOLEAN), true);
  t.is(convertDataValue(false, DATA_TYPE_BOOLEAN), false);
});

test('convertDataValue json', (t) => {
  t.is(convertDataValue('1', DATA_TYPE_JSON), 1);
  t.is(convertDataValue(' 1', DATA_TYPE_JSON), 1);
  t.is(convertDataValue('"1"', DATA_TYPE_JSON), '1');
  t.is(convertDataValue('\'1\'', DATA_TYPE_JSON), null);
  t.is(convertDataValue('null', DATA_TYPE_JSON), null);
  t.is(convertDataValue('aa', DATA_TYPE_JSON), null);
  t.deepEqual(convertDataValue('{}', DATA_TYPE_JSON), {});
  t.deepEqual(convertDataValue('{fail}', DATA_TYPE_JSON), null);
  t.deepEqual(convertDataValue('{"name":"cqq"}', DATA_TYPE_JSON), { name: 'cqq' });
  t.deepEqual(convertDataValue('[]', DATA_TYPE_JSON), []);

  t.deepEqual(convertDataValue([], DATA_TYPE_JSON), []);
  t.deepEqual(convertDataValue({}, DATA_TYPE_JSON), {});
  t.deepEqual(convertDataValue(2, DATA_TYPE_JSON), null);
});

test('convertDataValue array', (t) => {
  t.deepEqual(convertDataValue(null, DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue('[]', DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue([], DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue(1, DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue({}, DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue('1', DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue('{}', DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue(['12345'], DATA_TYPE_ARRAY), ['12345']);
  t.deepEqual(convertDataValue(true, DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue(false, DATA_TYPE_ARRAY), []);
  t.deepEqual(convertDataValue([{ name: 'cqq' }], DATA_TYPE_ARRAY), [{ name: 'cqq' }]);
  t.deepEqual(convertDataValue(JSON.stringify([{ name: 'cqq' }]), DATA_TYPE_ARRAY), [{ name: 'cqq' }]);
});

test('convertDataValue object', (t) => {
  t.is(convertDataValue(null, DATA_TYPE_OBJECT), null);
  t.is(convertDataValue(1, DATA_TYPE_OBJECT), null);
  t.is(convertDataValue('aa', DATA_TYPE_OBJECT), null);
  t.is(convertDataValue('1', DATA_TYPE_OBJECT), null);
  t.deepEqual(convertDataValue('{fail}', DATA_TYPE_OBJECT), null);
  t.is(convertDataValue(JSON.stringify('aa'), DATA_TYPE_OBJECT), null);
  t.is(convertDataValue(true, DATA_TYPE_OBJECT), null);
  t.is(convertDataValue('true', DATA_TYPE_OBJECT), null);
  t.is(convertDataValue('false', DATA_TYPE_OBJECT), null);
  t.is(convertDataValue(false, DATA_TYPE_OBJECT), null);
  t.is(convertDataValue([], DATA_TYPE_OBJECT), null);
  t.is(convertDataValue(JSON.stringify([]), DATA_TYPE_OBJECT), null);
  t.deepEqual(convertDataValue({ name: 'cqq' }, DATA_TYPE_OBJECT), { name: 'cqq' });
  t.deepEqual(convertDataValue(JSON.stringify({ name: 'cqq' }), DATA_TYPE_OBJECT), { name: 'cqq' });
});
