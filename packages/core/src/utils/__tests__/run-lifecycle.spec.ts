import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('@npmcli/run-script', () => ({
  default: vi.fn(() => Promise.resolve({ stdout: '' })),
}));

import log from 'npmlog';
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import runScript from '@npmcli/run-script';

import { npmConf } from '../npm-conf';
import { Package } from '../../package';
import { runLifecycle, createRunner } from '../run-lifecycle';
import { LifecycleConfig } from '../../models';

describe('runLifecycle()', () => {
  beforeEach(() => {
    log.level = 'silent';
  });

  it('skips packages without scripts', async () => {
    const pkg = {
      name: 'no-scripts',
    };

    await runLifecycle(pkg as Package, 'foo', new Map() as any);

    expect(runScript).not.toHaveBeenCalled();
  });

  it('skips packages without matching script', async () => {
    const pkg = {
      name: 'missing-script',
      scripts: {
        test: 'foo',
      },
    };

    await runLifecycle(pkg as Package, 'bar', new Map() as any);

    expect(runScript).not.toHaveBeenCalled();
  });

  it('calls npm-lifecycle with prepared arguments', async () => {
    const pkg = new Package(
      {
        name: 'test-name',
        version: '1.0.0-test',
        scripts: {
          preversion: 'test',
        },
        engines: {
          node: '>= 8.9.0',
        },
      } as unknown as Package,
      '/test/location'
    );
    const stage = 'preversion';
    const opts = npmConf({ 'custom-cli-flag': true }) as unknown as LifecycleConfig;

    await runLifecycle(pkg as Package, stage, opts);

    expect(runScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pkg: expect.objectContaining({
          name: pkg.name,
          version: pkg.version,
          engines: {
            node: '>= 8.9.0',
          },
          _id: `${pkg.name}@${pkg.version}`,
        }),
        event: stage,
        path: pkg.location,
        args: [],
      })
    );
  });

  it('calls npm-lifecycle with prepared arguments and expect print banner be called and show a console log of the ran script', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementationOnce(() => {});
    log.level = 'info';
    const pkg = new Package(
      {
        name: 'test-name',
        version: '1.0.0-test',
        scripts: {
          preversion: 'test',
        },
        engines: {
          node: '>= 8.9.0',
        },
      } as unknown as Package,
      '/test/location'
    );
    const stage = 'preversion';
    const opts = npmConf({ 'custom-cli-flag': true });

    await runLifecycle(pkg as Package, stage, opts as unknown as LifecycleConfig);

    expect(consoleSpy).toHaveBeenCalledWith(`\n> test-name@1.0.0-test preversion /test/location\n> test\n`);
  });

  it('passes through the value for script-shell from npm config', async () => {
    const pkg = {
      name: 'dashed-name',
      version: '1.0.0-dashed',
      location: 'dashed-location',
      scripts: {
        'dashed-options': 'test',
      },
    };
    const dir = pkg.location;
    const stage = 'dashed-options';
    const opts = {
      'script-shell': 'fish',
    };

    await runLifecycle(pkg as Package, stage, opts as unknown as LifecycleConfig);

    expect(runScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        event: stage,
        path: dir,
        args: [],
        scriptShell: 'fish',
      })
    );
  });

  it('ignores prepublish when configured', async () => {
    const pkg = {
      name: 'ignore-prepublish',
      scripts: {
        prepublish: 'test',
      },
    };
    const stage = 'prepublish';
    const opts = {
      'ignore-prepublish': true,
    };

    await runLifecycle(pkg as Package, stage, opts as unknown as LifecycleConfig);

    expect(runScript).not.toHaveBeenCalled();
  });

  it('ignores scripts when configured', async () => {
    const pkg = {
      name: 'ignore-scripts',
      scripts: {
        ignored: 'test',
      },
    };
    const stage = 'ignored';
    const opts = {
      'ignore-scripts': true,
    };

    await runLifecycle(pkg as Package, stage, opts as unknown as LifecycleConfig);

    expect(runScript).not.toHaveBeenCalled();
  });

  it('omits circular opts', async () => {
    const pkg = {
      name: 'circular-name',
      version: '1.0.0-circular',
      location: 'circular-location',
      scripts: {
        prepack: 'test',
      },
    };
    const stage = 'prepack';
    const opts = {};

    await runLifecycle(pkg as Package, stage, opts as unknown as LifecycleConfig);

    const callOpts = (runScript as any).mock.calls.pop().pop();

    expect(callOpts).not.toHaveProperty('config.log');
    expect(callOpts).not.toHaveProperty('config.logstream');
  });
});

describe('createRunner', () => {
  const runPackageLifecycle = createRunner({ 'other-cli-flag': 0 });

  it('skips missing scripts block', async () => {
    const pkg = {
      name: 'missing-scripts-block',
      version: '1.0.0',
      location: 'test',
    };

    await runPackageLifecycle(pkg as Package, 'prepare');
    expect(runScript).not.toHaveBeenCalled();
  });

  it('skips missing script', async () => {
    const pkg = {
      name: 'missing-script',
      version: '1.0.0',
      location: 'test',
      scripts: { test: 'echo foo' },
    };

    await runPackageLifecycle(pkg as Package, 'prepare');
    expect(runScript).not.toHaveBeenCalled();
  });

  it('logs stdout from runScript() response', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementationOnce(() => {});
    (runScript as unknown as Mock).mockImplementationOnce(() => {
      return Promise.resolve({ stdout: 'runScript output' });
    });

    const pkg = {
      name: 'has-script-error',
      version: '1.0.0',
      location: 'test',
      scripts: { prepublishOnly: 'exit 123' },
    };

    await runPackageLifecycle(pkg as Package, 'prepublishOnly');

    expect(consoleSpy).toHaveBeenCalledWith('runScript output');
  });

  it('logs script error and re-throws', async () => {
    vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
    (runScript as unknown as Mock).mockImplementationOnce(({ pkg, event }) => {
      const err: any = new Error('boom');

      err.code = 123;
      err.script = pkg.scripts[event];

      return Promise.reject(err);
    });

    const pkg = {
      name: 'has-script-error',
      version: '1.0.0',
      location: 'test',
      scripts: { prepublishOnly: 'exit 123' },
    };

    await expect(runPackageLifecycle(pkg as Package, 'prepublishOnly')).rejects.toThrow(
      expect.objectContaining({
        exitCode: 123,
        script: 'exit 123',
      })
    );
    expect(process.exitCode).toBe(123);

    const [errorLog] = loggingOutput('error');
    expect(errorLog).toBe(`"prepublishOnly" errored in "has-script-error", exiting 123`);

    // reset exit code
    process.exitCode = undefined;
  });

  it('defaults error exit code to 1', async () => {
    vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
    (runScript as unknown as Mock).mockImplementationOnce(({ pkg, event }) => {
      const err: any = new Error('kersplode');

      // errno only gets added when a proc closes, not from error
      err.script = pkg.scripts[event];

      return Promise.reject(err);
    });

    const pkg = {
      name: 'has-execution-error',
      version: '1.0.0',
      location: 'test',
      scripts: { prepack: 'a-thing-that-ends-poorly' },
    };

    await expect(runPackageLifecycle(pkg as Package, 'prepack')).rejects.toThrow(
      expect.objectContaining({
        exitCode: 1,
        script: 'a-thing-that-ends-poorly',
      })
    );

    const [errorLog] = loggingOutput('error');
    expect(errorLog).toBe(`"prepack" errored in "has-execution-error", exiting 1`);

    // reset exit code
    process.exitCode = undefined;
  });
});
