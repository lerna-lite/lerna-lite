import { realpathSync } from 'node:fs';
import path from 'path';

export function builtinNpmrc() {
  let resolvedPath = '';

  try {
    // e.g., /usr/local/lib/node_modules/npm/npmrc
    resolvedPath = path.resolve(realpathSync(path.join(path.dirname(process.execPath), 'npm')), '../../npmrc');
  } catch (err) {
    // ignore
  }

  return resolvedPath;
}
