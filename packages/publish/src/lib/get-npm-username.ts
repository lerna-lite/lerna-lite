import { getFetchConfig } from './fetch-config';
import { getProfileData } from './get-profile-data';
import { getWhoAmI } from './get-whoami';
import { FetchConfig, ValidationError } from '@lerna-lite/core';

/**
 * Retrieve username of logged-in user.
 * @param {import("./fetch-config").FetchConfig} options
 * @returns {Promise<string>}
 */
export function getNpmUsername(options: FetchConfig): Promise<string | undefined> {
  const opts = getFetchConfig(options, {
    // don't wait forever for third-party failures to be dealt with
    fetchRetries: 0,
  });

  opts.log.info('', 'Verifying npm credentials');

  return getProfileData(opts)
    .catch((err) => {
      // Many third-party registries do not implement the user endpoint
      // Legacy npm Enterprise returns E500 instead of E404
      if (err.code === 'E500' || err.code === 'E404') {
        return getWhoAmI(opts);
      }

      // re-throw 401 Unauthorized (and all other unexpected errors)
      throw err;
    })
    .then(success, failure);

  function success(result) {
    opts.log.silly('get npm username', 'received %j', result);

    if (!result.username) {
      throw new ValidationError(
        'ENEEDAUTH',
        'You must be logged in to publish packages. Use `npm login` and try again.'
      );
    }

    return result.username;
  }

  // catch request errors, not auth expired errors
  function failure(err) {
    // Log the error cleanly to stderr
    opts.log.pause();
    console.error(err.message); // eslint-disable-line no-console
    opts.log.resume();

    if (opts.registry === 'https://registry.npmjs.org/') {
      throw new ValidationError('EWHOAMI', 'Authentication error. Use `npm whoami` to troubleshoot.');
    }

    opts.log.warn(
      'EWHOAMI',
      'Unable to determine npm username from third-party registry, this command will likely fail soon!'
    );
  }
}
