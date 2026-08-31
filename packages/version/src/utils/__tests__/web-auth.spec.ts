import childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';

import { log } from '@lerna-lite/npmlog';
import fetch from 'npm-registry-fetch';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { getWebAuthChallenge, getWebAuthOneTimePassword } from '../web-auth.js';

vi.mock('npm-registry-fetch');

const mockedFetch = fetch as unknown as Mock;

type FakeChild = EventEmitter & { unref: Mock };
let spawnSpy: ReturnType<typeof vi.spyOn>;
let spawnedChildren: FakeChild[];

function fakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.unref = vi.fn();
  spawnedChildren.push(child);
  return child;
}

function response(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return {
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  };
}

describe('web-auth', () => {
  beforeEach(() => {
    spawnedChildren = [];
    spawnSpy = vi.spyOn(childProcess, 'spawn').mockImplementation(() => fakeChild() as never);
  });

  afterEach(() => {
    spawnSpy.mockRestore();
    vi.resetAllMocks();
  });

  describe('getWebAuthChallenge()', () => {
    const authUrl = 'https://www.npmjs.com/auth/cli/abc123';
    const doneUrl = 'https://registry.npmjs.org/-/v1/done?sessionId=abc123';

    it('returns a valid challenge from an EOTP error', () => {
      const error = Object.assign(new Error('OTP required for authentication'), {
        code: 'EOTP',
        body: { authUrl, doneUrl },
      });

      expect(getWebAuthChallenge(error)).toEqual({ authUrl, doneUrl });
    });

    it('rejects incomplete, unsafe, and non-EOTP challenges', () => {
      expect(getWebAuthChallenge({ code: 'EOTP', body: { authUrl } })).toBeUndefined();
      expect(getWebAuthChallenge({ code: 'EOTP', body: { authUrl: 'javascript:alert(1)', doneUrl } })).toBeUndefined();
      expect(getWebAuthChallenge({ code: 'E404', body: { authUrl, doneUrl } })).toBeUndefined();
      expect(getWebAuthChallenge(undefined)).toBeUndefined();
    });
  });

  describe('getWebAuthOneTimePassword()', () => {
    const challenge = {
      authUrl: 'https://www.npmjs.com/auth/cli/abc123',
      doneUrl: 'https://registry.npmjs.org/-/v1/done?sessionId=abc123',
    };
    const opts = {
      registry: 'https://registry.npmjs.org/',
      '//registry.npmjs.org/:_authToken': 'token',
    };

    it('opens the authentication URL and polls until a token is returned', async () => {
      mockedFetch
        .mockResolvedValueOnce(response(202, undefined, { 'retry-after': '0.001' }))
        .mockResolvedValueOnce(response(200, { token: 'web-otp-token' }));

      await expect(getWebAuthOneTimePassword(challenge, opts)).resolves.toBe('web-otp-token');

      expect(spawnSpy).toHaveBeenCalledTimes(1);
      expect(spawnedChildren[0].unref).toHaveBeenCalled();
      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(mockedFetch).toHaveBeenLastCalledWith(challenge.doneUrl, expect.objectContaining({ ...opts, method: 'GET', cache: false }));
    });

    it('does not open a browser when npm browser config is false', async () => {
      mockedFetch.mockResolvedValueOnce(response(200, { token: 'web-otp-token' }));

      await expect(getWebAuthOneTimePassword(challenge, { ...opts, browser: false })).resolves.toBe('web-otp-token');

      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it('uses a configured browser command', async () => {
      mockedFetch.mockResolvedValueOnce(response(200, { token: 'web-otp-token' }));

      await getWebAuthOneTimePassword(challenge, { ...opts, browser: 'firefox' });

      expect(spawnSpy).toHaveBeenCalledWith('firefox', [challenge.authUrl], expect.objectContaining({ stdio: 'ignore', windowsHide: true }));
    });

    it('does not fail or change the exit code when the browser opener fails', async () => {
      const verbose = vi.spyOn(log, 'verbose').mockImplementation(() => log);
      const exitCode = process.exitCode;
      mockedFetch.mockResolvedValueOnce(response(200, { token: 'web-otp-token' }));

      const pending = getWebAuthOneTimePassword(challenge, opts);
      spawnedChildren[0].emit('error', Object.assign(new Error('spawn xdg-open ENOENT'), { code: 'ENOENT' }));

      await expect(pending).resolves.toBe('web-otp-token');
      expect(process.exitCode).toBe(exitCode);
      expect(verbose).toHaveBeenCalledWith('web-auth', expect.stringContaining('ENOENT'));
    });

    it('does not fail when spawning the browser throws synchronously', async () => {
      spawnSpy.mockImplementation(() => {
        throw new Error('EACCES');
      });
      mockedFetch.mockResolvedValueOnce(response(200, { token: 'web-otp-token' }));

      await expect(getWebAuthOneTimePassword(challenge, opts)).resolves.toBe('web-otp-token');
    });

    it('rejects a successful response without a token', async () => {
      mockedFetch.mockResolvedValueOnce(response(200, { nope: true }));

      await expect(getWebAuthOneTimePassword(challenge, opts)).rejects.toThrow('expected a token');
    });

    it('rejects an unexpected response status', async () => {
      mockedFetch.mockResolvedValueOnce(response(204));

      await expect(getWebAuthOneTimePassword(challenge, opts)).rejects.toThrow('unexpected status 204');
    });
  });
});
