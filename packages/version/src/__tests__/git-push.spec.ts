import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from '@lerna-lite/core';
import { cloneFixtureFactory } from '@lerna-test/helpers';
import { execa } from 'execa';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { gitPush, gitPushSingleTag } from '../lib/git-push.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cloneFixture = cloneFixtureFactory(__dirname);

async function listRemoteTags(cwd: string) {
  return execa('git', ['ls-remote', '--tags', '--refs', '--quiet'], { cwd }).then((result) => result.stdout);
}

vi.mock('@lerna-lite/core', async () => {
  const { exec } = await vi.importActual<any>('@lerna-lite/core');
  return {
    __esModule: true,
    exec: vi.fn(exec),
  };
});

afterEach(() => {
  delete process.env.GIT_REDIRECT_STDERR;
});

describe('gitPush', () => {
  test('gitPush', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v1.2.3', '-m', 'v1.2.3'], { cwd });
    await execa('git', ['tag', 'foo@2.3.1', '-m', 'foo@2.3.1'], { cwd });
    await execa('git', ['tag', 'bar@3.2.1', '-m', 'bar@3.2.1'], { cwd });

    await gitPush('origin', 'main', { cwd });

    expect(exec).toHaveBeenCalled();
    expect(exec).toHaveBeenLastCalledWith('git', ['push', '--follow-tags', '--no-verify', '--atomic', 'origin', 'main'], { cwd }, false);

    const list = await listRemoteTags(cwd);
    expect(list).toMatch('v1.2.3');
    expect(list).toMatch('foo@2.3.1');
    expect(list).toMatch('bar@3.2.1');
  });

  test('remote that does not support --atomic', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v4.5.6', '-m', 'v4.5.6'], { cwd });

    // the first time the command is executed, simulate remote error
    (exec as any).mockImplementationOnce(async () => {
      const stderr = 'fatal: the receiving end does not support --atomic push';
      const error: any = new Error(['Command failed: git push --follow-tags --atomic --no-verify origin main', stderr].join('\n'));

      error.stderr = stderr;

      throw error;
    });

    // this call should _not_ throw
    await gitPush('origin', 'main', { cwd });

    expect(exec).toHaveBeenCalledTimes(2);
    expect(exec).toHaveBeenLastCalledWith('git', ['push', '--follow-tags', '--no-verify', 'origin', 'main'], { cwd }, false);

    const list = await listRemoteTags(cwd);
    expect(list).toMatch('v4.5.6');
  });

  test('remote that does not support --atomic and git stderr redirected to stdout', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    process.env.GIT_REDIRECT_STDERR = '2>&1';

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v4.5.6', '-m', 'v4.5.6'], { cwd });

    // the first time the command is executed, simulate remote error
    (exec as any).mockImplementationOnce(async () => {
      const stdout = 'fatal: the receiving end does not support --atomic push';
      const error: any = new Error(['Command failed: git push --follow-tags --atomic --no-verify origin main', stdout].join('\n'));

      error.stdout = stdout;

      throw error;
    });

    // this call should _not_ throw
    await gitPush('origin', 'main', { cwd });

    expect(exec as any).toHaveBeenCalledTimes(2);
    expect(exec as any).toHaveBeenLastCalledWith('git', ['push', '--follow-tags', '--no-verify', 'origin', 'main'], { cwd }, false);

    const list = await listRemoteTags(cwd);
    expect(list).toMatch('v4.5.6');
  });

  test('git cli that does not support --atomic', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v7.8.9', '-m', 'v7.8.9'], { cwd });

    // the first time the command is executed, simulate remote error
    // (exec as any).mockImplementationOnce(async () => {
    //   const stderr = "error: unknown option `atomic'";
    //   const error: any = new Error(
    //     ["Command failed: git push --follow-tags --atomic --no-verify origin master", stderr].join("\n")
    //   );

    //   error.stderr = stderr;

    //   throw error;
    // });

    await gitPush('origin', 'main', { cwd });

    await expect(listRemoteTags(cwd)).resolves.toMatch('v7.8.9');
  });

  test('unexpected git error', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    (exec as any).mockImplementationOnce(async () => {
      const stderr = 'fatal: some unexpected error';
      const error: any = new Error(['Command failed: git push --follow-tags --atomic --no-verify origin main', stderr].join('\n'));

      error.stderr = stderr;

      throw error;
    });

    await expect(gitPush('origin', 'main', { cwd })).rejects.toThrowError(/some unexpected error/);
  });
});

