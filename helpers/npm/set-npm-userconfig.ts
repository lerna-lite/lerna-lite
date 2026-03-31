import { resolve as pathResolve } from 'node:path';

// Overwrite npm userconfig to avoid test pollution
// https://docs.npmjs.com/misc/config#npmrc-files
process.env.npm_config_userconfig = pathResolve(import.meta.dirname, 'test-user.ini');

// use consistent locale for all tests
process.env.LC_ALL = 'en_US.UTF-8';
