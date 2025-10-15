import { join } from 'node:path';
import normalizePath from 'normalize-path';

// tempy creates subdirectories with hexadecimal names that are 32 characters long
const TEMP_DIR_REGEXP = /([^\s"]*[\\/][0-9a-f-]{36})([^\s"]*)/g;
// the excluded quotes are due to other snapshot serializers mutating the raw input

const serializeTempdir = {
  test(val) {
    return typeof val === 'string' && TEMP_DIR_REGEXP.test(val);
  },
  serialize(val, config, indentation, depth) {
    const str = val.replace(TEMP_DIR_REGEXP, serializeProjectRoot);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};

function serializeProjectRoot(match, cwd, subPath) {
  return normalizePath(join('__TEST_ROOTDIR__', subPath));
}

export default serializeTempdir;
