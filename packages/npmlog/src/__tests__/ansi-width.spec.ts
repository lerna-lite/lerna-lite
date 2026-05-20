import { describe, expect, test } from 'vitest';

import { stripAnsi, stringWidth } from '../ansi-width.js';

describe('ansi-width helpers', () => {
  test('stripAnsi removes VT/ANSI sequences', () => {
    const colored = '\u001b[31mred\u001b[0m';
    expect(stripAnsi(colored)).toBe('red');
  });

  test('stringWidth measures visible width (CJK wide)', () => {
    // '界' should be width 2
    expect(stringWidth('界')).toBeGreaterThanOrEqual(2);
  });
});
