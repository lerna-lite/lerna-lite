import { accessSync, constants, readdirSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import semver from 'semver';
import { Package } from '../packages/core/dist/package.js';

export function toDependOn() {
  return createDependencyMatcher('dependencies');
}
export function toDevDependOn() {
  return createDependencyMatcher('devDependencies');
}
export function toPeerDependOn() {
  return createDependencyMatcher('peerDependencies');
}

function createDependencyMatcher(dependencyType) {
  const verbMap = {
    dependencies: 'depend',
    devDependencies: 'dev-depend',
    peerDependencies: 'peer-depend',
  };
  const verb = verbMap[dependencyType] || 'dev-depend';

  return (received, name, range, options) => {
    const pkg = Package.lazy(received);
    const noDeps = typeof pkg[dependencyType] !== 'object';
    const id = [name, range].filter(Boolean).join('@');
    const exact = options && options.exact;

    const expectedName = `expected ${pkg.name}`;
    const expectedAction = `to ${verb} on ${id}`;
    const expectation = `${expectedName} ${expectedAction}`;
    const json = JSON.stringify(pkg[dependencyType], null, 2);

    if (noDeps) {
      return {
        message: () => `${expectation} but no ${dependencyType} specified`,
        pass: false,
      };
    }

    const missingDep = !(name in pkg[dependencyType]);

    if (missingDep) {
      return {
        message: () => `${expectation} but it is missing from ${dependencyType}\n${json}`,
        pass: false,
      };
    }

    // replace backslashes because windows sucks
    const version = pkg[dependencyType][name].replace(/[\\]/g, '/');

    // we don't care about semver intersection, it's not always a semver range
    const mismatchedDep = range && version !== range;

    if (mismatchedDep) {
      return {
        message: () => `${expectation} but ${version} does not satisfy ${range}\n${json}`,
        pass: false,
      };
    }

    if (exact) {
      if (!semver.valid(version)) {
        return {
          message: () => `${expectation} but ${version} is not an exact version\n${json}`,
          pass: false,
        };
      }

      // semver.eq will throw a TypeError if range is not a valid exact version
      if (!semver.eq(version, range)) {
        return {
          message: () => `${expectation} but ${version} is not ${range}\n${json}`,
          pass: false,
        };
      }
    }

    return {
      message: () => `${expectedName} not ${expectedAction}`,
      pass: true,
    };
  };
}

export function toHaveBinaryLinks(received, ...inputs) {
  const pkg = Package.lazy(received);
  const links =
    process.platform === 'win32'
      ? inputs.reduce(
          (acc, input) => [
            ...acc,
            input,
            // cmd.exe
            [input, 'cmd'].join('.'),
            // powershell
            [input, 'ps1'].join('.'),
          ],
          []
        )
      : inputs;

  const expectedName = `expected ${pkg.name}`;
  const expectedAction = `to link to ${links.join(', ')}`;

  let found;

  try {
    found = readdirSync(pkg.binLocation);
  } catch (err: any) {
    if (links.length === 0 && err.code === 'ENOENT') {
      return {
        message: () => `${expectedName} not to have binary links`,
        pass: !this.isNot,
      };
    }

    throw err;
  }

  const missing = links.filter((link) => found.indexOf(link) === -1);
  const superfluous = found.filter((link) => links.indexOf(link) === -1);

  if (missing.length > 0 || superfluous.length > 0) {
    return {
      message: () =>
        [
          expectedName,
          expectedAction,
          missing.length > 0 ? `missing: ${missing.join(', ')}` : '',
          superfluous.length > 0 ? `superfluous: ${superfluous.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      pass: false,
    };
  }

  return {
    message: () => `${expectedName} not ${expectedAction}`,
    pass: true,
  };
}

export function toHaveExecutables(received, ...files) {
  const pkg = Package.lazy(received);

  const expectedFiles = `expected ${files.join(', ')}`;
  const expectedAction = 'to be executable';
  const expectation = `${expectedFiles} ${expectedAction}`;

  const X_OK = constants.X_OK;
  const failed = files.filter((file) => {
    try {
      return accessSync(pathJoin(pkg.location, file), X_OK);
    } catch (_) {
      return true;
    }
  });

  const pass = failed.length === 0;
  const verb = failed.length > 1 ? 'were' : 'was';

  return {
    message: () =>
      pass
        ? `${expectedFiles} not ${expectedAction}`
        : `${expectation} while ${failed.join(', ')} ${verb} found to be not executable.`,
    pass,
  };
}
