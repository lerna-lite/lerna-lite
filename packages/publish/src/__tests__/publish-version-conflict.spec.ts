import { describe, expect, it } from 'vitest';

import { isNpmJsPublishVersionConflict } from '../lib/is-npm-js-publish-version-conflict.js';
import { isNpmPkgGitHubPublishVersionConflict } from '../lib/is-npm-pkg-github-publish-version-conflict.js';

describe('publish version conflicts', () => {
  it.each([
    Object.assign(new Error('Conflict'), { code: 'E409' }),
    Object.assign(new Error('Failed to save packument'), { code: 'E409' }),
    new Error('409 Conflict - PUT https://npm.pkg.github.com/package - conflicting request'),
  ])('does not treat an ambiguous conflict as an existing version: %s', (error) => {
    expect(isNpmJsPublishVersionConflict(error)).toBe(false);
    expect(isNpmPkgGitHubPublishVersionConflict(error)).toBe(false);
  });

  it.each([
    Object.assign(new Error('conflict'), { code: 'EPUBLISHCONFLICT' }),
    Object.assign(new Error('You cannot publish over the previously published versions: 1.0.0'), { code: 'E403' }),
  ])('recognizes an npm existing version response: %s', (error) => {
    expect(isNpmJsPublishVersionConflict(error)).toBe(true);
  });

  it.each([
    Object.assign(new Error('conflict'), { code: 'E409', body: { error: 'Cannot publish over existing version' } }),
    new Error('409 Conflict - PUT https://npm.pkg.github.com/package - Cannot publish over existing version'),
  ])('recognizes a GitHub Packages existing version response: %s', (error) => {
    expect(isNpmPkgGitHubPublishVersionConflict(error)).toBe(true);
  });
});
