import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Conf, Package, type RawManifest } from '@lerna-lite/core';
import { publish } from 'libnpmpublish';
import npmFetch from 'npm-registry-fetch';
import { afterEach, expect, it, vi } from 'vitest';

import { npmPublish } from '../lib/npm-publish.js';

vi.mock('libnpmpublish', () => ({ publish: vi.fn() }));
vi.mock('../lib/oidc.js', () => ({ oidc: vi.fn() }));

const require = createRequire(import.meta.url);
const sigstoreRequire = createRequire(require.resolve('libnpmpublish'));
const sigstore = sigstoreRequire('sigstore') as {
  attest: (payload: Buffer, type: string, opts: Record<string, unknown>) => Promise<unknown>;
};

let closeServer = async () => {};
let tempDir: string | undefined;

afterEach(async () => {
  await closeServer();
  closeServer = async () => {};
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
  vi.resetAllMocks();
});

it('retries a timed-out Rekor submission with a new signature instead of resending the same entry', async () => {
  const entries: string[] = [];
  const keys: string[] = [];
  const certificate = '-----BEGIN CERTIFICATE-----\nAA==\n-----END CERTIFICATE-----';
  const token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from('{"sub":"test"}').toString('base64url')}.signature`;

  const server = createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => (body += chunk));
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url === '/api/v2/signingCert') {
        keys.push(JSON.parse(body).publicKeyRequest.publicKey.content);
        res.end(JSON.stringify({ signedCertificateEmbeddedSct: { chain: { certificates: [certificate] } } }));
      } else if (req.url === '/api/v1/log/entries') {
        const duplicate = entries.includes(body);
        entries.push(body);
        if (duplicate) {
          res.writeHead(409, { location: '/api/v1/log/entries/existing' });
          res.end(JSON.stringify({ message: 'entry already exists' }));
        } else {
          const reply = () => {
            res.writeHead(201);
            res.end(
              JSON.stringify({
                entry: {
                  body: Buffer.from(JSON.stringify({ kind: 'dsse', apiVersion: '0.0.1' })).toString('base64'),
                  integratedTime: 1,
                  logID: 'ab'.repeat(32),
                  logIndex: 1,
                  verification: { signedEntryTimestamp: Buffer.from('test').toString('base64') },
                },
              })
            );
          };
          if (entries.length === 1) setTimeout(reply, 600);
          else reply();
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  closeServer = () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Reproduce the upstream behavior: the timed-out request reached Rekor,
  // and Sigstore's request retry submits the identical entry and receives 409.
  await expect(
    sigstore.attest(Buffer.from('test payload'), 'application/vnd.in-toto+json', {
      fulcioURL: url,
      rekorURL: url,
      identityToken: token,
      timeout: 250,
      retry: 1,
    })
  ).rejects.toMatchObject({ code: 'TLOG_CREATE_ENTRY_ERROR', cause: { statusCode: 409 } });
  expect(entries).toHaveLength(2);
  expect(entries[0]).toBe(entries[1]);
  expect(keys).toHaveLength(1);
  entries.length = 0;
  keys.length = 0;

  tempDir = await mkdtemp(join(tmpdir(), 'lerna-provenance-test-'));
  const manifest = { name: 'provenance-test', version: '1.0.0' };
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(manifest));
  const tarball = join(tempDir, 'package.tgz');
  await writeFile(tarball, 'test tarball');
  const pkg = new Package(manifest as RawManifest, tempDir, tempDir);

  // Use the real Sigstore client while replacing the registry publish and
  // Fulcio/Rekor services with local test doubles. The certificate is synthetic.
  vi.mocked(publish).mockImplementation(async (_manifest, _tarball, opts) => {
    await sigstore.attest(Buffer.from('test payload'), 'application/vnd.in-toto+json', {
      ...opts,
      fulcioURL: url,
      rekorURL: url,
      identityToken: token,
    });
    return {} as Response;
  });

  await npmPublish(pkg, tarball, { provenance: true, timeout: 250 }, new Conf({}));

  expect(entries).toHaveLength(2);
  expect(entries[0]).not.toBe(entries[1]);
  expect(keys).toHaveLength(2);
  expect(keys[0]).not.toBe(keys[1]);
  expect(publish).toHaveBeenCalledTimes(2);
}, 15000);

it('preserves npm registry fetch retries when Sigstore request retries are disabled', async () => {
  let requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    res.writeHead(requests === 1 ? 503 : 200);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  closeServer = () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const response = await npmFetch(url, { method: 'PUT', body: '{}', retry: 0, fetchRetries: 1, fetchRetryMintimeout: 1 });

  expect(response.status).toBe(200);
  expect(requests).toBe(2);
});
