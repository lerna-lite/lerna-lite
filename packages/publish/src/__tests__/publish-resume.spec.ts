import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import PackageJson from '@npmcli/package-json';
import npmFetch from 'npm-registry-fetch';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getCurrentSHA } from '../lib/get-current-sha.js';
import { add, remove } from '../lib/npm-dist-tag.js';
import { npmPublish } from '../lib/npm-publish.js';
import { PublishCommand } from '../publish-command.js';

vi.mock('@lerna-lite/core', async (original) => ({ ...(await original<any>()), describeRef: vi.fn(async () => ({ isDirty: false })) }));
vi.mock('@npmcli/package-json', () => ({ default: { prepare: vi.fn() } }));
vi.mock('npm-registry-fetch', async (original) => {
  const actual = await original<any>();
  return { ...actual, default: Object.assign(() => {}, actual.default, { json: vi.fn() }) };
});
vi.mock('../lib/get-current-sha.js', () => ({ getCurrentSHA: vi.fn(() => 'a'.repeat(40)) }));
vi.mock('../lib/oidc.js', () => ({ oidc: vi.fn() }));
vi.mock('../lib/npm-publish.js', () => ({ npmPublish: vi.fn() }));
vi.mock('../lib/npm-dist-tag.js', () => ({ add: vi.fn(), remove: vi.fn() }));
vi.mock('../lib/log-packed.js', () => ({ logPacked: vi.fn() }));
vi.mock('../lib/get-packed.js', () => ({ getPacked: vi.fn(async (_pkg, path) => ({ tarFilePath: path })) }));

let root: string;
let packages: any[];
let registry: Record<string, { versions: Record<string, any>; 'dist-tags': Record<string, string> }>;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'publish-resume-'));
  packages = ['first', 'second'].map((name) => ({
    name,
    version: '1.0.0',
    contents: name,
    get: () => undefined,
    packed: { tarFilePath: join(root, `${name}.tgz`) },
  }));
  await Promise.all(packages.map((pkg) => writeFile(pkg.packed.tarFilePath, pkg.name)));
  registry = Object.fromEntries(packages.map((pkg) => [pkg.name, { versions: {}, 'dist-tags': { latest: '0.9.0' } }]));
  vi.mocked(PackageJson.prepare).mockImplementation(async (path: any) => ({ content: { name: path, version: '1.0.0' } }) as any);
  vi.mocked(npmFetch.json).mockImplementation(async (url: any) => structuredClone(registry[new URL(url).pathname.slice(1)]) as any);
  vi.mocked(npmPublish).mockImplementation(async (pkg, _path, opts) => {
    registry[pkg.name].versions[pkg.version] = {
      name: pkg.name,
      version: pkg.version,
      dist: { integrity: `sha512-${createHash('sha512').update(pkg.name).digest('base64')}` },
    };
    registry[pkg.name]['dist-tags'][opts!.tag as string] = pkg.version;
  });
  vi.mocked(add).mockImplementation(async (spec, tag) => {
    const [name, version] = spec.split('@');
    registry[name]['dist-tags'][tag!] = version;
    return registry[name]['dist-tags'];
  });
  vi.mocked(remove).mockImplementation(async (spec, tag) => {
    delete registry[spec.split('@')[0]]['dist-tags'][tag];
    return {};
  });
});

afterEach(async () => {
  process.exitCode = 0;
  await rm(root, { recursive: true, force: true });
});

function command(resume = false): PublishCommand {
  const tracker = { addWork: vi.fn(), showProgress: vi.fn(), success: vi.fn(), completeWork: vi.fn(), finish: vi.fn(), warn: vi.fn(), info: vi.fn() };
  const cmd = Object.assign(Object.create(PublishCommand.prototype), {
    options: resume ? { resume: 'release.json' } : { releasePlan: 'release.json', tempTag: true },
    project: { rootPath: root },
    execOpts: { cwd: root },
    packageGraph: new Map(packages.map((pkg) => [pkg.name, { name: pkg.name, version: pkg.version, pkg }])),
    packagesToPublish: packages,
    publishedPackages: [],
    alreadyPublished: new Set(),
    acceptedExisting: new Set(),
    stageIds: new Map(),
    conf: { snapshot: { registry: 'https://registry.example.test/', tag: 'latest' }, get: () => 'latest' },
    otpCache: {},
    concurrency: 1,
    hasRootedLeaf: true,
    logger: { newItem: () => tracker, info: vi.fn(), notice: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn(), silly: vi.fn() },
  });
  for (const method of [
    'enableProgressBar',
    'prepareRegistryActions',
    'prepareLicenseActions',
    'resolveLocalDependencyLinks',
    'resolveDependencyWithCatalogProtocols',
    'resolveLocalDependencyWorkspaceProtocols',
    'applyPublishConfigOverrides',
    'annotateGitHead',
    'serializeChanges',
    'packUpdated',
  ])
    cmd[method] = vi.fn();
  return cmd;
}

