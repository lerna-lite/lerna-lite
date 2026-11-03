import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, expect, it } from 'vitest';

const exec = promisify(execFile);
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

it('forwards publish arguments and creates a unique recovery location for each run', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lerna-new-publish-'));
  roots.push(root);
  await mkdir(join(root, 'scripts'));
  await mkdir(join(root, 'packages/cli/dist'), { recursive: true });
  await copyFile(resolve('scripts/new-publish.mjs'), join(root, 'scripts/new-publish.mjs'));
  await writeFile(
    join(root, 'packages/cli/dist/cli.js'),
    'require("node:fs").writeFileSync(process.env.TEST_ARGS_PATH, JSON.stringify(process.argv.slice(2)));'
  );
  const argsPath = join(root, 'args.json');
  const env = { ...process.env, TEST_ARGS_PATH: argsPath };
  const run = () => exec(process.execPath, [join(root, 'scripts/new-publish.mjs'), '--dry-run', '--yes'], { cwd: root, env });

  const first = await run();
  const args = JSON.parse(await readFile(argsPath, 'utf8')) as string[];
  expect(args.slice(0, 3)).toEqual(['publish', 'from-package', '--release-plan']);
  expect(args.slice(4)).toEqual(['--dry-run', '--yes']);
  expect(args[3]).toMatch(/[\\/]\.release-recovery[\\/].+\.json$/);
  expect(first.stdout).toContain(args[3]);

  await run();
  const second = JSON.parse(await readFile(argsPath, 'utf8')) as string[];
  expect(second[3]).not.toBe(args[3]);

  await exec(process.execPath, [join(root, 'scripts/new-publish.mjs'), '2.0.0', '--dry-run'], { cwd: root, env });
  const major = JSON.parse(await readFile(argsPath, 'utf8')) as string[];
  expect(major.slice(0, 3)).toEqual(['publish', '2.0.0', '--release-plan']);
  expect(major[4]).toBe('--dry-run');
});

it('propagates a publish failure', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lerna-new-publish-'));
  roots.push(root);
  await mkdir(join(root, 'scripts'));
  await mkdir(join(root, 'packages/cli/dist'), { recursive: true });
  await copyFile(resolve('scripts/new-publish.mjs'), join(root, 'scripts/new-publish.mjs'));
  await writeFile(join(root, 'packages/cli/dist/cli.js'), 'process.exitCode = 7;');
  await expect(exec(process.execPath, [join(root, 'scripts/new-publish.mjs'), '--dry-run'], { cwd: root })).rejects.toMatchObject({ code: 7 });
});
