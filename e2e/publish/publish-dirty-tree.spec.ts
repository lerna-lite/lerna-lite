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
});
