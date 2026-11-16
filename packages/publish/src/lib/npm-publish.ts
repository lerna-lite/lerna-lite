import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { runLifecycle, type Conf, type LifecycleConfig, type Package } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { otplease, type OneTimePasswordCache } from '@lerna-lite/version';
import PackageJson from '@npmcli/package-json';
import { publish } from 'libnpmpublish';
import npa from 'npm-package-arg';

import type { LibNpmPublishOptions, PackagePublishConfig } from '../interfaces.js';
import { isRegistryPublishVersionConflict } from './is-registry-publish-version-conflict.js';
import { oidc } from './oidc.js';

const SIGNING_MAX_ATTEMPTS = 3;
const SIGNING_RETRY_DELAY = 2000;
const RETRYABLE_NETWORK_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EAI_AGAIN']);

/**
 * Sigstore signs before the registry PUT. Retrying only its known signing errors
 * creates a fresh signature without retrying an ambiguous registry publish.
 */
function isRetryableSigningError(err: any, provenance: boolean): boolean {
  const { code, cause } = err ?? {};
  if (code === 'TLOG_CREATE_ENTRY_ERROR' && cause?.statusCode === 409) {
    return true;
  }
  if (
    !provenance ||
    !['TLOG_CREATE_ENTRY_ERROR', 'CA_CREATE_SIGNING_CERTIFICATE_ERROR', 'TSA_CREATE_TIMESTAMP_ERROR'].includes(code)
  ) {
    return false;
  }
  const status = cause?.statusCode;
  return (
    status === 408 ||
    status === 429 ||
    (status >= 500 && status <= 599) ||
    cause?.type === 'request-timeout' ||
    RETRYABLE_NETWORK_CODES.has(cause?.code)
  );
}

async function publishWithSigningRetry<T>(pkgName: string, provenance: boolean, publishFn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await publishFn();
    } catch (err: any) {
      if (!isRetryableSigningError(err, provenance) || attempt >= SIGNING_MAX_ATTEMPTS) {
        throw err;
      }
      log.warn(
        'publish',
        `Sigstore signing failed for ${pkgName} (${err.code}), retrying provenance signing (attempt ${attempt + 1}/${SIGNING_MAX_ATTEMPTS})`
      );
      await new Promise((resolve) => setTimeout(resolve, SIGNING_RETRY_DELAY * attempt));
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
    // Both npm-registry-fetch and Sigstore expect `timeout`, not npm's config key.
    // Without this mapping, Sigstore falls back to a five-second request timeout.
    timeout: obj['fetch-timeout'],
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
  options: Omit<LibNpmPublishOptions, 'defaultTag'> & { explicitTag?: boolean } = {},
  conf: Conf,
  otpCache?: OneTimePasswordCache
): Promise<void | Response> {
  const { explicitTag, ...publishOptions } = options;
  const { dryRun, ...remainingOptions } = flattenOptions(publishOptions);
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

    // an explicit or non-default tag needs to override publishConfig.tag,
    // which is merged into opts below if necessary
    if (
      (explicitTag || opts.defaultTag !== 'latest') &&
      manifestContent.publishConfig?.tag &&
      manifestContent.publishConfig.tag !== opts.defaultTag
    ) {
      manifestContent.publishConfig.tag = opts.defaultTag as string;
    }

    // publishConfig is no longer consumed in n-r-f, so merge here
    if (manifestContent.publishConfig) {
      Object.assign(opts, publishConfigToOpts(manifestContent.publishConfig));
    }

    // Sigstore retries POSTs with the same signature after timeouts, which can
    // produce a duplicate Rekor entry. Retry the signing operation instead so
    // each attempt creates a fresh key. npm-registry-fetch treats retry: 0 as
    // unset and continues to use its fetchRetries configuration.
    const publishOpts = opts.provenance === true && opts.retry == null ? { ...opts, retry: 0 } : opts;
    result = await publishWithSigningRetry(pkg.name, opts.provenance === true, () =>
      otplease(
        async (innerOpts) => {
          try {
            return await publish(manifestContent, tarData, innerOpts);
          } catch (err) {
            if (await isRegistryPublishVersionConflict(err, manifestContent, innerOpts)) {
              // Use the existing explicit conflict signal so the command skips this version.
              throw Object.assign(
                new Error(`Package is already published: ${manifestContent.name}@${manifestContent.version}`, { cause: err }),
                {
                  code: 'EPUBLISHCONFLICT',
                }
              );
            }
            throw err;
          }
        },
        publishOpts,
        otpCache as OneTimePasswordCache
      )
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
