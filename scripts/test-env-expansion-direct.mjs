#!/usr/bin/env node
import { resolve } from 'node:path';

import { Conf } from '../packages/core/dist/utils/conf.js';
import { Defaults } from '../packages/core/dist/utils/defaults.js';

// Set environment variable
process.env.VERDACCIO_TOKEN = 'my-test-token-12345';

console.log('Environment variable set:');
console.log('  VERDACCIO_TOKEN:', process.env.VERDACCIO_TOKEN);
console.log('');

// Create config and load .npmrc directly
const conf = new Conf(Object.assign({}, new Defaults().defaults));
conf.add({}, 'cli');
conf.addEnv();

const npmrcPath = resolve(process.cwd(), '.npmrc');
console.log('Loading .npmrc from:', npmrcPath);
conf.addFile(npmrcPath, 'project');

console.log('');
console.log('Project source data:', JSON.stringify(conf.sources.project, null, 2));
console.log('');
console.log('Config values after loading .npmrc:');
console.log('  registry:', conf.get('registry'));
console.log('  //localhost:4873/:_authToken:', conf.get('//localhost:4873/:_authToken'));
console.log('  @myorg:registry:', conf.get('@myorg:registry'));
console.log('  @myorg:always-auth:', conf.get('@myorg:always-auth'));
console.log('');

const authToken = conf.get('//localhost:4873/:_authToken');
if (authToken === '${VERDACCIO_TOKEN}') {
  console.error('❌ ERROR: Environment variable was NOT expanded!');
  console.error('   Token value is still: ${VERDACCIO_TOKEN}');
  process.exit(1);
} else if (authToken === 'my-test-token-12345') {
  console.log('✅ SUCCESS: Environment variable was properly expanded!');
  console.log('   Token value is:', authToken);
  process.exit(0);
} else {
  console.log('⚠️  Token value is:', authToken);
  process.exit(1);
}
