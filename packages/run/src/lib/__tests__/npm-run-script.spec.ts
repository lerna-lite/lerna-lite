
// mocked modules
jest.mock('@lerna-lite/core');
import { exec, spawnStreaming } from '@lerna-lite/core';
import { RunScriptOption, ScriptStreamingOption } from '../../models';

// file under test
import { npmRunScript, npmRunScriptStreaming } from '../npm-run-script';

describe('npm-run-script', () => {
  (exec as any).mockResolvedValue();
  (spawnStreaming as any).mockResolvedValue();

  describe('npmRunScript()', () => {
    it('runs an npm script in a directory', async () => {
      const script = 'foo';
      const config = {
        args: ['--bar', 'baz'],
        pkg: {
          location: '/test/npm/run/script',
        },
        npmClient: 'npm',
      } as RunScriptOption;

      await npmRunScript(script, config);

      expect(exec).toHaveBeenLastCalledWith('npm', ['run', script, '--bar', 'baz'], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: true,
        windowsHide: false,
      }, false);
    });

    it('runs of a dry-run an npm script in a directory', async () => {
      const script = 'foo';
      const config = {
        args: ['--bar', 'baz'],
        pkg: {
          location: '/test/npm/run/script',
        },
        npmClient: 'npm',
      } as RunScriptOption;

      await npmRunScript(script, config, true);

      expect(exec).toHaveBeenLastCalledWith('npm', ['run', script, '--bar', 'baz'], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: true,
        windowsHide: false,
      }, true);
    });

    it('accepts opts.reject', async () => {
      const script = 'foo';
      const config = {
        args: [],
        pkg: {
          location: '/test/npm/run/script',
        },
        npmClient: 'npm',
        reject: false,
      } as RunScriptOption;

      await npmRunScript(script, config);

      expect(exec).toHaveBeenLastCalledWith('npm', ['run', script], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: false,
        windowsHide: false,
      }, false);
    });

    it('supports a different npmClient', async () => {
      const script = 'foo';
      const config = {
        args: ['--bar', 'baz'],
        pkg: {
          location: '/test/npm/run/script',
        },
        npmClient: 'yarn',
      } as RunScriptOption;

      await npmRunScript(script, config);

      expect(exec).toHaveBeenLastCalledWith('yarn', ['run', script, '--bar', 'baz'], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: true,
        windowsHide: false,
      }, false);
    });
  });

  describe('npmRunScriptStreaming()', () => {
    it('runs an npm script in a package with streaming', async () => {
      const script = 'foo';
      const config = {
        args: ['--bar', 'baz'],
        pkg: {
          name: 'qux',
          location: '/test/npm/run/script/stream',
        },
        prefix: true,
        npmClient: 'npm',
      } as ScriptStreamingOption;

      await npmRunScriptStreaming(script, config);

      expect(spawnStreaming).toHaveBeenLastCalledWith(
        'npm',
        ['run', script, '--bar', 'baz'],
        {
          cwd: config.pkg.location,
          env: {},
          pkg: config.pkg,
          reject: true,
          windowsHide: false,
        },
        config.pkg.name,
        false
      );
    });

    it('run a dry-run of an npm script in a package with streaming', async () => {
      const script = 'foo';
      const config = {
        args: ['--bar', 'baz'],
        pkg: {
          name: 'qux',
          location: '/test/npm/run/script/stream',
        },
        prefix: true,
        npmClient: 'npm',
      } as ScriptStreamingOption;

      await npmRunScriptStreaming(script, config, true);

      expect(spawnStreaming).toHaveBeenLastCalledWith(
        'npm',
        ['run', script, '--bar', 'baz'],
        {
          cwd: config.pkg.location,
          env: {},
          pkg: config.pkg,
          reject: true,
          windowsHide: false,
        },
        config.pkg.name,
        true
      );
    });

    it('accepts opts.reject', async () => {
      const script = 'foo';
      const config = {
        args: [],
        pkg: {
          name: 'qux',
          location: '/test/npm/run/script/stream',
        },
        npmClient: 'npm',
        reject: false,
        windowsHide: false,
      } as ScriptStreamingOption;

      await npmRunScriptStreaming(script, config);

      expect(spawnStreaming).toHaveBeenLastCalledWith(
        'npm',
        ['run', script],
        {
          cwd: config.pkg.location,
          env: {},
          pkg: config.pkg,
          reject: false,
          windowsHide: false,
        },
        undefined,
        false
      );
    });
  });
});
