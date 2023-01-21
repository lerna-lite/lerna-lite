/** Pluralize a string */
export function pluralize(str, strLn, customPluralStr = '') {
  const pluralStr = customPluralStr || `${str}s`;
  return strLn > 1 ? pluralStr : str;
}
