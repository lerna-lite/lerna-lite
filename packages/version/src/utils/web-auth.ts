import childProcess from 'node:child_process';

import { log } from '@lerna-lite/npmlog';
import fetch from 'npm-registry-fetch';

export interface WebAuthChallenge {
  authUrl: string;
  doneUrl: string;
}

const DEFAULT_RETRY_DELAY_MS = 1000;

/** Return a browser-based authentication challenge from an npm EOTP error. */
export function getWebAuthChallenge(error: unknown): WebAuthChallenge | undefined {
  const { code, body } = (error ?? {}) as { code?: unknown; body?: unknown };

  if (code !== 'EOTP' || body === null || typeof body !== 'object') {
    return undefined;
  }

  const { authUrl, doneUrl } = body as { authUrl?: unknown; doneUrl?: unknown };

  if (!isHttpUrl(authUrl) || !isHttpUrl(doneUrl)) {
    return undefined;
  }

  return { authUrl, doneUrl };
}

/** Open the challenge in a browser, poll for its token, and return that token as an OTP. */
export async function getWebAuthOneTimePassword(
  { authUrl, doneUrl }: WebAuthChallenge,
  opts: Record<string, unknown>
): Promise<string> {
  log.notice('', 'This operation requires two-factor authentication. Authenticate your account at:');
  log.notice('', authUrl);

  // Browser opening is best-effort. The URL is printed first so users in SSH,
  // containers, or other headless environments can open it themselves.
  openInBrowser(authUrl, opts.browser);

  return pollForToken(doneUrl, opts);
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

function openInBrowser(url: string, browser: unknown): void {
  if (browser === false) {
    return;
  }

  const onError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    log.verbose('web-auth', `Unable to open browser automatically: ${message}`);
  };

  // The registry URL is passed as one argument. Encoding it prevents shell
  // metacharacters from being interpreted by the Windows `start` command.
  const target = encodeURI(url);

  try {
    const child =
      typeof browser === 'string'
        ? childProcess.spawn(browser, [target], { stdio: 'ignore', windowsHide: true })
        : process.platform === 'win32'
          ? childProcess.spawn('start', ['""', `"${target}"`], {
              shell: true,
              stdio: 'ignore',
              windowsHide: true,
            })
          : childProcess.spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [target], {
              stdio: 'ignore',
            });

    child.on('error', onError);
    child.on('exit', (code) => {
      if (code) {
        onError(new Error(`opener exited with code ${code}`));
      }
    });
    child.unref();
  } catch (error) {
    onError(error);
  }
}

async function pollForToken(doneUrl: string, opts: Record<string, unknown>): Promise<string> {
  while (true) {
    const response = await fetch(doneUrl, {
      ...opts,
      method: 'GET',
      // The challenge completion endpoint must never be served from cache.
      cache: false,
    } as fetch.FetchOptions);

    if (response.status === 200) {
      const content = (await response.json()) as { token?: unknown };

      if (typeof content.token !== 'string' || !content.token) {
        throw new Error(`Invalid response from ${doneUrl}: expected a token`);
      }

      return content.token;
    }

    if (response.status === 202) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : DEFAULT_RETRY_DELAY_MS;

      log.silly('web-auth', `authentication pending, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    throw new Error(`Invalid response from ${doneUrl}: unexpected status ${response.status}`);
  }
}
