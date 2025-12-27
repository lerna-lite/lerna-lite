import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Overwrite npm userconfig to avoid test pollution
// https://docs.npmjs.com/misc/config#npmrc-files
process.env.npm_config_userconfig = pathResolve(__dirname, 'test-user.ini');

// use consistent locale for all tests
process.env.LC_ALL = 'en_US.UTF-8';