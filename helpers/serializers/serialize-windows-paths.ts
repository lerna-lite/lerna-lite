import { join } from 'node:path';
import normalizePath from 'normalize-path';

const WHACK_WACK = /(\\)([\S]*)/g;

const serializeWindowsPaths = {
  test(val) {
    return typeof val === 'string' && WHACK_WACK.test(val);
  },
  serialize(val, config, indentation, depth) {
    const str = val.replace(WHACK_WACK, serializeWindowsPath);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};

function serializeWindowsPath(match, wack, wackPath) {
  return normalizePath(join(wack, wackPath));
}

export default serializeWindowsPaths;
