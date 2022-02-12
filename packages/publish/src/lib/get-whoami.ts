import fetch from 'npm-registry-fetch';

import { FetchConfig, pulseTillDone } from '@lerna-lite/core';

interface WhoIAm {
  username: string;
}

/**
 * Retrieve logged-in user's username via legacy API.
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {WhoIAm}
 */
export async function getWhoAmI(opts: FetchConfig): Promise<WhoIAm> {
  opts.log.verbose('', 'Retrieving npm username');

  const data = pulseTillDone(await fetch.json('/-/whoami', opts));
  opts.log.silly('npm whoami', 'received %j', data);

  return data;
}
