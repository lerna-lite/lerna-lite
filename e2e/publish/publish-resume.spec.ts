import { createHash } from 'node:crypto';
import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import type PackageJsonType from '@npmcli/package-json';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

let fixture: Fixture;
let server: Server | undefined;
beforeEach(async () => {
  fixture = await Fixture.create({
    e2eRoot: process.env.E2E_ROOT!,
    name: 'publish-resume',
    packageManager: 'npm',
    initializeGit: true,
    lernaInit: true,
    installDependencies: false,
  });
  await fixture.createPackage({ name: 'release-first', version: '1.0.0' });
  await fixture.createPackage({ name: 'release-second', version: '1.0.0' });
  await fixture.createInitialGitCommit();
  await fixture.exec('git tag v1.0.0');
});
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
  await fixture.destroy();
});

it('rejects a different release commit in a dry-run before reaching the registry', async () => {
  await writeFile(
    fixture.getWorkspacePath('release.json'),
    JSON.stringify({
      schemaVersion: 1,
      gitHead: '0'.repeat(40),
      tempTag: true,
      packages: [
        {
          name: 'release-first',
          version: '1.0.0',
          registry: 'http://127.0.0.1:1/',
          tag: 'latest',
          previousTag: null,
          previousTemporaryTag: null,
          sha256: '0'.repeat(64),
          manifestSha256: '0'.repeat(64),
        },
      ],
    })
  );
  const result = await fixture.lerna('publish --resume release.json --dry-run -y', { silenceError: true });
  expect(result.exitCode).not.toBe(0);
  expect(result.combinedOutput).toContain('ERESUME');
  expect(result.combinedOutput).toContain('Git commit');
});

it('validates rebuilt release artifacts in a fresh checkout without publishing', async () => {
  server = createServer((_req, res) => {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end('{}');
  });
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  const registry = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
  const temp = fixture.getWorkspacePath('packed-artifacts');
  await mkdir(temp);
  const env = { TMPDIR: temp, TMP: temp, TEMP: temp };
  await fixture.lerna(`publish from-git --release-plan release.json --registry=${registry} --dry-run --ignore-scripts -y`, { env });
  const head = (await fixture.exec('git rev-parse HEAD')).stdout.trim();
  const require = createRequire(join(process.cwd(), 'packages/publish/package.json'));
  const PackageJson = require('@npmcli/package-json') as typeof PackageJsonType;
  const packedFolders = (await readdir(temp)).filter((entry) => entry.startsWith('lerna-'));
  const packedFiles = await Promise.all(packedFolders.map(async (folder) => ({ folder, files: await readdir(join(temp, folder)) })));
  const entries = await Promise.all(
    ['release-first', 'release-second'].map(async (name) => {
      const folder = packedFiles.find((entry) => entry.files.includes(`${name}-1.0.0.tgz`))?.folder;
      expect(folder).toBeDefined();
      const bytes = await readFile(join(temp, folder!, `${name}-1.0.0.tgz`));
      const manifest = (await PackageJson.prepare(fixture.getWorkspacePath(`packages/${name}`))).content;
      return {
        name,
        version: '1.0.0',
        registry,
        tag: 'latest',
        previousTag: null,
        previousTemporaryTag: null,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        manifestSha256: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
      };
    })
  );
  await fixture.exec('git clone --no-hardlinks . recovered');
  const recovered = fixture.getWorkspacePath('recovered');
  await writeFile(join(recovered, 'release.json'), JSON.stringify({ schemaVersion: 1, gitHead: head, tempTag: false, packages: entries }));
  await mkdir(join(recovered, 'release.json.artifacts'));
  for (const entry of entries) {
    const folder = packedFiles.find((item) => item.files.includes(`${entry.name}-1.0.0.tgz`))!.folder;
    await copyFile(join(temp, folder, `${entry.name}-1.0.0.tgz`), join(recovered, 'release.json.artifacts', `${entry.sha256}.tgz`));
  }
  await writeFile(join(recovered, 'packages/release-second/nondeterministic.js'), 'new build output');
  const result = await fixture.lerna(`publish --resume release.json --registry=${registry} --dry-run --ignore-scripts -y`, { cwd: recovered });
  expect(result.exitCode).toBe(0);
  expect(result.combinedOutput).toContain('Using the archived tarball for release-second');
  expect((await fixture.exec('git rev-parse HEAD', { cwd: recovered })).stdout.trim()).toBe(head);
});

it('resumes missing versions and pending tags from a fresh checkout after a partial upload', async () => {
  const documents = new Map<string, any>();
  const uploads: string[] = [];
  let rejectSecond = true;
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url!, 'http://localhost').pathname;
      res.setHeader('content-type', 'application/json');
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const raw = Buffer.concat(chunks);
      const body = raw.length ? JSON.parse((req.headers['content-encoding'] === 'gzip' ? gunzipSync(raw) : raw).toString()) : undefined;
      const tagsMatch = /^\/-\/package\/([^/]+)\/dist-tags(?:\/(.+))?$/.exec(path);
      if (tagsMatch) {
        const doc = documents.get(decodeURIComponent(tagsMatch[1]));
        if (!doc) {
          res.statusCode = 404;
          res.end('{}');
          return;
        }
        const tag = tagsMatch[2] && decodeURIComponent(tagsMatch[2]);
        if (req.method === 'PUT') doc['dist-tags'][tag!] = body;
        if (req.method === 'DELETE') delete doc['dist-tags'][tag!];
        res.end(JSON.stringify(doc['dist-tags']));
        return;
      }
      const name = decodeURIComponent(path.slice(1));
      if (req.method === 'PUT') {
        if (name === 'release-second' && rejectSecond) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'simulated publish authorization failure' }));
          return;
        }
        uploads.push(name);
        documents.set(name, body);
        res.statusCode = 201;
        res.end('{}');
      } else if (documents.has(name)) {
        res.end(JSON.stringify(documents.get(name)));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    } catch {
      res.statusCode = 500;
      res.end('{}');
    }
  });
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const registry = `http://127.0.0.1:${address.port}/`;
  const options = `--registry=${registry} --no-sort --concurrency=1 --ignore-scripts -y`;
  const failed = await fixture.lerna(`publish from-git --release-plan release.json --temp-tag ${options}`, { silenceError: true });
  expect(failed.exitCode).not.toBe(0);
  expect(uploads).toEqual(['release-first']);
  const plan = await fixture.readWorkspaceFile('release.json');
  const head = (await fixture.exec('git rev-parse HEAD')).stdout.trim();

  await fixture.exec('git clone --no-hardlinks . recovered');
  const recovered = fixture.getWorkspacePath('recovered');
  await writeFile(fixture.getWorkspacePath('recovered/release.json'), plan);
  await cp(fixture.getWorkspacePath('release.json.artifacts'), join(recovered, 'release.json.artifacts'), { recursive: true });
  rejectSecond = false;
  await fixture.lerna(`publish --resume release.json ${options}`, { cwd: recovered });
  expect(uploads).toEqual(['release-first', 'release-second']);
  expect([...documents.values()].map((doc) => doc['dist-tags'])).toEqual([{ latest: '1.0.0' }, { latest: '1.0.0' }]);
  expect((await fixture.exec('git rev-parse HEAD', { cwd: recovered })).stdout.trim()).toBe(head);
  await fixture.lerna(`publish --resume release.json ${options}`, { cwd: recovered });
  expect(uploads).toEqual(['release-first', 'release-second']);
});
