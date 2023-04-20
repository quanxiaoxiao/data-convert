import _ from 'lodash';

const walk = (pathList, list) => {
  if (_.isEmpty(pathList) || _.isEmpty(list)) {
    return [];
  }
  const [first, ...other] = pathList;
  const current = list.find((d) => d.name === first);
  if (!current) {
    return [];
  }
  if (_.isEmpty(other)) {
    return [current];
  }
  const descendants = walk(
    current.type === 'array' && /^\d+$/.test(other[0]) ? other.slice(1) : other,
    current.list,
  );
  if (_.isEmpty(descendants)) {
    return [];
  }
  return [current].concat(descendants);
};

export default (pathname, list) => walk((pathname || '').split('.'), list);
