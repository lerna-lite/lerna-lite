/** Pluralize a string */
export function pluralize(str, strLn, customPluralStr = '') {
  const pluralStr = customPluralStr || `${str}s`;
  return strLn > 1 ? pluralStr : str;
}

/** Returns an array of strings minus any excluded values */
export function excludeValuesFromArray(inputValues: string[], excludeValues: string[]) {
  const checker = (value) => !excludeValues.some((element) => value === element);
  return inputValues.filter(checker);
}