import test from 'ava'; // eslint-disable-line
import getFieldListByPathname from '../src/getFieldListByPathname.mjs';

test('getFieldListByPathname', (t) => {
  t.deepEqual(
    getFieldListByPathname(
      'name',
      [{ name: 'name' }, { name: 'age' }],
    ),
    [{ name: 'name' }],
  );
  t.deepEqual(
    getFieldListByPathname(
      'name',
      [{ name: 'age' }],
    ),
    [],
  );
  t.deepEqual(
    getFieldListByPathname(
      'obj.name',
      [{ name: 'name' }],
    ),
    [],
  );
  t.deepEqual(
    getFieldListByPathname(
      'obj.name',
      [{ name: 'obj', list: [{ name: 'name' }] }],
    ),
    [{ name: 'obj', list: [{ name: 'name' }] }, { name: 'name' }],
  );
  t.deepEqual(
    getFieldListByPathname(
      'obj.name',
      [{ name: 'obj', list: [{ name: 'test' }] }],
    ),
    [],
  );
  t.deepEqual(
    getFieldListByPathname(
      'list.2.name',
      [{ name: 'list', type: 'array', list: [{ name: 'name' }] }],
    ),
    [{ name: 'list', type: 'array', list: [{ name: 'name' }] }, { name: 'name' }],
  );
  t.deepEqual(
    getFieldListByPathname(
      'list.name',
      [{ name: 'list', type: 'array', list: [{ name: 'name' }] }],
    ),
    [{ name: 'list', type: 'array', list: [{ name: 'name' }] }, { name: 'name' }],
  );
  t.deepEqual(
    getFieldListByPathname(
      'list.1.age',
      [{ name: 'list', type: 'array', list: [{ name: 'name' }] }],
    ),
    [],
  );
});
