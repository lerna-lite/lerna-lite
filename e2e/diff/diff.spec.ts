import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Fixture, normalizeEnvironment } from '../../e2e-utils/src/index.js';

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str.replaceAll(/index .{7}\.\..{7} \d{6}/g, 'index XXXXXXX..XXXXXXX XXXXXX'));
  },
  test(val) {
    return val != null && typeof val === 'string';
  },
});

describe('lerna-diff', () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-diff',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });

    await fixture.createPackage({ name: 'package-a' });
    await fixture.createPackage({ name: 'package-b' });

    await fixture.createInitialGitCommit();
  });

  afterAll(() => fixture.destroy());

  it('should output diff for all packages', async () => {
    await fixture.addDependencyToPackage({
      packagePath: 'packages/package-a',
      dependencyName: 'package-b',
      version: '0.0.0',
    });
    await fixture.addDependencyToPackage({
      packagePath: 'packages/package-b',
      dependencyName: 'package-a',
      version: '0.0.0',
    });

    const output = await fixture.lerna('diff');

    expect(output.combinedOutput).toContain('diff --git a/packages/package-a/package.json');
    expect(output.combinedOutput).toContain('diff --git a/packages/package-b/package.json');
    expect(output.combinedOutput).toContain('"dependencies": {');
    expect(output.combinedOutput).toContain('"package-b": "0.0.0"');
    expect(output.combinedOutput).toContain('"package-a": "0.0.0"');
  });

  it('should output diff for single package', async () => {
    await fixture.addDependencyToPackage({
      packagePath: 'packages/package-a',
      dependencyName: 'package-b',
      version: '0.0.0',
    });
    await fixture.addDependencyToPackage({
      packagePath: 'packages/package-b',
      dependencyName: 'package-a',
      version: '0.0.0',
    });

    const output = await fixture.lerna('diff package-a');

    expect(output.combinedOutput).toContain('diff --git a/packages/package-a/package.json');
    expect(output.combinedOutput).not.toContain('diff --git a/packages/package-b/package.json');
    expect(output.combinedOutput).toContain('"package-b": "0.0.0"');
  });
});
