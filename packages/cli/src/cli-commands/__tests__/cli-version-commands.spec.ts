import { VersionCommand } from '@lerna-lite/version';
import { describe, expect, it, vi, type Mock } from 'vitest';
import yargs from 'yargs/yargs';

import cliVersion from '../cli-version-commands.js';

vi.mock('@lerna-lite/version', () => ({ VersionCommand: vi.fn(function () {}) }));

describe('Version Command CLI options', () => {
  it('should log a console error when versionCommand is not provided', async () => {
    (VersionCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliVersion.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/version" is optional and was not found.'));
  });

  it('preserves command failures and their exit codes', async () => {
    const error = Object.assign(new Error('version failed'), { exitCode: 7 });
    (VersionCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliVersion.handler({} as any)).rejects.toBe(error);
  });

  const patchedVersionCommand = {
    ...cliVersion,
    handler: (...args: any[]) => {
      // @ts-ignore
      return cliVersion.handler.call(this, ...args).catch(() => {});
    },
  };

  it.each`
    args                                                                                   | expected
    ${'version minor'}                                                                     | ${{ bump: 'minor' }}
    ${'version prepatch'}                                                                  | ${{ bump: 'prepatch' }}
    ${'version --dry-run'}                                                                 | ${{ 'dry-run': true, dryRun: true }}
    ${'version --dry-run major'}                                                           | ${{ 'dry-run': true, dryRun: true, bump: 'major' }}
    ${'version --conventional-commits --yes --conventional-prerelease --dry-run premajor'} | ${expect.objectContaining({ dryRun: true, bump: 'premajor', conventionalPrerelease: true })}
    ${'version --dry-run true'}                                                            | ${{ dryRun: true, 'dry-run': true }}
    ${'version --conventional-commits --yes --conventional-prerelease 0.2'}                | ${expect.objectContaining({ conventionalCommits: true, conventionalPrerelease: 0.2 })}
    ${'version --conventional-commits --yes --conventional-prerelease=* premajor'}         | ${expect.objectContaining({ bump: 'premajor', conventionalCommits: true, conventionalPrerelease: '*' })}
  `('should parse args as expected: "$args"', async ({ args, expected }) => {
    const argv: string[] = typeof args === 'string' ? args.split(/\s+/g) : args;
    const {
      $0: _caller,
      _,
      ...options
    } = await yargs()
      .command(patchedVersionCommand as any)
      .exitProcess(false)
      .parse(argv);
    // console.log('%o', options);
    expect(options).toEqual(expected);
    // The check below are to keep the linter from complaining.
    expect(_).toBeDefined();
    expect(_caller).toBeDefined();
  });
});
