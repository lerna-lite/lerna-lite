import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gitAdd } from '@lerna-test/helpers';
import { initFixtureFactory } from '@lerna-test/helpers';
import { outputFile, remove } from 'fs-extra/esm';
import c from 'tinyrainbow';
import { describe, expect, it, vi } from 'vitest';

// helpers
import { Project } from '../../project/project.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// file under test
import { collectUncommitted, collectUncommittedSync } from '../collect-uncommitted.js';

// primary assertion setup
const GREEN_A = c.green('A');
const GREEN_M = c.green('M');
const GREEN_D = c.green('D');
const RED_D = c.red('D');
const RED_M = c.red('M');
const RED_QQ = c.red('??');

const colorizedAry = [
  `${GREEN_D}  package.json`,
  `${GREEN_A}${RED_D} packages/package-1/file-1.ts`,
  ` ${RED_D} packages/package-1/package.json`,
  `${GREEN_A}${RED_M} packages/package-2/file-2.ts`,
  ` ${RED_M} packages/package-2/package.json`,
  `${GREEN_M}${RED_M} packages/package-3/package.json`,
  `${GREEN_M}  packages/package-4/package.json`,
  // no UU assertion, only for merge conflicts
  `${RED_QQ} poopy.txt`,
];

// D  package.json
// AD packages/package-1/file-1.ts
//  D packages/package-1/package.json
// AM packages/package-2/file-2.ts
//  M packages/package-2/package.json
// MM packages/package-3/package.json
// M  packages/package-4/package.json
// ?? poopy.txt

const setupChanges = async (cwd) => {
  const [pkg1, pkg2, pkg3, pkg4] = await Project.getPackages(cwd);

  // 'AD': (added to index, deleted in working tree)
  const file1 = join(pkg1.location, 'file-1.ts');
  await outputFile(file1, 'yay');
  await gitAdd(cwd, file1);
  await remove(file1);

  // ' D': (deleted in working tree)
  await remove(pkg1.manifestLocation);

  // ' M': (modified in working tree)
  pkg2.set('modified', true);
  await pkg2.serialize();

  // 'AM': (added to index, modified in working tree)
  const file2 = join(pkg2.location, 'file-2.ts');
  await outputFile(file2, 'woo');
  await gitAdd(cwd, file2);
  await outputFile(file2, 'hoo');

  // 'MM': (updated in index, modified in working tree)
  pkg3.set('updated', true);
  await pkg3.serialize();
  await gitAdd(cwd, pkg3.manifestLocation);
  pkg3.set('modified', true);
  await pkg3.serialize();

  // 'M ': (updated in index)
  pkg4.set('updated', true);
  await pkg4.serialize();
  await gitAdd(cwd, pkg4.manifestLocation);

  // 'D ': (deleted in index)
  const rootManifest = join(cwd, 'package.json');
  await remove(rootManifest);
  await gitAdd(cwd, rootManifest);

  // '??': (untracked)
  const poopy = join(cwd, 'poopy.txt');
  await outputFile(poopy, 'pants');
};

describe('collectUncommitted()', () => {
  it('resolves empty array on clean repo', async () => {
    const cwd = await initFixture('normal');
    const result = await collectUncommitted({ cwd });

    expect(result).toEqual([]);
  });

  it('resolves an array of uncommitted changes', async () => {
    const cwd = await initFixture('normal');

    await setupChanges(cwd);

    const result = await collectUncommitted({ cwd });

    expect(result).toEqual(colorizedAry);
  });

  it('accepts options.log', async () => {
    // re-uses previous cwd
    const log = { silly: vi.fn() };

    const result = await collectUncommitted({ log } as any);

    expect(log.silly).toHaveBeenCalled();
    expect(result).toEqual(colorizedAry);
  });
});

describe('collectUncommittedSync()', () => {
  it('resolves empty array on clean repo', async () => {
    const cwd = await initFixture('normal');
    const result = collectUncommittedSync({ cwd });

    expect(result).toEqual([]);
  });

  it('returns an array of uncommitted changes', async () => {
    const cwd = await initFixture('normal');

    await setupChanges(cwd);

    const result = collectUncommittedSync({ cwd });

    expect(result).toEqual(colorizedAry);
  });

  it('accepts options.log', async () => {
    // re-uses previous cwd
    const log = { silly: vi.fn() };

    const result = collectUncommittedSync({ log } as any);

    expect(log.silly).toHaveBeenCalled();
    expect(result).toEqual(colorizedAry);
  });
});
