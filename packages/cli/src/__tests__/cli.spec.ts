'use strict';

import execa from 'execa';
import npmlog from 'npmlog';
import path from 'path';
import tempy from 'tempy';

// git init is not necessary
import { copyFixture } from '@lerna-test/helpers';

// FIXME: this is only working locally but fails in CI, so skip all tests for now
const CLI = path.join(__dirname, '../cli');
const bin =
  (cwd?: string) =>
  (...args) =>
    execa(CLI, args, { cwd });

jest.setTimeout(30e3);

describe.skip('cli', () => {
  it('should create CLI', () => {
    const logSpy = jest.spyOn(npmlog, 'info');

    expect(bin()()).toBeTruthy();
    expect(logSpy).toHaveBeenCalledWith('cli', 'using local version of lerna');
  });
});

describe.skip('cli test', () => {
  it('should throw without command', async () => {
    await expect(bin()()).rejects.toThrow('Pass --help to see all available commands and options.');
  });

  xit('should not throw for --help', async () => {
    let error = null;

    try {
      await bin()('--help');
    } catch (err) {
      error = err;
    }

    expect(error).toBe(null);
  });

  if (process.platform !== 'win32') {
    // windows inexplicably breaks with import-local 3.0.2, i give up
    it('should prefer local installs', async () => {
      const cwd = tempy.directory();
      await copyFixture(cwd, 'local-install', __dirname);

      const { stdout } = await bin(cwd)('--verbose');
      expect(stdout).toContain('__fixtures__/local-install/node_modules/lerna/cli.js');
      expect(stdout).toContain('__fixtures__/local-install/node_modules/@lerna-lite/cli/index.js');
    });
  }
});
