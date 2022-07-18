jest.mock('../lib/get-profile-data');

import { FetchConfig } from '@lerna-lite/core';
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { getProfileData } from '../lib/get-profile-data';
import { getTwoFactorAuthRequired } from '../lib/get-two-factor-auth-required';

(getProfileData as any).mockImplementation(() => Promise.resolve({ tfa: {} }));

describe('getTwoFactorAuthRequired', () => {
  const origConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  it("resolves true if tfa.mode === 'auth-and-writes'", async () => {
    (getProfileData as any).mockResolvedValueOnce({
      tfa: {
        mode: 'auth-and-writes',
      },
    });

    const result = await getTwoFactorAuthRequired();
    expect(result).toBe(true);
    expect(getProfileData).toHaveBeenLastCalledWith(expect.objectContaining({ fetchRetries: 0 }));
  });

  it("resolves false if tfa.mode !== 'auth-and-writes'", async () => {
    (getProfileData as any).mockResolvedValueOnce({
      tfa: {
        mode: 'auth-only',
      },
    });

    const result = await getTwoFactorAuthRequired();
    expect(result).toBe(false);
  });

  it('resolves false if tfa.pending === true', async () => {
    (getProfileData as any).mockResolvedValueOnce({
      tfa: {
        pending: true,
        mode: 'ignored',
      },
    });

    const result = await getTwoFactorAuthRequired();
    expect(result).toBe(false);
  });

  it('resolves false after profile 404', async () => {
    (getProfileData as any).mockImplementationOnce(() => {
      const err = new Error('third-party profile fail') as Error & { code: string };

      err.code = 'E404';

      return Promise.reject(err);
    });

    const result = await getTwoFactorAuthRequired();

    expect(result).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('resolves false after profile 500', async () => {
    (getProfileData as any).mockImplementationOnce(() => {
      const err = new Error('legacy npm Enterprise profile fail') as Error & { code: string };

      err.code = 'E500';

      return Promise.reject(err);
    });

    const opts = { registry: 'such-registry-wow' };
    const result = await getTwoFactorAuthRequired(opts as FetchConfig);

    expect(result).toBe(false);
    expect(loggingOutput('warn')).toContain(
      `Registry "${opts.registry}" does not support 'npm profile get', skipping two-factor auth check...`
    );
  });

  it('logs unexpected failure message before throwing validation error', async () => {
    (getProfileData as any).mockImplementationOnce(() => {
      const err = new Error('zomg explosions') as Error & { code: string };

      err.code = 'E401';

      return Promise.reject(err);
    });

    await expect(getTwoFactorAuthRequired()).rejects.toThrow('Unable to obtain two-factor auth mode');
    expect(console.error).toHaveBeenCalledWith('zomg explosions');
  });
});
