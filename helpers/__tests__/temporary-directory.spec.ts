import { rmSync } from 'node:fs';
import { basename } from 'node:path';

import { expect, it } from 'vitest';

import { temporaryDirectory } from '../index.js';
import serializeTempdir from '../serializers/serialize-tempdir.js';

it.each([
  { prefix: undefined, expected: 'lerna-test-' },
  { prefix: 'lerna-custom-', expected: 'lerna-custom-' },
])('creates temporary directories with the $expected prefix', ({ prefix, expected }) => {
  const directory = temporaryDirectory(prefix);
  try {
    expect(basename(directory)).toMatch(new RegExp(`^${expected}[0-9a-f-]{36}$`));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it.each(['', 'lerna-test-'])('normalizes %j UUID fixture directories in snapshots', (prefix) => {
  const input = `/tmp/${prefix}12345678-1234-1234-1234-123456789abc/packages/package.json`;
  expect(serializeTempdir.test(input)).toBe(true);
  expect(serializeTempdir.serialize(input, {}, '', 0)).toBe('__TEST_ROOTDIR__/packages/package.json');
});
