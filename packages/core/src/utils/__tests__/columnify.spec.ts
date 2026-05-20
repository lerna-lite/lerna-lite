import { stripAnsi } from '@lerna-test/helpers';
import { describe, expect, test } from 'vitest';

import { columnify } from '../../index.js';

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

describe('columnify', () => {
  test('formats simple rows with headers', () => {
    const items = [{ name: 'pkg-1' }, { name: 'pkg-2' }];

    const out = columnify(items, { columns: ['name'] });

    expect(out).toMatchInlineSnapshot(`
  name
  pkg-1
  pkg-2
  `);
  });

  test('formats plain object as key + splitter + value', () => {
    const map = { a: 1, b: 2 } as Record<string, number>;

    const out = columnify(map, { columnSplitter: ' ' });

    expect(out).toMatchInlineSnapshot(`
a 1
b 2
`);
  });

  test('accounts for ANSI color codes when measuring width', () => {
    const redFoo = '\u001b[31mfoo\u001b[0m';
    const items = [
      { name: redFoo, version: '1' },
      { name: 'long', version: '10' },
    ];

    const out = columnify(items, {
      columns: ['name', 'version'],
      config: { version: { align: 'right' } },
      showHeaders: false,
    });

    // stripAnsi for snapshot readability; important: alignment (visible chars) should match
    expect(stripAnsi(out)).toMatchInlineSnapshot(`
foo   1
long 10
`);
  });
});
