import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';

import { Conf, Defaults, Package, runLifecycle, type RawManifest } from '@lerna-lite/core';
import PackageJson from '@npmcli/package-json';
// @ts-ignore
import { publish } from 'libnpmpublish';
import npmFetch from 'npm-registry-fetch';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { LibNpmPublishOptions } from '../interfaces.js';
import { npmPublish } from '../lib/npm-publish.js';
import { oidc } from '../lib/oidc.js';

vi.mock('fs/promises');
vi.mock('libnpmpublish');
vi.mock('@npmcli/package-json');
vi.mock('../lib/oidc.js');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  otplease: (cb: (opts: any) => Promise<any>, opts: any) => Promise.resolve(cb(opts)),
  runLifecycle: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).runLifecycle,
}));

describe('npm-publish', () => {
  const mockTarData = Buffer.from('MOCK');
  const mockManifest = { _prepared: true, readmeFilename: 'README.md', _normalized: true };

  (readFile as Mock).mockName('readFile').mockResolvedValue(mockTarData);
  (publish as Mock).mockName('libnpmpublish').mockResolvedValue(null);
  (PackageJson.prepare as unknown as Mock).mockImplementation(() => ({ content: mockManifest }));
  (runLifecycle as Mock).mockName('@lerna-lite/core').mockResolvedValue(null);
  (oidc as Mock).mockName('oidc').mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it.each([
    [{ 'fetch-timeout': 60000 }, 60000],
    [{ 'fetch-timeout': 300000 }, 300000],
    [{ 'fetch-timeout': 60000, timeout: 45000 }, 45000],
  ])('passes the configured timeout to registry publishing and provenance signing: %j', async (options, timeout) => {
    await npmPublish(pkg, tarFilePath, options, conf);

    expect(publish).toHaveBeenCalledWith(mockManifest, mockTarData, expect.objectContaining({ timeout }));
  });

  it.each([
    [{}, 300000],
    [{ NPM_CONFIG_FETCH_TIMEOUT: '60000' }, 60000],
  ])('uses the npm timeout configuration when publishing: %j', async (env, timeout) => {
    const publishConf = new Conf(new Defaults().defaults);
    publishConf.addEnv(env);

    await npmPublish(pkg, tarFilePath, publishConf.snapshot, publishConf);

    expect(vi.mocked(publish).mock.lastCall?.[2].timeout).toBe(timeout);
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

  it('calls oidc authentication during dry-run', async () => {
    const opts = { dryRun: true };

    await npmPublish(pkg, tarFilePath, opts, conf);

    expect(oidc).toHaveBeenCalledWith({
      packageName: pkg.name,
      registry: 'https://registry.npmjs.org/',
      opts: expect.objectContaining({
        projectScope: '@scope',
      }),
      config: conf,
    });
    expect(publish).not.toHaveBeenCalled();
  });

  it('calls oidc authentication during normal publish', async () => {
    const opts = {};

    await npmPublish(pkg, tarFilePath, opts, conf);

    expect(oidc).toHaveBeenCalledWith({
      packageName: pkg.name,
      registry: 'https://registry.npmjs.org/',
      opts: expect.objectContaining({
        projectScope: '@scope',
      }),
      config: conf,
    });
    expect(publish).toHaveBeenCalled();
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

  it('passes stage option through to libnpmpublish', async () => {
    const opts = { stage: true };

    await npmPublish(pkg, tarFilePath, opts, conf);

    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.objectContaining({
        stage: true,
      })
    );
  });

  it('defaults stage to undefined when not provided', async () => {
    await npmPublish(pkg, tarFilePath, {}, conf);

    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.not.objectContaining({
        stage: true,
      })
    );
  });

  it('calls publish lifecycles with stdio inherit', async () => {
    const options = expect.objectContaining({
      projectScope: '@scope',
      stdio: 'inherit',
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

  describe('registry conflict verification', () => {
    const manifest = { name: '@scope/prepared-package', version: '2.0.0', publishConfig: { registry: 'https://publish.example.test/' } };

    beforeEach(() => {
      vi.spyOn(npmFetch, 'json').mockResolvedValue({ versions: { '2.0.0': manifest } });
      vi.mocked(PackageJson.prepare).mockResolvedValueOnce({ content: manifest } as never);
    });

    afterEach(() => vi.restoreAllMocks());

    it('verifies with the prepared manifest, publishConfig registry and publishing credentials', async () => {
      const error = Object.assign(new Error('Conflict'), { code: 'E409', method: 'PUT' });
      vi.mocked(publish).mockRejectedValueOnce(error);
      vi.mocked(oidc).mockImplementationOnce(async ({ opts }) => {
        opts['//publish.example.test/:_authToken'] = 'oidc-test-token';
      });

      await expect(npmPublish(pkg, tarFilePath, { registry: 'https://default.example.test/' }, conf)).rejects.toMatchObject({
        code: 'EPUBLISHCONFLICT',
        cause: error,
      });
      expect(npmFetch.json).toHaveBeenCalledWith(
        '@scope%2fprepared-package',
        expect.objectContaining({
          registry: 'https://publish.example.test/',
          '//publish.example.test/:_authToken': 'oidc-test-token',
        })
      );
      expect(runLifecycle).not.toHaveBeenCalled();
      expect(publish).toHaveBeenCalledTimes(1);
    });

    it.each(['missing', 'unavailable'])('preserves the original 409 when the version is %s', async (scenario) => {
      const error = Object.assign(new Error('original registry conflict'), { code: 'E409', method: 'PUT', body: null });
      vi.mocked(publish).mockRejectedValueOnce(error);
      if (scenario === 'missing') vi.mocked(npmFetch.json).mockResolvedValue({ versions: {} });
      else vi.mocked(npmFetch.json).mockRejectedValue(new Error('verification failed'));

      await expect(npmPublish(pkg, tarFilePath, {}, conf)).rejects.toBe(error);
      expect(runLifecycle).not.toHaveBeenCalled();
    });

    it('does not turn a publish lifecycle error into an existing-version skip', async () => {
      const error = Object.assign(new Error('lifecycle failed'), { code: 'E409' });
      vi.mocked(runLifecycle).mockRejectedValueOnce(error);

      await expect(npmPublish(pkg, tarFilePath, {}, conf)).rejects.toBe(error);
      expect(npmFetch.json).not.toHaveBeenCalled();
    });
  });

  describe('Sigstore transparency log conflict', () => {
    const tlogConflictError = Object.assign(new Error('error creating tlog entry'), {
      code: 'TLOG_CREATE_ENTRY_ERROR',
      cause: { statusCode: 409 },
    });

    afterEach(() => {
      vi.useRealTimers();
      (publish as Mock).mockReset().mockResolvedValue(null);
    });

    it('disables Sigstore request retries for generated provenance without changing registry retry settings', async () => {
      await npmPublish(pkg, tarFilePath, { provenance: true, fetchRetries: 4 }, conf);

      expect(vi.mocked(publish).mock.lastCall?.[2]).toEqual(expect.objectContaining({ provenance: true, retry: 0, fetchRetries: 4 }));
    });

    it('leaves explicit retry settings and non-provenance publishes unchanged', async () => {
      await npmPublish(pkg, tarFilePath, { provenance: true, retry: 5 }, conf);
      expect(vi.mocked(publish).mock.lastCall?.[2].retry).toBe(5);

      await npmPublish(pkg, tarFilePath, {}, conf);
      expect(vi.mocked(publish).mock.lastCall?.[2].retry).toBeUndefined();
    });

    it.each([
      { code: 'TLOG_CREATE_ENTRY_ERROR', cause: { code: 'FETCH_ERROR', type: 'request-timeout' } },
      { code: 'TLOG_CREATE_ENTRY_ERROR', cause: { code: 'ECONNRESET' } },
      { code: 'TLOG_CREATE_ENTRY_ERROR', cause: { statusCode: 503 } },
      { code: 'CA_CREATE_SIGNING_CERTIFICATE_ERROR', cause: { statusCode: 429 } },
    ])('retries transient provenance errors before publication: %j', async (details) => {
      vi.useFakeTimers();
      const error = Object.assign(new Error('signing failed'), details);
      (publish as Mock).mockRejectedValueOnce(error).mockResolvedValueOnce(null);

      const promise = npmPublish(pkg, tarFilePath, { provenance: true }, conf).catch((err) => err);
      await vi.runAllTimersAsync();
      await expect(promise).resolves.toBeNull();
      expect(publish).toHaveBeenCalledTimes(2);
      expect(runLifecycle).toHaveBeenCalledTimes(2);
    });

    it('stops after three transient signing failures without running publish lifecycle scripts', async () => {
      vi.useFakeTimers();
      const error = Object.assign(new Error('signing timed out'), {
        code: 'TLOG_CREATE_ENTRY_ERROR',
        cause: { type: 'request-timeout' },
      });
      (publish as Mock).mockRejectedValue(error);

      const promise = npmPublish(pkg, tarFilePath, { provenance: true }, conf).catch((err) => err);
      await vi.runAllTimersAsync();
      expect(await promise).toBe(error);
      expect(publish).toHaveBeenCalledTimes(3);
      expect(runLifecycle).not.toHaveBeenCalled();
    });

    it('retries publish when a tlog 409 conflict error occurs', async () => {
      vi.useFakeTimers();
      const result = { stageId: 'stage-after-retry', transparencyLogUrl: 'https://example.test/log' };
      (publish as Mock).mockRejectedValueOnce(tlogConflictError).mockResolvedValueOnce(result);

      const promise = npmPublish(pkg, tarFilePath, {}, conf);
      await vi.runAllTimersAsync();
      expect(await promise).toBe(result);

      expect(publish).toHaveBeenCalledTimes(2);
      expect(runLifecycle).toHaveBeenCalledTimes(2);
      expect(runLifecycle).toHaveBeenCalledWith(pkg, 'postpublish', expect.anything());
    });

    it('throws after reaching max retry attempts on repeated tlog 409 conflict errors', async () => {
      vi.useFakeTimers();
      (publish as Mock).mockRejectedValue(tlogConflictError);
      const startedAt = Date.now();

      const promise = npmPublish(pkg, tarFilePath, {}, conf).catch((err) => err);
      await vi.runAllTimersAsync();
      const error = await promise;

      expect(error).toBe(tlogConflictError);
      expect(publish).toHaveBeenCalledTimes(3);
      expect(Date.now() - startedAt).toBe(6000);
      expect(runLifecycle).not.toHaveBeenCalled();
      (publish as Mock).mockReset().mockResolvedValue(null);
    });

    it.each([
      { code: 'E403' },
      { code: 'E409', cause: { statusCode: 409 } },
      { code: 'TLOG_CREATE_ENTRY_ERROR', cause: { statusCode: 400 } },
      { code: 'CA_CREATE_SIGNING_CERTIFICATE_ERROR', cause: { statusCode: 403 } },
      { code: 'E500', statusCode: 500 },
      { code: 'TLOG_CREATE_ENTRY_ERROR' },
    ])('does not retry other publish errors: %j', async (details) => {
      const error = Object.assign(new Error('publish failed'), details);
      (publish as Mock).mockRejectedValueOnce(error);

      await expect(npmPublish(pkg, tarFilePath, {}, conf)).rejects.toBe(error);
      expect(publish).toHaveBeenCalledTimes(1);
    });
  });
});
