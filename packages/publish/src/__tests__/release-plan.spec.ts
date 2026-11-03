import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import npmFetch from 'npm-registry-fetch';
import { afterEach, expect, it, vi } from 'vitest';

import {
  archiveTarball,
  archivedTarballPath,
  assertReleaseTags,
  readRegistryState,
  readReleasePlan,
  registryUrl,
  tarballHash,
  writeReleasePlan,
  type ReleasePlan,
} from '../lib/release-plan.js';

vi.mock('npm-registry-fetch');

const plan: ReleasePlan = {
  schemaVersion: 1,
  gitHead: 'a'.repeat(40),
  tempTag: true,
  packages: [
    {
      name: 'example',
      version: '1.0.1',
      registry: 'https://registry.example.test/',
      tag: 'latest',
      previousTag: '1.0.0',
      previousTemporaryTag: null,
      sha256: 'b'.repeat(64),
      manifestSha256: 'c'.repeat(64),
    },
  ],
};
const folders: string[] = [];
afterEach(async () => {
  await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});

it('persists an immutable plan that can be read in a fresh run', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'release-plan-'));
  folders.push(folder);
  const path = join(folder, 'release.json');
  await writeReleasePlan(path, plan);
  expect(await readReleasePlan(path)).toEqual(plan);
  await expect(writeReleasePlan(path, plan)).rejects.toMatchObject({ code: 'EEXIST' });
});

it('rejects duplicate packages and unsupported plan versions', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'release-plan-'));
  folders.push(folder);
  const path = join(folder, 'release.json');
  await writeFile(path, JSON.stringify({ ...plan, packages: [...plan.packages, ...plan.packages] }));
  await expect(readReleasePlan(path)).rejects.toThrow('duplicate');
  await writeFile(path, JSON.stringify({ ...plan, schemaVersion: 2 }));
  await expect(readReleasePlan(path)).rejects.toThrow('unsupported');
});

it.each(['https://user:secret@registry.example.test/', 'https://registry.example.test/?token=secret', 'file:///tmp/registry'])(
  'rejects unsafe registry URL %s',
  (url) => {
    expect(() => registryUrl(url)).toThrow('registry URL');
  }
);

it('detects changed tarball contents', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'release-plan-'));
  folders.push(folder);
  const path = join(folder, 'package.tgz');
  await writeFile(path, 'first');
  const hash = await tarballHash(path);
  await writeFile(path, 'second');
  expect(await tarballHash(path)).not.toBe(hash);
});

it('preserves archived release bytes and refuses to overwrite a conflicting archive', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'release-plan-'));
  folders.push(folder);
  const path = join(folder, 'release.json');
  const source = join(folder, 'package.tgz');
  await writeFile(source, 'original');
  const hash = await tarballHash(source);
  await archiveTarball(path, hash, source);
  await archiveTarball(path, hash, source);
  await writeFile(archivedTarballPath(path, hash), 'tampered');
  await expect(archiveTarball(path, hash, source)).rejects.toMatchObject({ code: 'EEXIST' });
});

it('accepts original and completed tag states but rejects another release', () => {
  const pkg = plan.packages[0];
  expect(() => assertReleaseTags(pkg, { latest: '1.0.0', 'lerna-temp': '1.0.1' }, true)).not.toThrow();
  expect(() => assertReleaseTags(pkg, { latest: '1.0.1' }, true)).not.toThrow();
  expect(() => assertReleaseTags({ ...pkg, previousTemporaryTag: '0.9.0' }, { latest: '1.0.1' }, true)).not.toThrow();
  expect(() => assertReleaseTags(pkg, { latest: '2.0.0' }, true)).toThrow('Refusing to overwrite');
  expect(() => assertReleaseTags(pkg, { latest: '1.0.0', 'lerna-temp': '2.0.0' }, true)).toThrow('Refusing to overwrite');
});

it('checks exact versions without consulting cached metadata', async () => {
  vi.mocked(npmFetch.json).mockResolvedValueOnce({ versions: { '1.0.1': { name: 'example', version: '1.0.1' } }, 'dist-tags': { latest: '1.0.1' } });
  expect(await readRegistryState(plan.packages[0], {})).toEqual({ published: true, tags: { latest: '1.0.1' } });
  expect(npmFetch.json).toHaveBeenCalledWith(
    'https://registry.example.test/example',
    expect.objectContaining({ cache: false, offline: false, preferOnline: true })
  );
});

it('treats only 404 as an absent package and propagates authentication/network errors', async () => {
  vi.mocked(npmFetch.json).mockRejectedValueOnce({ code: 'E404' });
  expect(await readRegistryState(plan.packages[0], {})).toEqual({ published: false, tags: {} });
  for (const code of ['E401', 'E403', 'ETIMEDOUT']) {
    const error = Object.assign(new Error(code), { code });
    vi.mocked(npmFetch.json).mockRejectedValueOnce(error);
    await expect(readRegistryState(plan.packages[0], {})).rejects.toBe(error);
  }
});
