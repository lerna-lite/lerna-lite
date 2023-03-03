import { ValidationError } from '@lerna-lite/core';

const BUILD_METADATA_REGEX = /^[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*$/;

/**
 * Append build metadata to version.
 * @param {string} version
 * @param {string} buildMetadata
 */
export function applyBuildMetadata(version: null | string, buildMetadata?: null | string) {
  version = version || '';
  if (!buildMetadata) {
    return version;
  }
  if (isValidBuildMetadata(buildMetadata)) {
    return `${version}+${buildMetadata}`;
  }
  throw new ValidationError('EBUILDMETADATA', 'Build metadata does not satisfy SemVer specification.');
}

/**
 * Validate build metadata against SemVer specification.
 * @see https://semver.org/#spec-item-10
 *
 * @param {string} buildMetadata
 */
function isValidBuildMetadata(buildMetadata) {
  return BUILD_METADATA_REGEX.test(buildMetadata);
}
