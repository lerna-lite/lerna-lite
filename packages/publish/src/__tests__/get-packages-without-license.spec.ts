'use strict';

import { Project } from '@lerna-lite/core';
import { getPackagesWithoutLicense } from '../lib/get-packages-without-license';
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(__dirname);

test('getPackagesWithoutLicense', async () => {
  const cwd = await initFixture('licenses');
  const project = new Project(cwd);

  const [pkg1, pkg2] = await project.getPackages();
  const packagesToBeLicensed = await getPackagesWithoutLicense(project, [pkg1, pkg2]);

  expect(packagesToBeLicensed).toEqual([pkg1]);
});
