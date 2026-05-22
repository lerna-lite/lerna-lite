import { stripVTControlCharacters } from 'node:util';

import stringWidth from 'fast-string-width';

export function stripAnsi(s: string) {
  return stripVTControlCharacters(s);
}

export { stringWidth };

export default { stripAnsi, stringWidth };
