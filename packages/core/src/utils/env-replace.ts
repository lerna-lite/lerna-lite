// https://github.com/npm/npm/blob/latest/lib/config/core.js#L409-L423
export function envReplace(str: any): string {
  if (typeof str !== 'string' || !str) {
    return str;
  }

  // Replace any ${ENV} values with the appropriate environment
  const regex = /(\\*)\$\{([^}]+)\}/g;

  return str.replace(regex, (orig: string, esc: string, name?: string) => {
    if (esc.length > 0 && esc.length % 2) {
      return orig;
    }

    if (!name || process.env[name] === undefined) {
      throw new Error(`Failed to replace env in config: ${orig}`);
    }

    return process.env[name] ?? '';
  });
}
