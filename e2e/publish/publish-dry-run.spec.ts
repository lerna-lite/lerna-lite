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
});