it.each([true, false])('resumes a partially published release in a fresh command (tempTag=%s)', async (tempTag) => {
  const publish = vi.mocked(npmPublish).getMockImplementation()!;
  vi.mocked(npmPublish).mockImplementation(async (...args) => {
    if (args[0].name === 'second') throw Object.assign(new Error('missing trusted publisher'), { code: 'E403' });
    return publish(...args);
  });
  const initial = command();
  initial.options.tempTag = tempTag;
  await expect(initial.execute()).rejects.toThrow('missing trusted publisher');
  expect(registry.first.versions['1.0.0']).toBeDefined();
  expect(registry.second.versions['1.0.0']).toBeUndefined();
  expect(JSON.parse(await readFile(join(root, 'release.json'), 'utf8')).packages).toHaveLength(2);

  process.exitCode = 0;
  vi.mocked(npmPublish).mockClear().mockImplementation(publish);
  const retry = command(true);
  await retry.detectResume();
  await retry.execute();
  expect(npmPublish).toHaveBeenCalledTimes(1);
  expect(vi.mocked(npmPublish).mock.calls[0][0].name).toBe('second');
  expect(Object.values(registry).map((pkg) => pkg['dist-tags'])).toEqual([{ latest: '1.0.0' }, { latest: '1.0.0' }]);

  vi.mocked(npmPublish).mockClear();
  const complete = command(true);
  await complete.detectResume();
  await complete.execute();
  expect(npmPublish).not.toHaveBeenCalled();
});

it('rejects a different commit before executing the release', async () => {
  await command().prepareReleasePlan();
  vi.mocked(getCurrentSHA).mockReturnValueOnce('c'.repeat(40));
  await expect(command(true).detectResume()).rejects.toThrow('Git commit');
});

it('resumes pending tag promotion when all versions were already uploaded', async () => {
  const promote = vi.mocked(add).getMockImplementation()!;
  vi.mocked(add).mockImplementation(async (...args) => {
    if (args[0].startsWith('second@')) throw new Error('tag update failed');
    return promote(...args);
  });
  await expect(command().execute()).rejects.toThrow('tag update failed');
  expect(registry.second['dist-tags']['lerna-temp']).toBe('1.0.0');
  vi.mocked(add).mockImplementation(promote);
  vi.mocked(npmPublish).mockClear();
  const retry = command(true);
  await retry.detectResume();
  await retry.execute();
  expect(npmPublish).not.toHaveBeenCalled();
  expect(Object.values(registry).map((pkg) => pkg['dist-tags'])).toEqual([{ latest: '1.0.0' }, { latest: '1.0.0' }]);
});

it('does not persist authentication settings in the release plan', async () => {
  const cmd = command();
  cmd.conf.snapshot['//registry.example.test/:_authToken'] = 'secret-token';
  await cmd.prepareReleasePlan();
  expect(await readFile(join(root, 'release.json'), 'utf8')).not.toContain('secret-token');
});

it('rejects changed artifacts and conflicting newer tags before uploading', async () => {
  await command().prepareReleasePlan();
  const retry = command(true);
  await retry.detectResume();
  await writeFile(packages[1].packed.tarFilePath, 'different build');
  const saved = JSON.parse(await readFile(join(root, 'release.json'), 'utf8'));
  const archive = join(root, 'release.json.artifacts', `${saved.packages[1].sha256}.tgz`);
  await writeFile(archive, 'tampered archive');
  await expect(retry.execute()).rejects.toThrow('Archived tarball differs');
  expect(npmPublish).not.toHaveBeenCalled();
  await writeFile(packages[1].packed.tarFilePath, packages[1].name);
  registry.first['dist-tags'].latest = '2.0.0';
  await expect(retry.execute()).rejects.toThrow('Refusing to overwrite');
  expect(npmPublish).not.toHaveBeenCalled();
});

