import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { createServer, type IncomingHttpHeaders, type Server, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

interface FakeRegistry {
  authUrl: string;
  close: () => Promise<void>;
  donePolls: () => number;
  publishRequests: IncomingHttpHeaders[];
  registry: string;
}

describe('lerna-publish with web authentication', () => {
  let fixture: Fixture;
  let fakeRegistry: FakeRegistry;

  beforeEach(async () => {
    fakeRegistry = await createFakeRegistry();
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-publish-web-auth',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });
  });

  afterEach(async () => {
    await fixture.destroy();
    await fakeRegistry.close();
  });

  it('completes a registry web-auth challenge and retries publish with the returned OTP', async () => {
    await preparePublish('web-auth-e2e');

    const result = await runPublish('--auth-type web');

    expect(result.exitCode).toBe(0);
    expect(result.combinedOutput).toContain(fakeRegistry.authUrl);
    expect(fakeRegistry.donePolls()).toBe(2);
    expect(fakeRegistry.publishRequests).toHaveLength(2);
    expect(fakeRegistry.publishRequests[0]).toMatchObject({
      authorization: 'Bearer test-token',
      'npm-auth-type': 'web',
      'npm-command': 'publish',
    });
    expect(fakeRegistry.publishRequests[0]['npm-otp']).toBeUndefined();
    expect(fakeRegistry.publishRequests[1]).toMatchObject({
      'npm-auth-type': 'web',
      'npm-command': 'publish',
      'npm-otp': 'web-otp-token',
    });
  });

  it('uses legacy authentication when an OTP is supplied explicitly', async () => {
    await preparePublish('explicit-otp-e2e');

    const result = await runPublish('--auth-type web --otp 123456');

    expect(result.exitCode).toBe(0);
    expect(fakeRegistry.donePolls()).toBe(0);
    expect(fakeRegistry.publishRequests).toHaveLength(1);
    expect(fakeRegistry.publishRequests[0]).toMatchObject({
      'npm-auth-type': 'legacy',
      'npm-command': 'publish',
      'npm-otp': '123456',
    });
  });

  async function preparePublish(packageName: string): Promise<void> {
    await fixture.createPackage({ name: packageName, version: '1.0.0' });
    await writeFile(
      fixture.getWorkspacePath('.npmrc'),
      `registry=${fakeRegistry.registry}
//${new URL(fakeRegistry.registry).host}/:_authToken=test-token
browser=false
`
    );
    await fixture.createInitialGitCommit();
    await fixture.exec('git tag v1.0.0');
  }

  async function runPublish(args: string) {
    const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');
    const wrapperPath = fixture.getWorkspacePath('run-lerna-with-tty.mjs');
    await writeFile(
      wrapperPath,
      `Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: true });
await import(${JSON.stringify(pathToFileURL(lernaPath).href)});
`
    );

    return fixture.exec(`node ${wrapperPath} publish from-git --registry=${fakeRegistry.registry} -y ${args}`, {
      silenceError: true,
    });
  }
});

async function createFakeRegistry(): Promise<FakeRegistry> {
  const publishRequests: IncomingHttpHeaders[] = [];
  let donePolls = 0;
  let registry = '';

  const server = createServer((request, response) => {
    request.resume();
    request.once('end', () => {
      const url = new URL(request.url ?? '/', registry);

      if (request.method === 'GET' && url.pathname === '/-/web-auth/done') {
        donePolls++;
        if (donePolls === 1) {
          sendJson(response, 202, { pending: true }, { 'retry-after': '0.001' });
        } else {
          sendJson(response, 200, { token: 'web-otp-token' });
        }
        return;
      }

      if (request.method === 'PUT') {
        publishRequests.push(request.headers);

        if (request.headers['npm-otp'] || request.headers['npm-auth-type'] !== 'web') {
          sendJson(response, 201, { ok: true });
          return;
        }

        sendJson(
          response,
          401,
          {
            error: 'one-time pass required',
            authUrl: `${registry}-/web-auth/login`,
            doneUrl: `${registry}-/web-auth/done`,
          },
          { 'www-authenticate': 'OTP' }
        );
        return;
      }

      sendJson(response, 404, { error: 'not found' });
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Fake registry did not bind to a TCP port');
  }
  registry = `http://127.0.0.1:${address.port}/`;

  return {
    authUrl: `${registry}-/web-auth/login`,
    close: () => closeServer(server),
    donePolls: () => donePolls,
    publishRequests,
    registry,
  };
}

function sendJson(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  response.writeHead(status, { 'content-type': 'application/json', ...headers });
  response.end(JSON.stringify(body));
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
