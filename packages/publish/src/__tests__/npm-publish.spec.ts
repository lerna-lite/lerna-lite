jest.mock('read-package-json');
jest.mock('libnpmpublish');
jest.mock('fs-extra');

jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core'), // return the other real methods, below we'll mock only 2 of the methods
  otplease: (cb, opts) => Promise.resolve(cb(opts)),
  runLifecycle: jest.requireActual('../../../core/src/__mocks__/run-lifecycle').runLifecycle,
}));

// mocked modules
import fs from 'fs-extra';
import { publish } from 'libnpmpublish';
import readJSON from 'read-package-json';
import { runLifecycle, Package, RawManifest } from '@lerna-lite/core';

// helpers
import path from 'path';

// file under test
import { npmPublish } from '../lib/npm-publish';

describe('npm-publish', () => {
  const mockTarData = Buffer.from('MOCK');
  const mockManifest = { _normalized: true };

  (fs.readFile as any).mockName('fs.readFile').mockResolvedValue(mockTarData);
  (publish as any).mockName('libnpmpublish').mockResolvedValue();
  (readJSON as any).mockName('read-package-json').mockImplementation((file, cb) => cb(null, mockManifest));
  (runLifecycle as any).mockName('@lerna-lite/core').mockResolvedValue();

  const tarFilePath = '/tmp/test-1.10.100.tgz';
  const rootPath = path.normalize('/test');
  const pkg = new Package(
    { name: '@scope/test', version: '1.10.100' } as RawManifest,
    path.join(rootPath, 'npmPublish/test'),
    rootPath
  );

  it('calls external libraries with correct arguments', async () => {
    const opts = { tag: 'published-tag' };

    await npmPublish(pkg, tarFilePath, opts);

    expect(fs.readFile).toHaveBeenCalledWith(tarFilePath);
    expect(readJSON).toHaveBeenCalledWith(pkg.manifestLocation, expect.any(Function));
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
    (readJSON as any).mockImplementationOnce((file, cb) =>
      cb(null, {
        publishConfig: {
          tag: 'beta',
        },
      })
    );
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
    (readJSON as any).mockImplementationOnce((file, cb) =>
      cb(null, {
        publishConfig: {
          tag: 'beta',
        },
      })
    );

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
      path.join(rootPath, 'npmPublish/fancy'),
      rootPath
    );

    (readJSON as any).mockImplementationOnce((file, cb) =>
      cb(null, {
        name: 'fancy-fancy',
        version: '1.10.100',
      })
    );

    await npmPublish(fancyPkg, tarFilePath);

    expect(readJSON).toHaveBeenCalledWith(path.join(fancyPkg.location, 'dist/package.json'), expect.any(Function));
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
    (readJSON as any).mockImplementationOnce((file, cb) =>
      cb(null, {
        publishConfig: {
          registry: 'http://pkg-registry.com',
        },
      })
    );
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

  it('calls publish lifecycles', async () => {
    const options = expect.objectContaining({
      projectScope: '@scope',
    });

    await npmPublish(pkg, tarFilePath);

    expect(runLifecycle).toHaveBeenCalledWith(pkg, 'publish', options);
    expect(runLifecycle).toHaveBeenLastCalledWith(pkg, 'postpublish', options);
  });

  it('catches libnpm errors', async () => {
    (publish as any).mockImplementationOnce(() => {
      const err = new Error('whoopsy') as Error & { code: string; body: any };
      err.code = 'E401';
      err.body = {
        error: 'doodle',
      };
      return Promise.reject(err);
    });

    const log = {
      verbose: jest.fn(),
      silly: jest.fn(),
      error: jest.fn(),
    };
    const opts = { log };

    await expect(npmPublish(pkg, tarFilePath, opts as any)).rejects.toThrow(
      expect.objectContaining({
        message: 'whoopsy',
        name: 'ValidationError',
      })
    );

    expect(log.error).toHaveBeenLastCalledWith('E401', 'doodle');
    expect(process.exitCode).toBe(1);

    (publish as any).mockImplementationOnce(() => {
      const err = new Error('lolwut') as Error & { code: string; errno: any };
      err.code = 'E404';
      err.errno = 9001;
      return Promise.reject(err);
    });

    await expect(npmPublish(pkg, tarFilePath, opts as any)).rejects.toThrow('lolwut');

    expect(log.error).toHaveBeenLastCalledWith('E404', 'lolwut');
    expect(process.exitCode).toBe(9001);
  });
});
