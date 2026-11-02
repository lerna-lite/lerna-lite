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
});
