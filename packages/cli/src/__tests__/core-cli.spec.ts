import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ValidationError, type Package } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import lernaCLI from '../lerna-cli.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

function prepare(cwd: string) {
  // DRY setup for yargs instance
  return lernaCLI([], cwd).exitProcess(false).detectLocale(false).showHelpOnFail(false).wrap(null);
}

async function parse(instance: any, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    instance.parse(args, (exitError: any, argv: string, output: string) => {
      if (exitError) {
        // parity with synchronous errors
        Object.assign(exitError, { argv, output });
        reject(exitError);
      } else {
        resolve({ exitError, argv, output });
      }
    });
  });
}

describe('core-cli', () => {
  let cwd: string;

  beforeAll(async () => {
    cwd = await initFixture('toposort');
  });

  it('provides global options', async () => {
    const cli = prepare(cwd);

    cli.command('test-cmd', 'will pass');

    const { argv } = await parse(cli, [
      'test-cmd',
      '--loglevel=warn',
      '--concurrency=10',
      '--no-progress',
      '--no-sort',
      '--max-buffer=1024',
    ]);

    expect(argv).toMatchObject({
      loglevel: 'warn',
      concurrency: 10,
      progress: false,
      sort: false,
      maxBuffer: 1024,
    });
  });

  it('demands a command', async () => {
    const cli = prepare(cwd);
    const cmd = parse(cli, ['--loglevel', 'silent']);

    await expect(cmd).rejects.toThrow('A command is required.');
  });

  it('recommends commands', async () => {
    const cli = prepare(cwd);

    cli.command('you', 'shall not pass');

    const cmd = parse(cli, ['yooou']);
    await expect(cmd).rejects.toThrow('Unknown argument: yooou');

    const [unknownCmd, didYouMean] = loggingOutput('error');

    expect(unknownCmd).toBe('Unknown command "yooou"');
    expect(didYouMean).toBe('Did you mean you?');
  });

  it('does not re-log ValidationError messages', async () => {
    const cli = prepare(cwd);

    cli.command('boom', 'explodey', {}, () => {
      throw new ValidationError('test', 'go boom');
    });

    const cmd = parse(cli, ['boom']);
    await expect(cmd).rejects.toThrow('go boom');

    expect(loggingOutput('error')).toEqual(['go boom']);
  });

  it('does not re-log ValidationError messages (async)', async () => {
    try {
      const cli = prepare(cwd);

      cli.command('boom', 'explodey', {}, () => {
        throw new ValidationError('test', '...boom');
      });

      // paradoxically, this does NOT reject...
      await parse(cli, ['boom']);

      expect(loggingOutput('error')).toEqual(['...boom']);
    } catch (e: any) {
      expect(e.prefix).toBe('test');
      expect(e.message).toBe('...boom');
    }
  });

  it('does not log errors with a pkg property', async () => {
    const cli = prepare(cwd);

    cli.command('run', 'a package error', {}, () => {
      const err = new Error('oops') as Error & { pkg: Package };
      err.pkg = {} as Package; // actual content doesn't matter here
      throw err;
    });

    const cmd = parse(cli, ['run']);
    await expect(cmd).rejects.toThrow('oops');

    expect(loggingOutput('error')).toEqual([]);
  });

  it('logs generic command errors with fallback exit code', async () => {
    try {
      const cli = prepare(cwd);
      const spy = vi.spyOn(cli, 'exit');

      cli.command('handler', 'a generic error', {}, () => {
        const err = new Error('yikes');
        throw err;
      });

      // paradoxically, this does NOT reject...
      await parse(cli, ['handler']);

      expect(loggingOutput('error')).toEqual(['yikes']);
      expect(spy).toHaveBeenLastCalledWith(
        1,
        expect.objectContaining({
          message: 'yikes',
        })
      );
    } catch (e: any) {
      expect(e.message).toBe('yikes');
    }
  });

  it('preserves explicit exit codes', async () => {
    try {
      const cli = prepare(cwd);
      const spy = vi.spyOn(cli, 'exit');

      cli.command('explicit', 'exit code', {}, () => {
        const err = new Error('fancy fancy') as Error & { exitCode: number };
        err.exitCode = 127;
        throw err;
      });

      // paradoxically, this does NOT reject...
      await parse(cli, ['explicit']);

      expect(spy).toHaveBeenLastCalledWith(
        127,
        expect.objectContaining({
          message: 'fancy fancy',
        })
      );
    } catch (e: any) {
      expect(e.message).toBe('fancy fancy');
    }
  });
});
