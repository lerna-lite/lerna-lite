import { readdirSync } from 'node:fs';
import { basename, dirname as pathDirname, resolve as pathResolve } from 'node:path';

// https://github.com/npm/npm/blob/876f0c8/lib/config/find-prefix.js
export function findPrefix(start: string) {
  let dir = pathResolve(start);
  let walkedUp = false;

  while (basename(dir) === 'node_modules') {
    dir = pathDirname(dir);
    walkedUp = true;
  }

  if (walkedUp) {
    return dir;
  }

  return find(dir, dir);
}

export function find(name: string, original: string) {
  if (name === '/' || (process.platform === 'win32' && /^[a-zA-Z]:(\\|\/)?$/.test(name))) {
    return original;
  }

  try {
    const files = readdirSync(name);

    if (files.indexOf('node_modules') !== -1 || files.indexOf('package.json') !== -1) {
      return name;
    }

    const dirname = pathDirname(name);

    if (dirname === name) {
      return original;
    }

    return find(dirname, original);
  } catch (err: any) {
    if (name === original) {
      if (err.code === 'ENOENT') {
        return original;
      }

      throw err;
    }

    return original;
  }
}