import log from 'npmlog';

/**
 * Create a merged options object suitable for npm-registry-fetch.
 * @param {{ [key: string]: unknown }} options
 * @param {Partial<FetchConfig>} [extra]
 * @returns {FetchConfig}
 */
export function getFetchConfig(options, extra) {
  return {
    log,
    ...options,
    ...extra,
  };
}
