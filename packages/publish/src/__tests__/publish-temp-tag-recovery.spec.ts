import { expect, it, vi } from 'vitest';

import { add, remove } from '../lib/npm-dist-tag.js';
import { npmPublish } from '../lib/npm-publish.js';
import { PublishCommand } from '../publish-command.js';

vi.mock('../lib/npm-dist-tag.js', () => ({ add: vi.fn(), remove: vi.fn() }));
vi.mock('../lib/npm-publish.js', () => ({ npmPublish: vi.fn() }));
vi.mock('../lib/log-packed.js', () => ({ logPacked: vi.fn() }));

it.each(['option', 'publishConfig'])('keeps lerna-temp when it is the destination tag from %s', async (source) => {
  const tracker = { addWork: vi.fn(), showProgress: vi.fn(), success: vi.fn(), completeWork: vi.fn(), finish: vi.fn() };
  const command = {
    logger: { newItem: () => tracker },
    packagesToPublish: [{ name: 'example', version: '1.2.3', get: () => ({ tag: 'lerna-temp' }) }],
    conf: { snapshot: { tag: source === 'option' ? 'lerna-temp' : 'latest' } },
    options: {},
    otpCache: {},
    getPreDistTag: vi.fn(),
  } as unknown as PublishCommand;

  await PublishCommand.prototype.npmUpdateAsLatest.call(command);

  expect(add).toHaveBeenCalledWith('example@1.2.3', 'lerna-temp', expect.anything(), expect.anything());
  expect(remove).not.toHaveBeenCalled();
});

it('keeps the temporary tag when promotion fails and can retry promotion', async () => {
  const error = new Error('registry unavailable');
  vi.mocked(add).mockRejectedValueOnce(error).mockResolvedValueOnce({});
  vi.mocked(remove).mockResolvedValue({});
  const tracker = { addWork: vi.fn(), showProgress: vi.fn(), success: vi.fn(), completeWork: vi.fn(), finish: vi.fn() };
  const pkg = { name: 'example', version: '1.2.3', get: vi.fn() };
  const command = {
    logger: { newItem: () => tracker },
    packagesToPublish: [pkg],
    conf: { snapshot: { tag: 'latest' } },
    options: {},
    otpCache: {},
    getPreDistTag: vi.fn(),
  } as unknown as PublishCommand;

  await expect(PublishCommand.prototype.npmUpdateAsLatest.call(command)).rejects.toBe(error);
  expect(remove).not.toHaveBeenCalled();

  await expect(PublishCommand.prototype.npmUpdateAsLatest.call(command)).resolves.toBeDefined();
  expect(add).toHaveBeenLastCalledWith('example@1.2.3', 'latest', expect.anything(), expect.anything());
  expect(remove).toHaveBeenLastCalledWith('example@1.2.3', 'lerna-temp', expect.anything(), expect.anything(), '1.2.3');
});

it('retries a partially published tagged selection and promotes every selected package', async () => {
  vi.mocked(add).mockClear();
  vi.mocked(remove).mockClear();
  const tracker = {
    addWork: vi.fn(),
    showProgress: vi.fn(),
    success: vi.fn(),
    completeWork: vi.fn(),
    finish: vi.fn(),
    warn: vi.fn(),
  };
  const packages = ['first', 'bootstrap', 'last'].map((name) => ({
    name,
    version: '1.2.3',
    get: vi.fn(),
    packed: { tarFilePath: `${name}.tgz` },
  }));
  const published = new Set<string>();
  let trustedPublisherConfigured = false;
  vi.mocked(npmPublish).mockImplementation(async (pkg) => {
    if (published.has(pkg.name)) throw Object.assign(new Error('already published'), { code: 'EPUBLISHCONFLICT' });
    if (pkg.name === 'bootstrap' && !trustedPublisherConfigured) throw Object.assign(new Error('forbidden'), { code: 'E403' });
    published.add(pkg.name);
    return undefined;
  });
  const command = {
    logger: { newItem: () => tracker, silly: vi.fn(), warn: vi.fn(), error: vi.fn() },
    packagesToPublish: packages,
    conf: {
      get snapshot() {
        return { tag: 'latest' };
      },
    },
    options: { tempTag: true, dryRun: true },
    otpCache: {},
    getPreDistTag: vi.fn(),
    concurrency: 1,
    hasRootedLeaf: true,
    stageIds: new Map(),
  } as unknown as PublishCommand;

  const previousExitCode = process.exitCode;
  try {
    await expect(PublishCommand.prototype.publishPacked.call(command)).rejects.toMatchObject({ code: 'E403' });
    expect([...published]).toEqual(['first']);
    expect(add).not.toHaveBeenCalled();
    published.add('bootstrap'); // The maintainer bootstraps the new package and configures trusted publishing.
    trustedPublisherConfigured = true;

    await PublishCommand.prototype.publishPacked.call(command);
    await PublishCommand.prototype.npmUpdateAsLatest.call(command);

    expect([...published]).toEqual(['first', 'bootstrap', 'last']);
    for (const pkg of packages) {
      expect(add).toHaveBeenCalledWith(`${pkg.name}@1.2.3`, 'latest', expect.anything(), expect.anything());
      expect(remove).toHaveBeenCalledWith(`${pkg.name}@1.2.3`, 'lerna-temp', expect.anything(), expect.anything(), '1.2.3');
    }
  } finally {
    process.exitCode = previousExitCode;
  }
});
