import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

describe('lerna-list', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-list',
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

  it('should list all packages', async () => {
    await fixture.createPackage({ name: 'package-a' });
    await fixture.createPackage({ name: 'package-b' });
    await fixture.createPackage({ name: 'package-c' });

    const output = await fixture.lerna('list');

    expect(output.combinedOutput).toContain('package-a');
    expect(output.combinedOutput).toContain('package-b');
    expect(output.combinedOutput).toContain('package-c');
  });

  it('should list with --json flag', async () => {
    await fixture.createPackage({ name: 'package-json' });

    const output = await fixture.lerna('list --json');

    // Use stdout only for JSON parsing (stderr contains lerna logs)
    const packages = JSON.parse(output.stdout);
    expect(Array.isArray(packages)).toBe(true);
    expect(packages).toHaveLength(1);
    expect(packages[0].name).toBe('package-json');
  });

  it('should list only public packages', async () => {
    await fixture.createPackage({ name: 'package-public' });
    await fixture.createPackage({ name: 'package-private', private: true });

    const output = await fixture.lerna('list');

    expect(output.combinedOutput).toContain('package-public');
    expect(output.combinedOutput).not.toContain('package-private');
  });

  it('should list all packages including private with --all', async () => {
    await fixture.createPackage({ name: 'package-public2' });
    await fixture.createPackage({ name: 'package-private2', private: true });

    const output = await fixture.lerna('list --all');

    expect(output.combinedOutput).toContain('package-public2');
    expect(output.combinedOutput).toContain('package-private2');
  });

  it('should show package graph with --graph', async () => {
    await fixture.createPackage({ name: 'package-x' });
    await fixture.createPackage({
      name: 'package-y',
      dependencies: { 'package-x': '1.0.0' },
    });

    const output = await fixture.lerna('list --graph');

    expect(output.combinedOutput).toContain('package-x');
    expect(output.combinedOutput).toContain('package-y');
  });
});
