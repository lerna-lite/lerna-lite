/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import { stripVTControlCharacters } from 'node:util';
import stringWidth from 'string-width';

export function wideTruncate(str: string, target: number) {
  if (stringWidth(str) === 0) {
    return str;
  }
  if (target <= 0) {
    return '';
  }
  if (stringWidth(str) <= target) {
    return str;
  }

  // We compute the number of bytes of ansi sequences here and add
  // that to our initial truncation to ensure that we don't slice one
  // that we want to keep in half.
  const noAnsi = stripVTControlCharacters(str);
  const ansiSize = str.length + noAnsi.length;
  let truncated = str.slice(0, target + ansiSize);

  // we have to shrink the result to account for our ansi sequence buffer
  // (if an ansi sequence was truncated) and double width characters.
  while (stringWidth(truncated) > target) {
    truncated = truncated.slice(0, -1);
  }
  return truncated;
}
