import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { runLifecycle, type Conf, type LifecycleConfig, type Package } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { otplease, type OneTimePasswordCache } from '@lerna-lite/version';
import PackageJson from '@npmcli/package-json';
import { publish } from 'libnpmpublish';
import npa from 'npm-package-arg';

import type { LibNpmPublishOptions, PackagePublishConfig } from '../interfaces.js';
import { oidc } from './oidc.js';

const TLOG_CONFLICT_MAX_ATTEMPTS = 3;
const TLOG_CONFLICT_RETRY_DELAY = 2000;

/**
 * Sigstore's internal HTTP retry can re-POST an entry that Rekor already stored, which then fails with a 409.
 * Provenance is generated before the registry PUT, so retrying is safe and produces a fresh (non-duplicate) signature.
 */
function isTlogConflictError(err: any): boolean {
  return err?.code === 'TLOG_CREATE_ENTRY_ERROR' && err?.cause?.statusCode === 409;
}

async function publishWithTlogRetry<T>(pkgName: string, publishFn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await publishFn();
    } catch (err: any) {
      if (!isTlogConflictError(err) || attempt >= TLOG_CONFLICT_MAX_ATTEMPTS) {
        throw err;
      }
      log.warn(
        'publish',
        `Sigstore transparency log conflict (409) for ${pkgName}, retrying provenance signing (attempt ${attempt + 1}/${TLOG_CONFLICT_MAX_ATTEMPTS})`
      );
      await new Promise((resolve) => setTimeout(resolve, TLOG_CONFLICT_RETRY_DELAY * attempt));
    }
  }
}

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

  // OIDC trusted publishing
  await oidc({
    packageName: pkg.name,
    registry: opts.registry ?? 'https://registry.npmjs.org/',
    opts,
    config: conf,
  });

  if (!dryRun) {
    let { manifestLocation } = pkg;

    if (pkg.contents !== pkg.location) {
      // 'rebase' manifest used to generated directory
      manifestLocation = join(pkg.contents, 'package.json');
    }

    const [tarData, npmCliPackageJson] = await Promise.all([
      readFile(tarFilePath),
      PackageJson.prepare(dirname(manifestLocation)),
    ]);

    const manifestContent = npmCliPackageJson.content;

    // non-default tag needs to override publishConfig.tag,
    // which is merged into opts below if necessary
    if (
      opts.defaultTag !== 'latest' &&
      manifestContent.publishConfig?.tag &&
      manifestContent.publishConfig.tag !== opts.defaultTag
    ) {
      manifestContent.publishConfig.tag = opts.defaultTag as string;
    }

    // publishConfig is no longer consumed in n-r-f, so merge here
    if (manifestContent.publishConfig) {
      Object.assign(opts, publishConfigToOpts(manifestContent.publishConfig));
    }

    result = await publishWithTlogRetry(pkg.name, () =>
      otplease((innerOpts) => publish(manifestContent, tarData, innerOpts), opts, otpCache as OneTimePasswordCache)
    );
  }

  // ensure lifecycle script output is visible on the terminal,
  // matching the behavior of prepublishOnly in pack-directory.ts
  // TODO: refactor based on TS feedback
  // @ts-ignore
  opts.stdio = 'inherit';

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
