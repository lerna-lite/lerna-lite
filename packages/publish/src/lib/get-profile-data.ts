import fetch from 'npm-registry-fetch';

import { FetchConfig, ProfileData, pulseTillDone } from '@lerna-lite/core';


/**
 * Retrieve profile data of logged-in user.
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {Promise<ProfileData>}
 */
export async function getProfileData(opts: FetchConfig): Promise<ProfileData> {
  opts.log.verbose('', 'Retrieving npm user profile');

  const data: ProfileData = await pulseTillDone(await fetch.json('/-/npm/v1/user', opts));
  opts.log.silly('npm profile get', 'received %j', data);

  return Object.assign(
    // remap to match legacy whoami format
    { username: data.name },
    data
  ) as ProfileData;
}
