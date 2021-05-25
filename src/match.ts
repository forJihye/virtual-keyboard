let __dev__ = false;

const match = (vargs: any) => {
  const store: any[] = [];
  const _match = (condition: any, val: any): any => {
    if (typeof condition === 'function') return condition(val);
    else if (typeof condition === 'object' && condition !== null) return Object.entries(condition).every(([key, value]) => value === match._ || _match(value, val[key]));
    else return condition === val;
  };
  const run = (...args: any[]) => {
    if (!args.length || args.length === 1) {
      for (let i = 0; i < store.length; i++) {
        const [conditions, cb] = store[i];
        if (conditions.every((condition: any) => _match(condition, vargs))) {
          if (__dev__) console.log('[match]', conditions, cb);
          return cb(vargs);
        }
      }
      if (__dev__) console.log('[match]', 'default', args);
      return typeof args[0] === 'function' ? args[0](vargs) : args[0];
    }
    const cb = [...args].pop();
    const conditions = args.slice(0, -1);
    store.push([conditions, cb]);
    return run;
  }
  return run;
};

match._ = Symbol('__placeholder__');
match.devtools = (bool: boolean) => __dev__ = bool;
export const {_, devtools} = match;
export default match;