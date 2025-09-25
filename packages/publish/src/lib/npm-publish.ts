import { dirname, join } from 'node:path';

import { type Conf, type LifecycleConfig, type Package, runLifecycle } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { type OneTimePasswordCache, otplease } from '@lerna-lite/version';
import PackageJson from '@npmcli/package-json';
import { readFile } from 'fs/promises';
import { publish } from 'libnpmpublish';
import npa from 'npm-package-arg';

import type { LibNpmPublishOptions, PackagePublishConfig } from '../interfaces.js';
import { oidc } from './oidc.js';

/**
 * Alias dash-cased npmConf to camelCase
 * @param {NpmPublishOptions} obj
 * @returns {NpmPublishOptions}
 */
function flattenOptions(obj: Omit<LibNpmPublishOptions, 'defaultTag'>): LibNpmPublishOptions {
  return {
    defaultTag: obj['tag'] || 'latest',
    dryRun: obj['dry-run'] || obj['git-dry-run'],
    // libnpmpublish / npm-registry-fetch check strictSSL rather than strict-ssl
    strictSSL: obj['strict-ssl'],
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
export async function npmPublish(
  pkg: Package,
  tarFilePath: string,
  options: Omit<LibNpmPublishOptions, 'defaultTag'> = {},
  conf: Conf,
  otpCache?: OneTimePasswordCache
): Promise<void | Response> {
  const { dryRun, ...remainingOptions } = flattenOptions(options);
  const { scope } = npa(pkg.name ?? '');
  // pass only the package scope to libnpmpublish
  const opts = {
    log,
    ...remainingOptions,
    projectScope: scope,
  };

  opts.log.verbose('publish', pkg.name);

  let result: undefined | Response;

  if (!dryRun) {
    let { manifestLocation } = pkg;

    if (pkg.contents !== pkg.location) {
      // 'rebase' manifest used to generated directory
      manifestLocation = join(pkg.contents, 'package.json');
    }

    const [tarData, npmCliPackageJson] = await Promise.all([
      readFile(tarFilePath),
      await PackageJson.prepare(dirname(manifestLocation)),
    ]);

    const manifestContent = npmCliPackageJson.content;

    // non-default tag needs to override publishConfig.tag,
    // which is merged into opts below if necessary
    if (
      opts.defaultTag !== 'latest' &&
      manifestContent.publishConfig &&
      manifestContent.publishConfig.tag &&
      manifestContent.publishConfig.tag !== opts.defaultTag
    ) {
      manifestContent.publishConfig.tag = opts.defaultTag as string;
    }

    // publishConfig is no longer consumed in n-r-f, so merge here
    if (manifestContent.publishConfig) {
      Object.assign(opts, publishConfigToOpts(manifestContent.publishConfig));
    }

    // OIDC trusted publishing
    await oidc({
      packageName: pkg.name,
      registry: opts.registry ?? 'https://registry.npmjs.org/',
      opts,
      config: conf,
    });

    result = await otplease((innerOpts) => publish(manifestContent, tarData, innerOpts), opts, otpCache as OneTimePasswordCache);
  }

  await runLifecycle(pkg, 'publish', opts as LifecycleConfig);
  await runLifecycle(pkg, 'postpublish', opts as LifecycleConfig);

  return result;
}

/**
 * Obtain an object suitable for assignment onto existing options from `pkg.publishConfig`.
 * @param {PackagePublishConfig} publishConfig
 * @returns {Omit<PackagePublishConfig, 'tag'> & { defaultTag?: string }}
 */
function publishConfigToOpts(publishConfig: PackagePublishConfig): Omit<PackagePublishConfig, 'tag'> & { defaultTag?: string } {
  const opts = { ...publishConfig };

  // npm v7 renamed tag internally
  if (publishConfig.tag) {
    opts.defaultTag = publishConfig.tag;
    delete opts.tag;
  }

  return opts;
}
