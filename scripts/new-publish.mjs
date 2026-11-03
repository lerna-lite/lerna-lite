import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = join(root, '.release-recovery');
const plan = join(directory, `${randomUUID()}.json`);
await mkdir(directory, { recursive: true });
const args = process.argv.slice(2);
const bump = args[0] && !args[0].startsWith('-') ? args.shift() : 'from-package';

console.log(`Release recovery plan: ${plan}`);
const child = spawn(
  process.execPath,
  [join(root, 'packages/cli/dist/cli.js'), 'publish', bump, '--release-plan', plan, ...args],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  }
);
child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on('close', (code, signal) => {
  if (signal) {
    console.error(`Publish terminated by ${signal}.`);
  }
  process.exitCode = code ?? 1;
  console.log(`If a plan was created, retain ${plan} and ${plan}.artifacts for recovery.`);
});
