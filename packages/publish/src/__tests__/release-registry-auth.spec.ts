import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Package, type Conf, type RawManifest } from '@lerna-lite/core';
import PackageJson from '@npmcli/package-json';
import { afterEach, expect, it, vi } from 'vitest';

import { add, remove } from '../lib/npm-dist-tag.js';
import { npmPublish } from '../lib/npm-publish.js';
import { assertReleaseTags, manifestHash, readRegistryState, type ReleasePlanPackage } from '../lib/release-plan.js';

vi.mock('ci-info', () => ({ default: { GITHUB_ACTIONS: false, GITLAB: true, CIRCLE: false } }));
vi.mock('@lerna-lite/core', async (original) => ({ ...(await original<any>()), runLifecycle: vi.fn() }));

const servers: Server[] = [];
const folders: string[] = [];
const previousIdToken = process.env.NPM_ID_TOKEN;
afterEach(async () => {
  if (previousIdToken === undefined) delete process.env.NPM_ID_TOKEN;
  else process.env.NPM_ID_TOKEN = previousIdToken;
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        })
    )
  );
  await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});

async function registry(label: string) {
  const requests: { path: string; authorization?: string }[] = [];
  const docs = new Map<string, any>();
  const server = createServer(async (req, res) => {
    const path = new URL(req.url!, 'http://localhost').pathname;
    requests.push({ path, authorization: req.headers.authorization });
    res.setHeader('content-type', 'application/json');
    if (path.startsWith('/-/npm/v1/oidc/token/exchange/package/')) {
      if (req.headers.authorization !== 'Bearer test-id-token') {
        res.writeHead(401).end('{}');
      } else {
        res.writeHead(201).end(JSON.stringify({ token: `${label}-token` }));
      }
      return;
    }
    if (req.headers.authorization !== `Bearer ${label}-token`) {
      res.writeHead(401).end('{}');
      return;
    }
    const match = /^\/-\/package\/([^/]+)\/dist-tags(?:\/(.+))?$/.exec(path);
    if (match) {
      const doc = docs.get(decodeURIComponent(match[1]));
      if (!doc) {
        res.writeHead(404).end('{}');
        return;
      }
      const tag = match[2] && decodeURIComponent(match[2]);
      if (req.method === 'PUT') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        doc['dist-tags'][tag!] = JSON.parse(Buffer.concat(chunks).toString());
      } else if (req.method === 'DELETE') {
        delete doc['dist-tags'][tag!];
      }
      res.end(JSON.stringify(doc['dist-tags']));
      return;
    }
    const name = decodeURIComponent(path.slice(1));
    if (req.method === 'PUT') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      docs.set(name, JSON.parse(Buffer.concat(chunks).toString()));
      res.writeHead(201).end('{}');
    } else if (docs.has(name)) {
      res.end(JSON.stringify(docs.get(name)));
    } else {
      res.writeHead(404).end('{}');
    }
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${(server.address() as { port: number }).port}/`, requests };
}

it('uses isolated OIDC credentials and the effective registry for each planned package', async () => {
  process.env.NPM_ID_TOKEN = 'test-id-token';
  const first = await registry('first');
  const second = await registry('second');
  const root = await mkdtemp(join(tmpdir(), 'lerna-recovery-auth-'));
  folders.push(root);

  for (const [scope, target] of [
    ['alpha', first],
    ['beta', second],
  ] as const) {
    const directory = join(root, scope);
    await mkdir(directory);
    const manifest: RawManifest = { name: `@${scope}/pkg`, version: '1.0.0', publishConfig: { registry: target.url } } as RawManifest;
    await writeFile(join(directory, 'package.json'), JSON.stringify(manifest));
    const tarPath = join(directory, 'package.tgz');
    const bytes = Buffer.from(`tarball-${scope}`);
    await writeFile(tarPath, bytes);
    const prepared = (await PackageJson.prepare(directory)).content;
    const planned: ReleasePlanPackage = {
      name: manifest.name,
      version: manifest.version,
      registry: target.url,
      tag: 'latest',
      previousTag: null,
      previousTemporaryTag: null,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      manifestSha256: manifestHash(prepared),
    };
    const opts = { registry: target.url, '@alpha:registry': first.url, '@beta:registry': second.url };
    const conf = { set: vi.fn() } as unknown as Conf;
    await npmPublish(new Package(manifest, directory, root), tarPath, opts, conf, {}, planned);
    const authOpts = { ...opts, [`//127.0.0.1:${new URL(target.url).port}/:_authToken`]: `${scope === 'alpha' ? 'first' : 'second'}-token` };
    const state = await readRegistryState(planned, authOpts, tarPath);
    expect(state.published).toBe(true);
    await add(`${manifest.name}@1.0.0`, 'stable', authOpts, {}, (tags) => assertReleaseTags({ ...planned, tag: 'stable' }, tags, false));
    await remove(`${manifest.name}@1.0.0`, 'latest', authOpts, {}, '1.0.0');
    expect((await readRegistryState(planned, authOpts, tarPath)).tags).toEqual({ stable: '1.0.0' });
  }

  expect(first.requests.some(({ path, authorization }) => path.startsWith('/@alpha') && authorization === 'Bearer first-token')).toBe(true);
  expect(second.requests.some(({ path, authorization }) => path.startsWith('/@beta') && authorization === 'Bearer second-token')).toBe(true);
  expect(first.requests.every(({ authorization }) => authorization !== 'Bearer second-token')).toBe(true);
  expect(second.requests.every(({ authorization }) => authorization !== 'Bearer first-token')).toBe(true);
});
