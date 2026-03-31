import { Project } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { expect, test } from 'vitest';

import { getPackagesWithoutLicense } from '../lib/get-packages-without-license.js';

const initFixture = initFixtureFactory(import.meta.dirname);

test('getPackagesWithoutLicense', async () => {
  const cwd = await initFixture('licenses');
  const project = new Project(cwd);

  const [pkg1, pkg2] = await project.getPackages();
  const packagesToBeLicensed = await getPackagesWithoutLicense(project, [pkg1, pkg2]);

  expect(packagesToBeLicensed).toEqual([pkg1]);
});
