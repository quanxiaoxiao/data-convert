const ops = {
  $ne: (a) => (v) => v !== a,
  $eq: (a) => (v) => v === a,
  $gt: (a) => (v) => v > a,
  $lt: (a) => (v) => v < a,
  $lte: (a) => (v) => v === a || v < a,
  $gte: (a) => (v) => v === a || v > a,
  $in: (a) => (v) => a.includes(v),
  $nin: (a) => (v) => !a.includes(v),
  $regex: (a) => {
    let regexp;
    if (Array.isArray(a)) {
      const [pattern, flags] = a;
      regexp = new RegExp(pattern, flags ?? '');
    } else {
      regexp = new RegExp(a);
    }
    return (v) => regexp.test(v);
  },
};

export default ops;
