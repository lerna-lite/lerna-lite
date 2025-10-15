/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import validate from 'aproba';
import stringWidth from 'fast-string-width';
import renderTemplate from './render-template.js';
import { wideTruncate } from './wide-truncate.js';

export default function progressBar(theme: any, width: number, completed: number) {
  validate('ONN', [theme, width, completed]);
  if (completed < 0) {
    completed = 0;
  }
  if (completed > 1) {
    completed = 1;
  }
  if (width <= 0) {
    return '';
  }
  const sofar = Math.round(width * completed);
  const rest = width - sofar;
  const template = [
    { type: 'complete', value: repeat(theme.complete, sofar), length: sofar },
    { type: 'remaining', value: repeat(theme.remaining, rest), length: rest },
  ];
  return renderTemplate(width, template, theme);
}

// lodash's way of repeating
function repeat(string, width) {
  let result = '';
  let n = width;
  do {
    if (n % 2) {
      result += string;
    }
    n = Math.floor(n / 2);
    string += string;
  } while (n && stringWidth(result) < width);

  return wideTruncate(result, width);
}
