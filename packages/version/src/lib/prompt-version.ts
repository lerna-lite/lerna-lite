import type { PackageGraphNode } from '@lerna-lite/core';
import { promptSelectOne, promptTextInput } from '@lerna-lite/core';
import semver from 'semver';

import { applyBuildMetadata } from '../conventional-commits/apply-build-metadata.js';

/**
 * @param {(existingPreid: string) => string} resolvePrereleaseId
 * @param {string} buildMetadata
 */
export function makePromptVersion(resolvePrereleaseId: (prereleaseId?: string) => string | undefined, buildMetadata?: string) {
  return (node: PackageGraphNode) =>
    promptVersion(node.version, node.name, resolvePrereleaseId(node.prereleaseId), buildMetadata);
}

/**
 * A predicate that prompts user to select/construct a version bump.
 * It can be run per-package (independent) or globally (fixed).
 *
 * @param {PackageGraphNode|Object} node The metadata to process
 * @param {String} currentVersion
 * @param {String} name (Only used in independent mode)
 * @param {String} prereleaseId
 * @param {String} buildMetadata
 */
export async function promptVersion(
  currentVersion: string,
  name: string,
  prereleaseId?: string,
  buildMetadata?: string
): Promise<string> {
  const patch = applyBuildMetadata(semver.inc(currentVersion, 'patch'), buildMetadata);
  const minor = applyBuildMetadata(semver.inc(currentVersion, 'minor'), buildMetadata);
  const major = applyBuildMetadata(semver.inc(currentVersion, 'major'), buildMetadata);
  const prepatch = applyBuildMetadata(semver.inc(currentVersion, 'prepatch', prereleaseId || ''), buildMetadata);
  const preminor = applyBuildMetadata(semver.inc(currentVersion, 'preminor', prereleaseId || ''), buildMetadata);
  const premajor = applyBuildMetadata(semver.inc(currentVersion, 'premajor', prereleaseId || ''), buildMetadata);

  const message = `Select a new version ${name ? `for ${name} ` : ''}(currently ${currentVersion})`;

  const choice = await promptSelectOne(message, {
    choices: [
      { value: patch, name: `Patch (${patch})` },
      { value: minor, name: `Minor (${minor})` },
      { value: major, name: `Major (${major})` },
      { value: prepatch, name: `Prepatch (${prepatch})` },
      { value: preminor, name: `Preminor (${preminor})` },
      { value: premajor, name: `Premajor (${premajor})` },
      { value: 'PRERELEASE', name: 'Custom Prerelease' },
      { value: 'CUSTOM', name: 'Custom Version' },
    ],
  });

  if (choice === 'CUSTOM') {
    return promptTextInput('Enter a custom version', {
      filter: semver.valid,
      // semver.valid() always returns null with invalid input
      validate: (v) => v !== null || 'Must be a valid semver version',
    });
  }

  if (choice === 'PRERELEASE') {
    const defaultVersion = semver.inc(currentVersion, 'prerelease', prereleaseId || '');
    const prompt = `(default: "${prereleaseId}", yielding ${defaultVersion})`;

    return promptTextInput(`Enter a prerelease identifier ${prompt}`, {
      filter: (v) => applyBuildMetadata(semver.inc(currentVersion, 'prerelease', v || prereleaseId || ''), buildMetadata),
    });
  }

  return choice;
}