import { Package, PackageGraphNode } from '@lerna-lite/core';
import conventionalRecommendedBump from 'conventional-recommended-bump';
import conventionalChangelogCore from 'conventional-changelog-core';
import log from 'npmlog';
import semver, { ReleaseType } from 'semver';

import { BaseChangelogOptions, VersioningStrategy } from '../models/index.js';
import { GetChangelogConfig } from './get-changelog-config.js';
import { applyBuildMetadata } from './apply-build-metadata.js';

/**
 * @param {import('@lerna/package').Package} pkg
 * @param {import('..').VersioningStrategy} type
 * @param {import('..').BaseChangelogOptions & { prereleaseId?: string, buildMetadata?: string }} commandOptions
 */
export async function recommendVersion(
  pkg: Package | PackageGraphNode,
  type: VersioningStrategy,
  recommendationOptions: BaseChangelogOptions & {
    prereleaseId?: string;
    conventionalBumpPrerelease?: boolean;
    buildMetadata?: string;
  }
): Promise<string | null> {
  const { changelogPreset, rootPath, tagPrefix, prereleaseId, conventionalBumpPrerelease, buildMetadata } = recommendationOptions;

  log.silly(type, 'for %s at %s', pkg.name, pkg.location);

  const options: conventionalRecommendedBump.Options = {
    path: pkg.location,
  };

  if (type === 'independent') {
    options.lernaPackage = pkg.name;
  } else {
    // only fixed mode can have a custom tag prefix
    options.tagPrefix = tagPrefix;
  }

  const shouldBumpPrerelease = (releaseType: ReleaseType, version: string) => {
    if (!semver.prerelease(version)) {
      return true;
    }
    switch (releaseType) {
      case 'major':
        return semver.minor(version) !== 0 || semver.patch(version) !== 0;
      case 'minor':
        return semver.patch(version) !== 0;
      default:
        return false;
    }
  };

  // 'new' preset API
  options.config = (await GetChangelogConfig.getChangelogConfig(
    changelogPreset,
    rootPath
  )) as conventionalChangelogCore.Options.Config;

  // Ensure potential ValidationError in getChangelogConfig() is propagated correctly
  return new Promise((resolve, reject) => {
    conventionalRecommendedBump(options, (err, data) => {
      if (err) {
        return reject(err);
      }

      // result might be undefined because some presets are not consistent with angular
      // we still need to bump _something_ because lerna-lite saw a change here
      let releaseType = data.releaseType || 'patch';

      if (prereleaseId) {
        const shouldBump = conventionalBumpPrerelease || shouldBumpPrerelease(releaseType, pkg.version);
        const prereleaseType: ReleaseType = shouldBump ? `pre${releaseType}` : 'prerelease';
        log.verbose(type, 'increment %s by %s - %s', pkg.version, prereleaseType, pkg.name);
        resolve(applyBuildMetadata(semver.inc(pkg.version, prereleaseType, prereleaseId), buildMetadata));
      } else {
        if (semver.major(pkg.version) === 0) {
          // According to semver, major version zero (0.y.z) is for initial
          // development. Anything MAY change at any time. The public API
          // SHOULD NOT be considered stable. The version 1.0.0 defines
          // the (initial stable) public API.
          //
          // To allow monorepos to use major version zero meaningfully,
          // the transition from 0.x to 1.x must be explicitly requested
          // by the user. Breaking changes MUST NOT automatically bump
          // the major version from 0.x to 1.x.
          //
          // The usual convention is to use semver-patch bumps for bugfix
          // releases and semver-minor for everything else, including
          // breaking changes. This matches the behavior of `^` operator
          // as implemented by `npm`.
          //
          if (releaseType === 'major') {
            releaseType = 'minor';
          }
        }
        log.verbose(type, 'increment %s by %s - %s', pkg.version, releaseType, pkg.name);
        resolve(applyBuildMetadata(semver.inc(pkg.version, releaseType), buildMetadata));
      }
    });
  });
}
