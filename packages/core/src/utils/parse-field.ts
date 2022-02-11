import path from 'path';
import { envReplace } from './env-replace';
import { types } from './types';

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L362-L407
export function parseField(input: any, key: string): any {
  if (typeof input !== 'string') {
    return input;
  }

  const typeList = [].concat(types[key]);
  // @ts-ignore
  const isPath = typeList.indexOf(path) !== -1;
  // @ts-ignore
  const isBool = typeList.indexOf(Boolean) !== -1;
  // @ts-ignore
  const isString = typeList.indexOf(String) !== -1;
  // @ts-ignore
  const isNumber = typeList.indexOf(Number) !== -1;

  let field: string | number = `${input}`.trim();

  if (/^'.*'$/.test(field)) {
    try {
      field = JSON.parse(field);
    } catch (err: any) {
      throw new Error(`Failed parsing JSON config key ${key}: ${field}`);
    }
  }

  if (isBool && !isString && field === '') {
    return true;
  }

  switch (field) {
    case 'true': {
      return true;
    }

    case 'false': {
      return false;
    }

    case 'null': {
      return null;
    }

    case 'undefined': {
      return undefined;
    }

    // no default
  }

  field = envReplace(field);

  if (isPath) {
    const regex = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//;

    if (typeof field === 'string' && regex.test(field) && process.env.HOME) {
      field = path.resolve(process.env.HOME, field.substring(2));
    }

    field = path.resolve(field as string);
  }

  // eslint-disable-next-line no-restricted-globals
  if (isNumber && !isNaN(field as any)) {
    field = Number(field);
  }

  return field;
}
