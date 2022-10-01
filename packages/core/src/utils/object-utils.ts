/**
 * From a dot (.) notation path, find and delete a property within an object if found given a complex object path
 * @param object - object to search from
 * @param path - complex object path to find descendant property from, must be a string with dot (.) notation
 */
export function deleteComplexObjectProp(object: any, path: string) {
  if (!object || !path) {
    return object;
  }
  const props = path.split('.');
  const lastProp = props.at(-1);

  return props.reduce((obj, prop) => {
    if (lastProp !== undefined && obj?.[prop] !== undefined && prop === lastProp) {
      delete obj[prop];
    } else {
      return obj?.[prop];
    }
  }, object);
}

/**
 * From a dot (.) notation path, find and return a property within an object given a complex object path
 * Note that the object path does should not include the parent itself
 * for example if we want to get `address.zip` from `user` object, we would call `getComplexObjectValue(user, 'address.zip')`
 * @param object - object to search from
 * @param path - complex object path to find descendant property from, must be a string with dot (.) notation
 * @returns outputValue - the object property value found if any
 */
export function getComplexObjectValue<T>(object: any, path: string): T {
  if (!object || !path) {
    return object;
  }
  return path.split('.').reduce((obj, prop) => obj?.[prop], object);
}
