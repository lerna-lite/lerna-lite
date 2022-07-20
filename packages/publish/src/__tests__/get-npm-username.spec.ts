jest.mock('npm-registry-fetch');

import fetch from 'npm-registry-fetch';
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { getNpmUsername } from '../lib/get-npm-username';
import { FetchConfig } from '@lerna-lite/core';

(fetch.json as any).mockImplementation(() => Promise.resolve({ username: 'lerna-test' }));

describe('getNpmUsername', () => {
  const origConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  test('fetches whoami endpoint after profile 404', async () => {
    (fetch.json as any).mockImplementationOnce(() => {
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
    (fetch.json as any).mockImplementationOnce(() => Promise.resolve({ username: undefined }));

    await expect(getNpmUsername({ stub: true } as unknown as FetchConfig)).rejects.toThrow(
      'You must be logged in to publish packages. Use `npm login` and try again.'
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  test('logs failure message before throwing validation error', async () => {
    (fetch.json as any).mockImplementationOnce(() => {
      const err = new Error('legacy npm Enterprise profile fail') as Error & { code: string };

      err.code = 'E500';

      return Promise.reject(err);
    });
    (fetch.json as any).mockImplementationOnce(() => {
      const err = new Error('third-party whoami fail') as Error & { code: string };

      err.code = 'E404';

      return Promise.reject(err);
    });

    const opts = { registry: 'https://registry.npmjs.org/' };

    await expect(getNpmUsername(opts as FetchConfig)).rejects.toThrow(
      'Authentication error. Use `npm whoami` to troubleshoot.'
    );
    expect(console.error).toHaveBeenCalledWith('third-party whoami fail');
  });

  test('allows third-party registries to fail with a stern warning', async () => {
    (fetch.json as any).mockImplementationOnce(() => {
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
