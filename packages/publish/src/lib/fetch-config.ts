import { FetchConfig } from '@lerna-lite/core';
import log from 'npmlog';

/**
 * Create a merged options object suitable for npm-registry-fetch.
 * @param {{ [key: string]: unknown }} options
 * @param {Partial<FetchConfig>} [extra]
 * @returns {FetchConfig}
 */
export function getFetchConfig(options?: { [key: string]: any }, extra?: Partial<FetchConfig>) {
  return {
    log,
    ...options,
    ...extra,
  } as FetchConfig;
}
