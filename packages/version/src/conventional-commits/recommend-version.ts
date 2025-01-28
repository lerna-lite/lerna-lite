import { Package, PackageGraphNode } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { Bumper, BumperRecommendation, packagePrefix } from 'conventional-recommended-bump';
import semver, { BaseReleaseType, ReleaseType } from 'semver';

import { BaseChangelogOptions, ChangelogConfig, VersioningStrategy } from '../interfaces.js';
import { GetChangelogConfig } from './get-changelog-config.js';
import { applyBuildMetadata } from './apply-build-metadata.js';
import { Commit } from 'conventional-commits-parser';

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
  },
  premajorVersionBump?: 'default' | 'force-patch'
): Promise<string | null> {
  const { changelogPreset, rootPath, tagPrefix, prereleaseId, conventionalBumpPrerelease, buildMetadata } = recommendationOptions;

  log.silly(type, 'for %s at %s', pkg.name, pkg.location);

  const bumper = new Bumper();

  // 'new' preset API
  const changelogConfig: ChangelogConfig = await GetChangelogConfig.getChangelogConfig(changelogPreset, rootPath);
  const parserOptions =
    changelogConfig.output?.recommendedBumpOpts.parserOpts ||
    changelogConfig.conventionalChangelog?.parserOpts ||
    changelogConfig.parser;

  bumper.commits({ path: pkg.location }, parserOptions);

  if (type === 'independent') {
    // lernaPackage got removed in v10, see https://github.com/conventional-changelog/conventional-changelog/issues/1266#issuecomment-2102760233
    const pkgPrefix = packagePrefix(pkg.name);
    bumper.tag({ prefix: pkgPrefix });
  } else {
    // only fixed mode can have a custom tag prefix
    bumper.tag({ prefix: tagPrefix });
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

  async function getWhatBump() {
    if (typeof changelogConfig.whatBump === 'function') {
      return changelogConfig.whatBump;
    }

    const bumperPreset = changelogConfig?.output || changelogConfig;

    if (bumperPreset === null) {
      return () => ({ releaseType: null });
    }

    return (bumperPreset as ChangelogConfig).whatBump || bumperPreset.recommendedBumpOpts?.whatBump;
  }

  // Ensure potential ValidationError in getChangelogConfig() is propagated correctly
  return new Promise(async (resolve, reject) => {
    try {
      // result might be undefined because some presets are not consistent with angular
      // we still need to bump _something_ because lerna-lite saw a change here
      const whatBumpResult = (await getWhatBump()) as (commits: Commit[]) => Promise<BumperRecommendation | null | undefined>;
      let releaseType: ReleaseType = ((await bumper.bump(whatBumpResult)).releaseType || 'patch') as BaseReleaseType;

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
          // In node-semver, it is however also documented that
          // "Many authors treat a 0.x version as if the x were the major "breaking-change" indicator."
          // and all other features or bug fixes as semver-patch bumps
          // this can be enabled in lerna through `premajorVersionBump = "force-patch"`
          if (releaseType === 'major') {
            releaseType = 'minor';
          } else if (premajorVersionBump === 'force-patch') {
            releaseType = 'patch';
          }
        }
        log.verbose(type, 'increment %s by %s - %s', pkg.version, releaseType, pkg.name);
        resolve(applyBuildMetadata(semver.inc(pkg.version, releaseType), buildMetadata));
      }
    } catch (err) {
      reject(err);
    }
  });
}