describe('gitPushSingleTag', () => {
  test('gitPushSingleTag', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v1.2.3', '-m', 'v1.2.3'], { cwd });
    await execa('git', ['tag', 'foo@2.3.1', '-m', 'foo@2.3.1'], { cwd });
    await execa('git', ['tag', 'bar@3.2.1', '-m', 'bar@3.2.1'], { cwd });

    await gitPushSingleTag('origin', 'main', 'foo@2.3.1', { cwd });

    expect(exec).toHaveBeenCalled();
    expect(exec).toHaveBeenLastCalledWith('git', ['push', '--no-verify', '--atomic', 'origin', 'foo@2.3.1', 'main'], { cwd }, false);

    const list = await listRemoteTags(cwd);
    expect(list).toMatch('foo@2.3.1');
  });

  test('remote that does not support --atomic', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v4.5.6', '-m', 'v4.5.6'], { cwd });

    // the first time the command is executed, simulate remote error
    (exec as any).mockImplementationOnce(async () => {
      const stderr = 'fatal: the receiving end does not support --atomic push';
      const error: any = new Error(['Command failed: git push --atomic --no-verify origin main', stderr].join('\n'));

      error.stderr = stderr;

      throw error;
    });

    // this call should _not_ throw
    await gitPushSingleTag('origin', 'main', 'v4.5.6', { cwd });

    expect(exec).toHaveBeenCalledTimes(2);
    expect(exec).toHaveBeenLastCalledWith('git', ['push', '--no-verify', 'origin', 'v4.5.6', 'main'], { cwd }, false);

    const list = await listRemoteTags(cwd);
    expect(list).toMatch('v4.5.6');
  });

  test('remote that does not support --atomic and git stderr redirected to stdout', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    process.env.GIT_REDIRECT_STDERR = '2>&1';

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v4.5.6', '-m', 'v4.5.6'], { cwd });

    // the first time the command is executed, simulate remote error
    (exec as any).mockImplementationOnce(async () => {
      const stdout = 'fatal: the receiving end does not support --atomic push';
      const error: any = new Error(['Command failed: git push --atomic --no-verify origin main', stdout].join('\n'));

      error.stdout = stdout;

      throw error;
    });

    // this call should _not_ throw
    await gitPushSingleTag('origin', 'main', 'v4.5.6', { cwd });

    expect(exec as any).toHaveBeenCalledTimes(2);
    expect(exec as any).toHaveBeenLastCalledWith('git', ['push', '--no-verify', 'origin', 'v4.5.6', 'main'], { cwd }, false);

    const list = await listRemoteTags(cwd);
    expect(list).toMatch('v4.5.6');
  });

  test('git cli that does not support --atomic', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
    await execa('git', ['tag', 'v7.8.9', '-m', 'v7.8.9'], { cwd });

    await gitPushSingleTag('origin', 'main', 'v7.8.9', { cwd });

    await expect(listRemoteTags(cwd)).resolves.toMatch('v7.8.9');
  });

  test('unexpected git error', async () => {
    const { cwd } = await cloneFixture('root-manifest-only');

    (exec as any).mockImplementationOnce(async () => {
      const stderr = 'fatal: some unexpected error';
      const error: any = new Error(['Command failed: git push --atomic --no-verify origin v7.8.9 main', stderr].join('\n'));

      error.stderr = stderr;

      throw error;
    });

    await expect(gitPushSingleTag('origin', 'main', 'v7.8.9', { cwd })).rejects.toThrowError(/some unexpected error/);
  });
});
