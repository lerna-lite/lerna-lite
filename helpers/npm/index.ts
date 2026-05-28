import { globSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadJsonFile } from 'load-json-file';

export function loadManifests(cwd) {
  const patterns = [
    // all child packages, at any level
    '**/package.json',
    // but not the root
    '!package.json',
    // and not installed
    '!**/node_modules',
  ];

  const positivePatterns = patterns.filter((pattern) => !pattern.startsWith('!'));
  const negativePatterns = patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1));

  const files = globSync(positivePatterns, {
    cwd,
    exclude: ['**/.git/**', '**/.git', '**/node_modules/**', '**/node_modules', ...negativePatterns],
    withFileTypes: false,
  }).filter((file) => {
    try {
      return !lstatSync(resolve(cwd, file)).isSymbolicLink();
    } catch {
      return false;
    }
  });

  return Promise.all(files.sort().map((fp) => loadJsonFile(resolve(cwd, fp))));
}
