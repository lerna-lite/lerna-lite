// @ts-ignore
import fetch from 'npm-registry-fetch';
import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import type { FetchConfig } from '@lerna-lite/core';

import { loggingOutput } from '@lerna-test/helpers/logging-output.js';

import { getNpmUsername } from '../lib/get-npm-username.js';

vi.mock('npm-registry-fetch');

(fetch.json as unknown as Mock).mockImplementation(() => Promise.resolve({ username: 'lerna-test' }));

describe('getNpmUsername', () => {
  const origConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  test('fetches whoami endpoint after profile 404', async () => {
    (fetch.json as unknown as Mock).mockImplementationOnce(() => {
      const err = new Error('third-party profile fail') as Error & { code: string };

      err.code = 'E404';

      return Promise.reject(err);
    });
    const opts = { registry: 'such-config-wow' };

    const username = await getNpmUsername(opts as FetchConfig);

    expect(username).toBe('lerna-test');
    expect(fetch.json).toHaveBeenLastCalledWith('/-/whoami', expect.objectContaining({ fetchRetries: 0 }));
  });

  test('throws an error when successful fetch yields empty username', async () => {
    (fetch.json as unknown as Mock).mockImplementationOnce(() => Promise.resolve({ username: undefined }));

    await expect(getNpmUsername({ stub: true } as unknown as FetchConfig)).rejects.toThrow(
      'You must be logged in to publish packages. Use `npm login` and try again.'
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  test('logs failure message before throwing validation error', async () => {
    (fetch.json as unknown as Mock).mockImplementationOnce(() => {
      const err = new Error('legacy npm Enterprise profile fail') as Error & { code: string };

      err.code = 'E500';

      return Promise.reject(err);
    });
    (fetch.json as unknown as Mock).mockImplementationOnce(() => {
      const err = new Error('third-party whoami fail') as Error & { code: string };

      err.code = 'E404';

      return Promise.reject(err);
    });

    const opts = { registry: 'https://registry.npmjs.org/' };

    await expect(getNpmUsername(opts as FetchConfig)).rejects.toThrow('Authentication error. Use `npm whoami` to troubleshoot.');
    expect(console.error).toHaveBeenCalledWith('third-party whoami fail');
  });

  test('logs failure message when npm returns forbidden response', async () => {
    (fetch.json as unknown as Mock).mockImplementationOnce(() => {
      const err = new Error('npm profile fail due to insufficient permissions') as Error & { code: string };

      err.code = 'E403';

      return Promise.reject(err);
    });

    const opts = { registry: 'https://registry.npmjs.org/' } as FetchConfig;

    await expect(getNpmUsername(opts)).rejects.toThrow(
      'Access verification failed. Ensure that your npm access token has both read and write access, or remove the verifyAccess option to skip this verification. Note that npm automation tokens do NOT have read access (https://docs.npmjs.com/creating-and-viewing-access-tokens).'
    );
    expect(console.error).toHaveBeenCalledWith('npm profile fail due to insufficient permissions');
  });

  test('allows third-party registries to fail with a stern warning', async () => {
    (fetch.json as unknown as Mock).mockImplementationOnce(() => {
      const err = new Error('many third-party registries do not support npm whoami') as Error & { code: string };

      err.code = 'E401';

      return Promise.reject(err);
    });

    const opts = { registry: 'http://my-own-private-idaho.com' };

    const username = await getNpmUsername(opts as FetchConfig);

    expect(username).toBeUndefined();
    expect(loggingOutput('warn')).toContain(
      'Unable to determine npm username from third-party registry, this command will likely fail soon!'
    );
  });
});
