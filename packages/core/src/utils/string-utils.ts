/**
 * Converts a string to camel case (camelCase), for example "hello-world" (or "hellow world") will become "helloWorld"
 * @param {String} str - string to convert
 * @return {String} the string in camel case
 */
export function toCamelCase(str: string): string {
  if (typeof str === 'string') {
    return str.replace(/(?:^\w|[A-Z]|\b\w|[\s+\-_\/])/g, (match: string, offset: number) => {
      // remove white space or hypens or underscores
      if (/[\s+\-_\/]/.test(match)) {
        return '';
      }
      return offset === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }
  return str;
}
