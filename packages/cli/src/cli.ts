#!/usr/bin/env node

import 'dotenv/config';
import importLocal from 'import-local';
import log from 'npmlog';
import { lerna } from './lerna-entry.js';

if (importLocal(import.meta.url)) {
  log.info('cli', 'using local version of lerna');
} else {
  lerna(process.argv.slice(2));
}
