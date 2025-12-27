#!/usr/bin/env node
import 'dotenv/config';
import { log } from '@lerna-lite/npmlog';
import importLocal from 'import-local';

import { lerna } from './lerna-entry.js';

if (importLocal(import.meta.url)) {
  log.info('cli', 'using local version of lerna');
} else {
  await lerna(process.argv.slice(2));
}