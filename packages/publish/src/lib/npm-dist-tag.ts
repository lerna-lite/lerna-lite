import { log } from '@lerna-lite/npmlog';
import type { OneTimePasswordCache } from '@lerna-lite/version';
import { otplease } from '@lerna-lite/version';
import npa from 'npm-package-arg';
import fetch from 'npm-registry-fetch';
import type { DistTagOptions } from '../interfaces.js';

/**
 * Add a dist-tag to a package.
 * @param {string} spec
 * @param {string} [tag]
 * @param {DistTagOptions} options
 * @param {import("@lerna/otplease").OneTimePasswordCache} otpCache
 */
export function add(spec: string, tag = '', options: DistTagOptions, otpCache: OneTimePasswordCache) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };
  const cleanTag = (tag || opts.defaultTag || opts.tag).trim();

  const { name, rawSpec: version } = opts.spec;

  opts.log.verbose('dist-tag', `adding "${cleanTag}" to ${name}@${version}`);

  /* v8 ignore if */
  if (opts.dryRun) {
    opts.log.silly('dist-tag', 'dry-run configured, bailing now');
    return Promise.resolve();
  }

  return fetchTags(opts).then((tags) => {
    if (tags[cleanTag] === version) {
      opts.log.warn('dist-tag', `${name}@${cleanTag} already set to ${version}`);
      return tags;
    }

    const uri = `/-/package/${opts.spec.escapedName}/dist-tags/${encodeURIComponent(cleanTag)}`;
    const payload = {
      ...opts,
      method: 'PUT',
      body: JSON.stringify(version),
      headers: {
        // cannot use fetch.json() due to HTTP 204 response,
        // so we manually set the required content-type
        'content-type': 'application/json',
      },
      spec: opts.spec,
    };

    // success returns HTTP 204, thus no JSON to parse
    return otplease((wrappedPayload) => fetch(uri, wrappedPayload), payload, otpCache).then(() => {
      opts.log.verbose('dist-tag', `added "${cleanTag}" to ${name}@${version}`);

      tags[cleanTag] = version;

      return tags;
    });
  });
}

/**
 * Remove a dist-tag from a package.
 * @param {string} spec
 * @param {string} tag
 * @param {DistTagOptions} options
 * @param {import("@lerna/otplease").OneTimePasswordCache} otpCache
 */
export function remove(spec: string, tag: string, options: DistTagOptions, otpCache: OneTimePasswordCache) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };

  opts.log.verbose('dist-tag', `removing "${tag}" from ${opts.spec.name}`);

  /* v8 ignore if */
  if (opts.dryRun) {
    opts.log.silly('dist-tag', 'dry-run configured, bailing now');
    return Promise.resolve();
  }

  return fetchTags(opts).then((tags: string[]) => {
    const version = tags[tag];

    if (!version) {
      opts.log.info('dist-tag', `"${tag}" is not a dist-tag on ${opts.spec.name}`);
      return tags;
    }

    const uri = `/-/package/${opts.spec.escapedName}/dist-tags/${encodeURIComponent(tag)}`;
    const payload = {
      ...opts,
      method: 'DELETE',
      spec: opts.spec,
    };

    // the delete properly returns a 204, so no json to parse
    return otplease((wrappedPayload) => fetch(uri, wrappedPayload), payload, otpCache).then(() => {
      opts.log.verbose('dist-tag', `removed "${tag}" from ${opts.spec.name}@${version}`);

      delete tags[tag];

      return tags;
    });
  });
}

/**
 * List dist-tags of a package.
 * @param {string} spec
 * @param {DistTagOptions} options
 */
export function list(spec: string, options: DistTagOptions) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };

  /* v8 ignore if */
  if (opts.dryRun) {
    opts.log.silly('dist-tag', 'dry-run configured, bailing now');
    return Promise.resolve();
  }

  return fetchTags(opts);
}

/**
 * Retrieve list of dist-tags for a package.
 * @param {Omit<fetch.FetchOptions, 'spec'> & { spec: npa.Result }} opts
 */
export function fetchTags(opts: Omit<fetch.FetchOptions, 'spec'> & { spec: npa.Result }) {
  return fetch
    .json(`/-/package/${opts.spec.escapedName ?? ''}/dist-tags`, {
      ...opts,
      preferOnline: true,
      spec: opts.spec,
    })
    .then((data: any) => {
      if (data && typeof data === 'object') {
        delete data._etag;
      }

      return data || {};
    });
}
