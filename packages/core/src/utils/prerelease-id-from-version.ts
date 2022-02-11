import semver from 'semver';

/**
 * @param {string} version
 * @returns {string|undefined}
 */
export function prereleaseIdFromVersion(version: string): string | undefined {
  return ((semver.prerelease(version) || []) as string[]).shift();
}