it('rechecks each package before uploading if another release changes a tag', async () => {
  const upload = vi.mocked(npmPublish).getMockImplementation()!;
  vi.mocked(npmPublish).mockImplementation(async (...args) => {
    const result = await upload(...args);
    if (args[0].name === 'first') registry.second['dist-tags'].latest = '2.0.0';
    return result;
  });
  await expect(command().execute()).rejects.toThrow('Refusing to overwrite');
  expect(vi.mocked(npmPublish).mock.calls.map(([pkg]) => pkg.name)).toEqual(['first']);
  expect(registry.second['dist-tags'].latest).toBe('2.0.0');
});

it('uses the original archived artifact when a rebuild differs', async () => {
  await command().prepareReleasePlan();
  const retry = command(true);
  await retry.detectResume();
  await writeFile(packages[1].packed.tarFilePath, 'nondeterministic rebuild');
  await retry.execute();
  const secondUpload = vi.mocked(npmPublish).mock.calls.find(([pkg]) => pkg.name === 'second');
  expect(secondUpload?.[1]).toContain('release.json.artifacts');
  expect(await readFile(secondUpload![1], 'utf8')).toBe('second');
});

it('requires an archived artifact only when the rebuilt tarball differs', async () => {
  await command().prepareReleasePlan();
  await rm(join(root, 'release.json.artifacts'), { recursive: true });
  const retry = command(true);
  await retry.detectResume();
  await writeFile(packages[1].packed.tarFilePath, 'changed');
  await expect(retry.execute()).rejects.toThrow('original archived tarball is missing');
  expect(npmPublish).not.toHaveBeenCalled();
  await writeFile(packages[1].packed.tarFilePath, packages[1].name);
  await retry.execute();
  expect(npmPublish).toHaveBeenCalledTimes(2);
});

it('does not treat different published bytes as a completed package', async () => {
  await command().prepareReleasePlan();
  registry.first.versions['1.0.0'] = {
    name: 'first',
    version: '1.0.0',
    dist: { integrity: `sha512-${createHash('sha512').update('different').digest('base64')}` },
  };
  const retry = command(true);
  await retry.detectResume();
  await expect(retry.execute()).rejects.toThrow('Published artifact does not match');
  expect(npmPublish).not.toHaveBeenCalled();
  expect(add).not.toHaveBeenCalled();
});

it('resumes after an explicitly accepted manual publication with different bytes', async () => {
  await command().prepareReleasePlan();
  registry.first.versions['1.0.0'] = {
    name: 'first',
    version: '1.0.0',
    dist: { integrity: `sha512-${createHash('sha512').update('manual').digest('base64')}` },
  };
  registry.first['dist-tags'].latest = '1.0.0';
  const retry = command(true);
  retry.options.resumeAllowExisting = ['first@1.0.0'];
  await retry.detectResume();
  await retry.execute();
  expect(npmPublish).toHaveBeenCalledTimes(1);
  expect(vi.mocked(npmPublish).mock.calls[0][0].name).toBe('second');
  expect(Object.values(registry).map((pkg) => pkg['dist-tags'])).toEqual([{ latest: '1.0.0' }, { latest: '1.0.0' }]);
});

it('rejects accepting a version outside the plan or one absent from the registry', async () => {
  await command().prepareReleasePlan();
  const invalid = command(true);
  invalid.options.resumeAllowExisting = ['first@2.0.0'];
  await expect(invalid.detectResume()).rejects.toThrow('must exactly match');
  const missing = command(true);
  missing.options.resumeAllowExisting = ['first@1.0.0'];
  await missing.detectResume();
  await expect(missing.execute()).rejects.toThrow('to exist in the registry');
  expect(npmPublish).not.toHaveBeenCalled();
});

it('rejects combining resume with version selection', () => {
  const retry = command(true);
  retry.options.bump = 'patch';
  expect(() => retry.initialize()).toThrow('--resume cannot be combined');
});
