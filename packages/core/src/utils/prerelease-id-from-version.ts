import semver from 'semver';

/**
 * @param {string} version
 * @returns {string|undefined}
 */
export function prereleaseIdFromVersion(version) {
  return (semver.prerelease(version) || []).shift();
}
