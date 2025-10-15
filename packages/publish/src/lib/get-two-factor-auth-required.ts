import type { FetchConfig } from '@lerna-lite/core';
import { ValidationError } from '@lerna-lite/core';
import { getFetchConfig } from './fetch-config.js';
import { getProfileData } from './get-profile-data.js';

/**
 * Determine if the logged-in user has enabled two-factor auth.
 * @param {import('./fetch-config').FetchConfig} options
 * @returns {Promise<boolean>}
 */
export function getTwoFactorAuthRequired(options?: FetchConfig) {
  const opts = getFetchConfig(options, {
    // don't wait forever for third-party failures to be dealt with
    fetchRetries: 0,
  });

  opts.log.info('', 'Checking two-factor auth mode');

  return getProfileData(opts).then(success, failure);

  function success(result: { tfa: { pending: boolean; mode: string } }) {
    opts.log.silly('2FA', result.tfa.toString());

    if (result.tfa.pending) {
      // if 2FA is pending, it is disabled
      return false;
    }

    return result.tfa.mode === 'auth-and-writes';
  }

  function failure(err: any) {
    // pass if registry does not support profile endpoint
    if (err.code === 'E500' || err.code === 'E404') {
      // most likely a private registry (npm Enterprise, verdaccio, etc)
      opts.log.warn(
        'EREGISTRY',
        `Registry "${opts.registry}" does not support 'npm profile get', skipping two-factor auth check...`
      );

      // don't log redundant errors
      return false;
    }

    // Log the error cleanly to stderr
    opts.log.pause();
    console.error(err.message);
    opts.log.resume();

    throw new ValidationError('ETWOFACTOR', 'Unable to obtain two-factor auth mode');
  }
}
