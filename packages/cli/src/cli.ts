#!/usr/bin/env node
import 'dotenv/config';
import { createRequire } from 'node:module';

import { log } from '@lerna-lite/npmlog';

const require = createRequire(import.meta.url);
const importLocal = require('import-local');

import { lerna } from './lerna-entry.js';

if (importLocal(import.meta.url)) {
  log.info('cli', 'using local version of lerna');
} else {
  await lerna(process.argv.slice(2));
}
