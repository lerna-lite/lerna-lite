import { describe, expect, it, Mock, vi } from 'vitest';

vi.mock('fs/promises');
vi.mock('libnpmpublish');
vi.mock('@npmcli/package-json');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  otplease: (cb, opts) => Promise.resolve(cb(opts)),
  runLifecycle: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).runLifecycle,
}));

// mocked modules
import { readFile } from 'fs/promises';
import { publish } from 'libnpmpublish';
import PackageJson from '@npmcli/package-json';
import { runLifecycle, Package, RawManifest } from '@lerna-lite/core';

// helpers
import { dirname, join, normalize } from 'node:path';

// file under test
import { npmPublish } from '../lib/npm-publish.js';
import { LibNpmPublishOptions } from '../models/index.js';

describe('npm-publish', () => {
  const mockTarData = Buffer.from('MOCK');
  const mockManifest = { _normalized: true };

  (readFile as Mock).mockName('readFile').mockResolvedValue(mockTarData);
  (publish as Mock).mockName('libnpmpublish').mockResolvedValue(null);
  (PackageJson.load as unknown as Mock).mockImplementation(() => ({ content: mockManifest }));
  (runLifecycle as Mock).mockName('@lerna-lite/core').mockResolvedValue(null);

  const tarFilePath = '/tmp/test-1.10.100.tgz';
  const rootPath = normalize('/test');
  const pkg = new Package({ name: '@scope/test', version: '1.10.100' } as RawManifest, join(rootPath, 'npmPublish/test'), rootPath);

  it('calls external libraries with correct arguments', async () => {
    const opts = { tag: 'published-tag' };

    await npmPublish(pkg, tarFilePath, opts);

    expect(readFile).toHaveBeenCalledWith(tarFilePath);
    expect(PackageJson.load).toHaveBeenCalledWith(dirname(pkg.manifestLocation));
    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.objectContaining({
        defaultTag: 'published-tag',
        projectScope: '@scope',
      })
    );
  });

  it("defaults opts.tag to 'latest'", async () => {
    await npmPublish(pkg, tarFilePath, {});

    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.objectContaining({
        defaultTag: 'latest',
      })
    );
  });

  it('overrides pkg.publishConfig.tag when opts.tag is explicitly configured', async () => {
    PackageJson.load.mockImplementationOnce(() => ({
      content: {
        publishConfig: {
          tag: 'beta',
        },
      },
    }));
    const opts = { tag: 'temp-tag' };

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          tag: 'temp-tag',
        },
      }),
      mockTarData,
      expect.objectContaining({
        defaultTag: 'temp-tag',
      })
    );
  });

  it('respects pkg.publishConfig.tag when opts.defaultTag matches default', async () => {
    PackageJson.load.mockImplementationOnce(() => ({
      content: {
        publishConfig: {
          tag: 'beta',
        },
      },
    }));

    await npmPublish(pkg, tarFilePath);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          tag: 'beta',
        },
      }),
      mockTarData,
      expect.objectContaining({
        defaultTag: 'beta',
      })
    );
  });

  it('uses pkg.contents manifest when pkg.publishConfig.directory is defined', async () => {
    const fancyPkg = new Package(
      {
        name: 'fancy',
        version: '1.10.100',
        publishConfig: {
          directory: 'dist',
        },
      } as RawManifest,
      join(rootPath, 'npmPublish/fancy'),
      rootPath
    );

    PackageJson.load.mockImplementationOnce(() => ({
      content: {
        name: 'fancy-fancy',
        version: '1.10.100',
      },
    }));

    await npmPublish(fancyPkg, tarFilePath);

    expect(PackageJson.load).toHaveBeenCalledWith(join(fancyPkg.location, 'dist'));
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'fancy-fancy',
      }),
      mockTarData,
      expect.objectContaining({
        defaultTag: 'latest',
      })
    );
  });

  it('merges pkg.publishConfig.registry into options', async () => {
    PackageJson.load.mockImplementationOnce(() => ({
      content: {
        publishConfig: {
          registry: 'http://pkg-registry.com',
        },
      },
    }));
    const opts = { registry: 'https://global-registry.com' };

    await npmPublish(pkg, tarFilePath, opts as any);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          registry: 'http://pkg-registry.com',
        },
      }),
      mockTarData,
      expect.objectContaining({
        registry: 'http://pkg-registry.com',
      })
    );
  });

  it('respects opts.dryRun', async () => {
    const opts = { dryRun: true };

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).not.toHaveBeenCalled();
    expect(runLifecycle).toHaveBeenCalledTimes(2);
  });

  it.each([['true'], [true], ['false'], [false]])('aliases strict-ssl to strictSSL', async (strictSSLValue) => {
    const opts = { 'strict-ssl': strictSSLValue } as Partial<LibNpmPublishOptions>;

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        strictSSL: strictSSLValue,
      })
    );
  });

  it('calls publish lifecycles', async () => {
    const options = expect.objectContaining({
      projectScope: '@scope',
    });

    await npmPublish(pkg, tarFilePath);

    expect(runLifecycle).toHaveBeenCalledWith(pkg, 'publish', options);
    expect(runLifecycle).toHaveBeenLastCalledWith(pkg, 'postpublish', options);
  });
});
