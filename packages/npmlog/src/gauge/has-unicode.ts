/**
 * Detect Unicode support in the terminal.
 * Inlined from deprecated package https://github.com/iarna/has-unicode
 */

import os from 'os';

export function hasUnicode(): boolean {
  if (os.type() === 'Windows_NT') return false;
  const ctype = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG;
  return /UTF-?8$/i.test(ctype || '');
}
