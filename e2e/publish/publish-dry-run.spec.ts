import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

describe('lerna-publish dry-run', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-publish-dry-run',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });
    // lerna init already creates lerna.json with packages: ["packages/*"]
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  it('should show what would be published without actually publishing', async () => {
    await fixture.createPackage({ name: 'package-a', version: '1.0.0' });
    await fixture.createPackage({ name: 'package-b', version: '1.0.0' });
    await fixture.createInitialGitCommit();
    await fixture.exec('git tag v1.0.0');

    const output = await fixture.lerna('publish from-git --dry-run -y');

    expect(output.combinedOutput).toContain('lerna');
    expect(output.combinedOutput).toMatch(/package-[ab]/);
  });

  it('should work with --canary flag', async () => {
    await fixture.createPackage({ name: 'package-test', version: '1.0.0' });
    await fixture.createInitialGitCommit();

    const output = await fixture.lerna('publish --canary --dry-run -y');

    expect(output.combinedOutput).toContain('lerna');
  });

  it('builds from package scripts before stripping them from the packed manifest', async () => {
    await fixture.createPackage({ name: 'package-a', version: '1.0.0' });
    await fixture.updateJson('package.json', (json) => ({
      ...json,
      workspaces: ['packages/*'],
      scripts: { ...json.scripts, prepublish: 'npm run build --workspace=package-a' },
    }));
    await fixture.updateJson('packages/package-a/package.json', (json) => ({
      ...json,
      files: ['dist'],
      main: 'src/index.js',
      publishConfig: { main: 'dist/index.js' },
      scripts: { build: 'node ../../build.cjs' },
    }));
    await writeFile(
      fixture.getWorkspacePath('build.cjs'),
      "const fs = require('node:fs'); fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync('dist/index.js', 'built');"
    );
    await fixture.createInitialGitCommit();
    await fixture.exec('git tag v1.0.0');

    const tempDir = fixture.getWorkspacePath('test-temp');
    await mkdir(tempDir);
    const cli = join(process.cwd(), 'packages/cli/dist/cli.js');
    await fixture.exec(`node "${cli}" publish from-git --dry-run --yes --strip-package-keys scripts main`, {
      env: { TMPDIR: tempDir, TMP: tempDir, TEMP: tempDir },
    });

    const tempEntries = await readdir(tempDir);
    const tarballDirs = tempEntries.filter((entry) => entry.startsWith('lerna-'));
    expect(tarballDirs).toHaveLength(1);
    const tarball = join(tempDir, tarballDirs[0], 'package-a-1.0.0.tgz');
    const extractDir = join(tempDir, 'extracted');
    await mkdir(extractDir);
    const require = createRequire(join(process.cwd(), 'packages/publish/package.json'));
    const tar = require('tar') as { extract: (options: { file: string; cwd: string }) => Promise<void> };
    await tar.extract({ file: tarball, cwd: extractDir });

    expect(await readFile(join(extractDir, 'package/dist/index.js'), 'utf8')).toBe('built');
    const packedManifest = JSON.parse(await readFile(join(extractDir, 'package/package.json'), 'utf8'));
    expect(packedManifest.scripts).toBeUndefined();
    expect(packedManifest.main).toBe('dist/index.js');
  });

  it('syncs the generated manifest after prepack and packs it during a dry run', async () => {
    await fixture.createPackage({ name: 'package-a', version: '1.0.0' });
    await fixture.createPackage({ name: 'package-b', version: '1.0.0' });
    await fixture.updateJson('lerna.json', (json) => ({ ...json, npmClient: 'pnpm' }));
    await writeFile(fixture.getWorkspacePath('pnpm-workspace.yaml'), 'packages:\n  - packages/*\ncatalog:\n  example-dep: ^3.2.1\n');
    await fixture.updateJson('packages/package-b/package.json', (json) => ({ ...json, private: true }));
    await fixture.updateJson('packages/package-a/package.json', (json) => ({
      ...json,
      dependencies: { 'package-b': 'workspace:*', 'example-dep': 'catalog:' },
      publishConfig: { directory: 'dist' },
      lerna: { command: { publish: { syncOutputManifest: true } } },
      scripts: { prepack: 'node ../../generate.cjs' },
    }));
    const generated = {
      name: 'package-a',
      version: '0.0.0',
      main: './fesm2022/library.mjs',
      types: './index.d.ts',
      exports: { '.': { types: './index.d.ts', default: './fesm2022/library.mjs' } },
      dependencies: { 'package-b': 'workspace:*', 'example-dep': 'catalog:' },
    };
    await writeFile(
      fixture.getWorkspacePath('generate.cjs'),
      `const fs = require('node:fs'); fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync('dist/package.json', ${JSON.stringify(JSON.stringify(generated))});`
    );
    await fixture.createInitialGitCommit();
    await fixture.exec('git tag v1.0.0');

    const tempDir = fixture.getWorkspacePath('test-temp');
    await mkdir(tempDir);
    const cli = join(process.cwd(), 'packages/cli/dist/cli.js');
    const output = await fixture.exec(`node "${cli}" publish from-git --dry-run --yes`, {
      env: { TMPDIR: tempDir, TMP: tempDir, TEMP: tempDir },
    });
    expect(output.exitCode).toBe(0);
    const tarballDirs = (await readdir(tempDir)).filter((entry) => entry.startsWith('lerna-'));
    expect(tarballDirs).toHaveLength(1);
    const extractDir = join(tempDir, 'extracted');
    await mkdir(extractDir);
    const require = createRequire(join(process.cwd(), 'packages/publish/package.json'));
    const tar = require('tar') as { extract: (options: { file: string; cwd: string }) => Promise<void> };
    await tar.extract({ file: join(tempDir, tarballDirs[0], 'package-a-1.0.0.tgz'), cwd: extractDir });
    const manifest = JSON.parse(await readFile(join(extractDir, 'package/package.json'), 'utf8'));
    expect(manifest).toEqual({ ...generated, version: '1.0.0', dependencies: { 'package-b': '1.0.0', 'example-dep': '^3.2.1' } });
  });

  it('leaves an existing generated manifest untouched when sync is not enabled', async () => {
    await fixture.createPackage({ name: 'package-a', version: '1.0.0' });
    await fixture.updateJson('packages/package-a/package.json', (json) => ({
      ...json,
      publishConfig: { directory: 'dist' },
    }));
    await fixture.createInitialGitCommit();
    await fixture.exec('git tag v1.0.0');
    const outputDir = fixture.getWorkspacePath('packages/package-a/dist');
    await mkdir(outputDir);
    const original = JSON.stringify({ name: 'package-a', version: '0.0.0', main: './generated.mjs' });
    await writeFile(join(outputDir, 'package.json'), original);

    const result = await fixture.lerna('publish from-git --dry-run --yes');
    expect(result.exitCode).toBe(0);
    expect(await readFile(join(outputDir, 'package.json'), 'utf8')).toBe(original);
  });
});
