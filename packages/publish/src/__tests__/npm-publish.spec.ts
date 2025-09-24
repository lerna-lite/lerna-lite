import { describe, expect, it, Mock, vi } from 'vitest';

vi.mock('fs/promises');
vi.mock('libnpmpublish');
vi.mock('@npmcli/package-json');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  oidc: vi.fn().mockResolvedValue(undefined),
  otplease: (cb: (opts: any) => Promise<any>, opts: any) => Promise.resolve(cb(opts)),
  runLifecycle: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).runLifecycle,
}));

// mocked modules
// helpers
import { dirname, join, normalize } from 'node:path';

import { Conf, Package, RawManifest, runLifecycle } from '@lerna-lite/core';
import PackageJson from '@npmcli/package-json';
import { readFile } from 'fs/promises';
// @ts-ignore
import { publish } from 'libnpmpublish';

import { LibNpmPublishOptions } from '../interfaces.js';
// file under test
import { npmPublish } from '../lib/npm-publish.js';

describe('npm-publish', () => {
  const mockTarData = Buffer.from('MOCK');
  const mockManifest = { _prepared: true, readmeFilename: 'README.md', _normalized: true };

  (readFile as Mock).mockName('readFile').mockResolvedValue(mockTarData);
  (publish as Mock).mockName('libnpmpublish').mockResolvedValue(null);
  (PackageJson.prepare as unknown as Mock).mockImplementation(() => ({ content: mockManifest }));
  (runLifecycle as Mock).mockName('@lerna-lite/core').mockResolvedValue(null);

  const tarFilePath = '/tmp/test-1.10.100.tgz';
  const rootPath = normalize('/test');
  const pkg = new Package({ name: '@scope/test', version: '1.10.100' } as RawManifest, join(rootPath, 'npmPublish/test'), rootPath);
  const conf = new Conf({});

  it('calls external libraries with correct arguments', async () => {
    const opts = { tag: 'published-tag' };

    await npmPublish(pkg, tarFilePath, opts, conf);

    expect(readFile).toHaveBeenCalledWith(tarFilePath);
    expect(PackageJson.prepare).toHaveBeenCalledWith(dirname(pkg.manifestLocation));
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
    await npmPublish(pkg, tarFilePath, {}, conf);

    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.objectContaining({
        defaultTag: 'latest',
      })
    );
  });

  it('overrides pkg.publishConfig.tag when opts.tag is explicitly configured', async () => {
    (PackageJson.prepare as Mock).mockImplementationOnce(() => ({
      content: {
        publishConfig: {
          tag: 'beta',
        },
      },
    }));
    const opts = { tag: 'temp-tag' };

    await npmPublish(pkg, tarFilePath, opts, conf);

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
    (PackageJson.prepare as Mock).mockImplementationOnce(() => ({
      content: {
        publishConfig: {
          tag: 'beta',
        },
      },
    }));

    await npmPublish(pkg, tarFilePath, {}, conf);

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

    (PackageJson.prepare as Mock).mockImplementationOnce(() => ({
      content: {
        name: 'fancy-fancy',
        version: '1.10.100',
      },
    }));

    await npmPublish(fancyPkg, tarFilePath, {}, conf);

    expect(PackageJson.prepare).toHaveBeenCalledWith(join(fancyPkg.location, 'dist'));
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
    (PackageJson.prepare as Mock).mockImplementationOnce(() => ({
      content: {
        publishConfig: {
          registry: 'http://pkg-registry.com',
        },
      },
    }));
    const opts = { registry: 'https://global-registry.com' };

    await npmPublish(pkg, tarFilePath, opts, conf);

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

    await npmPublish(pkg, tarFilePath, opts, conf);

    expect(publish).not.toHaveBeenCalled();
    expect(runLifecycle).toHaveBeenCalledTimes(2);
  });

  it.each([['true'], [true], ['false'], [false]])('aliases strict-ssl to strictSSL', async (strictSSLValue) => {
    const opts = { 'strict-ssl': strictSSLValue } as Partial<LibNpmPublishOptions>;

    await npmPublish(pkg, tarFilePath, opts, conf);

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

    await npmPublish(pkg, tarFilePath, {}, conf);

    expect(runLifecycle).toHaveBeenCalledWith(pkg, 'publish', options);
    expect(runLifecycle).toHaveBeenLastCalledWith(pkg, 'postpublish', options);
  });

  it('ensures package.json is prepared and has readmeFilename added to it', async () => {
    await npmPublish(pkg, tarFilePath, {}, conf);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        _prepared: true,
        readmeFilename: 'README.md',
      }),
      expect.anything(),
      expect.anything()
    );
  });
});
