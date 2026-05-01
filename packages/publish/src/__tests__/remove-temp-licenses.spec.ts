import { join } from 'node:path';

import { Project, pathExists } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { describe, expect, it } from 'vitest';

import { removeTempLicenses } from '../lib/remove-temp-licenses.js';

const initFixture = initFixtureFactory(import.meta.dirname);

describe('removeTempLicenses', () => {
  it('removes license file from target packages', async () => {
    const cwd = await initFixture('licenses-names');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // mimic decoration in createTempLicenses()
    pkg.licensePath = join(pkg.location, 'LICENSE');

    await removeTempLicenses([pkg]);

    const tempLicensePresent = await pathExists(pkg.licensePath);
    expect(tempLicensePresent).toBe(false);
  });

  it('skips removal when no target packages exist', async () => {
    const cwd = await initFixture('licenses-names');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // mimic decoration in createTempLicenses()
    pkg.licensePath = join(pkg.location, 'LICENSE');

    await removeTempLicenses([]);

    const licensePresent = await pathExists(pkg.licensePath);
    expect(licensePresent).toBe(true);
  });
});
