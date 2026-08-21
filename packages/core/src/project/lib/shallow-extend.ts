/**
 * @param {{ [key: string]: unknown }} json
 * @param {{ [key: string]: unknown }} defaults
 */
export function shallowExtend(json: { [key: string]: any }, defaults: { [key: string]: any } = {}) {
  return Object.keys(json).reduce((obj, key) => {
    const val = json[key];

    if (Array.isArray(val)) {
      // always clobber arrays, merging isn't worth unexpected complexity
      defineOwnProperty(obj, key, val.slice());
    } else if (val && typeof val === 'object') {
      // Never recurse into an inherited property. Special keys such as
      // "__proto__", "constructor", and "toString" otherwise resolve to
      // built-in objects and allow configuration data to mutate them.
      const currentValue = Object.hasOwn(obj, key) ? obj[key] : {};
      defineOwnProperty(obj, key, shallowExtend(val, currentValue));
    } else {
      defineOwnProperty(obj, key, val);
    }

    return obj;
  }, defaults);
}

function defineOwnProperty(target: { [key: string]: any }, key: string, value: any) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}
