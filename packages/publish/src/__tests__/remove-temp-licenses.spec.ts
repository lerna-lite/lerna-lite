import { pathExists } from 'fs-extra/esm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { Project } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';

import { removeTempLicenses } from '../lib/remove-temp-licenses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

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
