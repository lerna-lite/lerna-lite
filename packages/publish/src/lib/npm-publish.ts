import fs from 'fs-extra';
import log from 'npmlog';
import npa from 'npm-package-arg';
import path from 'path';
import pify from 'pify';
import { publish } from 'libnpmpublish';
import readJSON from 'read-package-json';

import { OneTimePasswordCache, otplease, Package, RawManifest, runLifecycle } from '@lerna-lite/core';
import { LibNpmPublishOptions, PackagePublishConfig } from '../models';

const readJSONAsync = pify(readJSON);

/**
 * Alias dash-cased npmConf to camelCase
 * @param {NpmPublishOptions} obj
 * @returns {NpmPublishOptions}
 */
function flattenOptions(obj: Omit<LibNpmPublishOptions, 'defaultTag'>): LibNpmPublishOptions {
  return {
    // eslint-disable-next-line dot-notation -- (npm v7 compat)
    defaultTag: obj['tag'] || 'latest',
    dryRun: obj['dry-run'] || obj['git-dry-run'],
    ...obj,
  };
}

/**
 * Publish a package to the configured registry.
 * @param {import("@lerna/package").Package} pkg
 * @param {string} tarFilePath
 * @param {LibNpmPublishOptions & NpmPublishOptions} [options]
 * @param {import("@lerna/otplease").OneTimePasswordCache} [otpCache]
 */
export function npmPublish(
  pkg: Package,
  tarFilePath: string,
  options: Omit<LibNpmPublishOptions, 'defaultTag'> = {},
  otpCache?: OneTimePasswordCache
) {
  const { dryRun, ...remainingOptions } = flattenOptions(options);
  const { scope } = npa(pkg?.name ?? '');
  // pass only the package scope to libnpmpublish
  const opts = {
    log,
    ...remainingOptions,
    projectScope: scope,
  };

  opts.log.verbose('publish', pkg.name);

  let chain: Promise<any> = Promise.resolve();

  if (!dryRun) {
    chain = chain.then(() => {
      let { manifestLocation } = pkg;

      if (pkg.contents !== pkg.location) {
        // 'rebase' manifest used to generated directory
        manifestLocation = path.join(pkg.contents, 'package.json');
      }

      return Promise.all([fs.readFile(tarFilePath), readJSONAsync(manifestLocation) as RawManifest]);
    });
    chain = chain.then(([tarData, manifest]: [any, RawManifest]) => {
      // non-default tag needs to override publishConfig.tag,
      // which is merged into opts below if necessary
      if (
        opts.defaultTag !== 'latest' &&
        manifest.publishConfig &&
        manifest.publishConfig.tag &&
        manifest.publishConfig.tag !== opts.defaultTag
      ) {
        // eslint-disable-next-line no-param-reassign
        manifest.publishConfig.tag = opts.defaultTag as string;
      }

      // publishConfig is no longer consumed in n-r-f, so merge here
      if (manifest.publishConfig) {
        Object.assign(opts, publishConfigToOpts(manifest.publishConfig));
      }

      return otplease(
        (innerOpts) => publish(manifest, tarData, innerOpts),
        opts,
        otpCache as OneTimePasswordCache
      ).catch((err) => {
        opts.log.silly('', err);
        opts.log.error(err.code, err.body?.error ?? err.message);

        // avoid dumping logs, this isn't a lerna-lite problem
        err.name = 'ValidationError';

        // ensure process exits non-zero
        process.exitCode = 'errno' in err ? err.errno : 1;

        // re-throw to break chain upstream
        throw err;
      });
    });
  }

  chain = chain.then(() => runLifecycle(pkg, 'publish', opts));
  chain = chain.then(() => runLifecycle(pkg, 'postpublish', opts));

  return chain;
}

/**
 * Obtain an object suitable for assignment onto existing options from `pkg.publishConfig`.
 * @param {PackagePublishConfig} publishConfig
 * @returns {Omit<PackagePublishConfig, 'tag'> & { defaultTag?: string }}
 */
function publishConfigToOpts(
  publishConfig: PackagePublishConfig
): Omit<PackagePublishConfig, 'tag'> & { defaultTag?: string } {
  const opts = { ...publishConfig };

  // npm v7 renamed tag internally
  if (publishConfig.tag) {
    opts.defaultTag = publishConfig.tag;
    delete opts.tag;
  }

  return opts;
}
