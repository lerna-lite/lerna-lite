import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

describe('lerna publish with tracked changes', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-publish-dirty-tree',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });
    await fixture.createPackage({ name: 'example-package', version: '1.0.0' });
    await fixture.createInitialGitCommit();
    await fixture.exec('git tag v1.0.0');
    await fixture.updateJson('packages/example-package/package.json', (json) => ({ ...json, description: 'uncommitted change' }));
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  it.each(['from-git', 'from-package', '--canary'])('refuses to publish %s before reaching the registry', async (mode) => {
    const result = await fixture.lerna(`publish ${mode} --registry=http://127.0.0.1:1/ -y`, { silenceError: true });

    expect(result.exitCode).not.toBe(0);
    expect(result.combinedOutput).toContain('EUNCOMMIT');
    expect(result.combinedOutput).toContain('packages/example-package/package.json');
  });

  it.each(['', 'from-git', '--canary'])('rejects --allow-dirty with %s before reaching the registry', async (mode) => {
    const result = await fixture.lerna(`publish ${mode} --allow-dirty --dry-run -y`, { silenceError: true });

    expect(result.exitCode).not.toBe(0);
    expect(result.combinedOutput).toContain('EALLOWDIRTY');
    expect(result.combinedOutput).toContain('--allow-dirty is only allowed with "from-package" positional');
  });

  it.each(['CLI', 'configuration'])('accepts --allow-dirty from %s for from-package', async (source) => {
    // Private packages avoid registry requests; real dirty-file validation is covered by unit tests.
    await fixture.updateJson('packages/example-package/package.json', (json) => ({ ...json, private: true }));
    if (source === 'configuration') {
      await fixture.updateJson('lerna.json', (json) => ({ ...json, command: { publish: { allowDirty: true } } }));
    }

    const result = await fixture.lerna(`publish from-package --dry-run -y ${source === 'CLI' ? '--allow-dirty' : ''}`);

    expect(result.exitCode).toBe(0);
    expect(result.combinedOutput).toContain('Skipping working-tree validation; published packages may include uncommitted changes.');
    expect(result.combinedOutput).toContain('No unpublished release found');
  });
});
