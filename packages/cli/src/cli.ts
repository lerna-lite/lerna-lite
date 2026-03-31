#!/usr/bin/env node

import { log } from '@lerna-lite/npmlog';

import { importLocal } from './import-local-shim.js';
import { lerna } from './lerna-entry.js';

export async function main() {
  if (importLocal(import.meta.url)) {
    log.info('cli', 'using local version of lerna');
  } else {
    await lerna(process.argv.slice(2));
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  void main();
}
