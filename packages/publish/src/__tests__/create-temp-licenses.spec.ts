import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { move, pathExists } from 'fs-extra/esm';
import { describe, expect, it } from 'vitest';
import { createTempLicenses } from '../lib/create-temp-licenses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

describe('createTempLicenses', () => {
  it('copies root license into package location', async () => {
    const cwd = await initFixture('licenses');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await createTempLicenses(project.licensePath, [pkg]);

    const licenseWritten = await pathExists(join(pkg.location, 'LICENSE'));
    expect(licenseWritten).toBe(true);
  });

  it('copies root license into package contents', async () => {
    const cwd = await initFixture('licenses');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // automagical "contents" setter creates absolute path
    pkg.contents = 'dist';

    await createTempLicenses(project.licensePath, [pkg]);

    const licenseWritten = await pathExists(join(pkg.contents, 'LICENSE'));
    expect(licenseWritten).toBe(true);
  });

  it('copies root license into package publishConfig.directory', async () => {
    const cwd = await initFixture('licenses');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // automagical "contents" getter creates absolute path
    await pkg.set('publishConfig', { directory: 'build' }).serialize();

    await createTempLicenses(project.licensePath, [pkg]);

    const licenseWritten = await pathExists(join(pkg.contents, 'LICENSE'));
    expect(licenseWritten).toBe(true);
  });

  it('copies root license with extension into package location', async () => {
    const cwd = await initFixture('licenses');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await move(join(cwd, 'LICENSE'), join(cwd, 'LICENSE.md'));
    await createTempLicenses(project.licensePath, [pkg]);

    const licenseWritten = await pathExists(join(pkg.location, 'LICENSE.md'));
    expect(licenseWritten).toBe(true);
  });

  it('skips copying when root license is missing', async () => {
    const cwd = await initFixture('licenses');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await createTempLicenses(undefined as any, [pkg]);

    const licenseWritten = await pathExists(join(pkg.location, 'LICENSE'));
    expect(licenseWritten).toBe(false);
  });

  it('skips copying when there are no packages to be licensed', async () => {
    const cwd = await initFixture('licenses');
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await createTempLicenses(project.licensePath, []);

    const licenseWritten = await pathExists(join(pkg.location, 'LICENSE'));
    expect(licenseWritten).toBe(false);
  });
});
