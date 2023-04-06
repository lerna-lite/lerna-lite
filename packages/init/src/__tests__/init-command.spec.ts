import { describe, expect, it, vi } from 'vitest';
import { ensureDir, outputJson, pathExists, readJson } from 'fs-extra/esm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { temporaryDirectory } from 'tempy';

// helpers
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// file under test
import { InitCommand } from '../index';
import { factory } from '../init-command';
import cliCommands from '../../../cli/src/cli-commands/cli-init-commands';
const lernaInit = commandRunner(cliCommands);

// file under test
import yargParser from 'yargs-parser';

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('init');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv;
};

describe('Init Command', () => {
  const lernaVersion = '__TEST_VERSION__';

  it('should execute methods when initializing the command via its class', async () => {
    const testDir = await initFixture('empty');
    const ensurePkgJsonSpy = vi.spyOn(InitCommand.prototype, 'ensurePackageJSON');
    const ensureLernaConfSpy = vi.spyOn(InitCommand.prototype, 'ensureLernaConfig');
    const ensurePkgDirSpy = vi.spyOn(InitCommand.prototype, 'ensurePackagesDir');

    const cmd = new InitCommand(createArgv(testDir, ''));
    await cmd;

    expect(cmd.requiresGit).toBe(false);
    expect(ensurePkgJsonSpy).toHaveBeenCalled();
    expect(ensureLernaConfSpy).toHaveBeenCalled();
    expect(ensurePkgDirSpy).toHaveBeenCalled();
  });

  it('should execute methods when initializing the command via a factory', async () => {
    const testDir = await initFixture('empty');
    const ensurePkgJsonSpy = vi.spyOn(InitCommand.prototype, 'ensurePackageJSON');
    const ensureLernaConfSpy = vi.spyOn(InitCommand.prototype, 'ensureLernaConfig');
    const ensurePkgDirSpy = vi.spyOn(InitCommand.prototype, 'ensurePackagesDir');
    await factory(createArgv(testDir, ''));

    expect(ensurePkgJsonSpy).toHaveBeenCalled();
    expect(ensureLernaConfSpy).toHaveBeenCalled();
    expect(ensurePkgDirSpy).toHaveBeenCalled();
  });

  it('should ensure lerna config changes to "independent" when provided as argument', async () => {
    const testDir = await initFixture('empty');

    const cmd = new InitCommand(createArgv(testDir, '--independent'));
    await cmd;

    expect(cmd.project.config.version).toEqual('independent');
  });

  it('should ensure manifest includes "workspaces" when "--use-workspaces" provided as argument', async () => {
    const testDir = await initFixture('empty');

    const cmd = new InitCommand(createArgv(testDir, '--use-workspaces'));
    await cmd;

    expect(cmd.project.manifest.workspaces).toEqual(['packages/*']);

    cmd.project.manifest.workspaces = ['modules/*'];
    expect(cmd.project.manifest.workspaces).toEqual(['modules/*']);
  });

  it('should ensure lerna config changes version to "0.0.0" when no version found in project package', async () => {
    const testDir = await initFixture('empty');

    const cmd = new InitCommand(createArgv(testDir, ''));
    await cmd;

    expect(cmd.project.config.version).toEqual('0.0.0');
  });

  it('should ensure when Git will become initialized when it is not at the start', async () => {
    vi.spyOn(InitCommand.prototype, 'gitInitialized').mockReturnValue(false);
    const testDir = await initFixture('empty');

    const cmd = new InitCommand(createArgv(testDir, ''));
    await cmd;
    const loggerSpy = vi.spyOn(cmd.logger, 'info');
    cmd.initialize();

    expect(loggerSpy).toHaveBeenCalledWith('', 'Initializing Git repository');
    expect(cmd.project.config.version).toEqual('0.0.0');
  });

  it('should ensure lerna config changes version to what is found in project package version', async () => {
    const testDir = await initFixture('updates');

    const cmd = new InitCommand(createArgv(testDir, '--exact'));
    await cmd;

    expect(cmd.project.config.version).toEqual('1.0.0');
  });

  describe('in an empty directory', () => {
    it('initializes git repo with lerna files', async () => {
      const testDir = temporaryDirectory();

      await lernaInit(testDir)();

      const [lernaJson, pkgJson, packagesDirExists, gitDirExists] = await Promise.all([
        readJson(join(testDir, 'lerna.json')),
        readJson(join(testDir, 'package.json')),
        pathExists(join(testDir, 'packages'), null as any),
        pathExists(join(testDir, '.git'), null as any),
      ]);

      expect(lernaJson).toMatchObject({
        packages: ['packages/*'],
        version: '0.0.0',
      });
      expect(pkgJson).toMatchObject({
        devDependencies: {
          '@lerna-lite/cli': `^${lernaVersion}`,
        },
      });
      expect(packagesDirExists).toBe(true);
      expect(gitDirExists).toBe(true);
    });

    it('initializes git repo with lerna files in independent mode', async () => {
      const testDir = temporaryDirectory();

      await lernaInit(testDir)('--independent');

      expect(await readJson(join(testDir, 'lerna.json'))).toHaveProperty('version', 'independent');
    });

    describe('with --exact', () => {
      it('uses exact version when adding lerna dependency', async () => {
        const testDir = temporaryDirectory();

        await lernaInit(testDir)('--exact');

        expect(await readJson(join(testDir, 'package.json'))).toMatchObject({
          devDependencies: {
            '@lerna-lite/cli': lernaVersion,
          },
        });
      });

      it('sets lerna.json command.init.exact to true', async () => {
        const testDir = temporaryDirectory();

        await lernaInit(testDir)('--exact');

        expect(await readJson(join(testDir, 'lerna.json'))).toMatchObject({
          $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
          command: {
            init: {
              exact: true,
            },
          },
        });
      });
    });

    describe('when initializing with --use-workspaces', () => {
      it('sets lerna.json command.init.useWorkspaces to true', async () => {
        const testDir = await initFixture('empty');
        const lernaJsonPath = join(testDir, 'lerna.json');
        const pkgJsonPath = join(testDir, 'package.json');

        await outputJson(lernaJsonPath, {
          '@lerna-lite/cli': '0.1.100',
          $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
          command: {
            bootstrap: {
              hoist: true,
            },
          },
          version: '1.2.3',
        });
        await outputJson(pkgJsonPath, {
          devDependencies: {
            '@lerna-lite/cli': lernaVersion,
          },
          workspaces: ['packages/*'],
        });

        await lernaInit(testDir)('--use-workspaces');

        expect(await readJson(lernaJsonPath)).toEqual({
          $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
          command: {
            bootstrap: {
              hoist: true,
            },
          },
          useWorkspaces: true,
          version: '1.2.3',
        });
      });
    });
  });

  describe('in a subdirectory of a git repo', () => {
    it('creates lerna files', async () => {
      const dir = await initFixture('empty');
      const testDir = join(dir, 'subdir');

      await ensureDir(testDir);
      await lernaInit(testDir)();

      const [lernaJson, pkgJson, packagesDirExists] = await Promise.all([
        readJson(join(testDir, 'lerna.json')),
        readJson(join(testDir, 'package.json')),
        pathExists(join(testDir, 'packages'), null as any),
      ]);

      expect(lernaJson).toMatchObject({
        packages: ['packages/*'],
        version: '0.0.0',
      });
      expect(pkgJson).toMatchObject({
        devDependencies: {
          '@lerna-lite/cli': `^${lernaVersion}`,
        },
      });
      expect(packagesDirExists).toBe(true);
    });
  });

  describe('when package.json exists', () => {
    it('adds lerna to sorted devDependencies', async () => {
      const testDir = await initFixture('has-package');
      const pkgJsonPath = join(testDir, 'package.json');

      await outputJson(pkgJsonPath, {
        devDependencies: {
          alpha: 'first',
          omega: 'last',
        },
      });

      await lernaInit(testDir)();

      expect(await readJson(pkgJsonPath)).toMatchObject({
        devDependencies: {
          alpha: 'first',
          '@lerna-lite/cli': `^${lernaVersion}`,
          omega: 'last',
        },
      });
    });

    it('updates existing lerna in devDependencies', async () => {
      const testDir = await initFixture('has-package');
      const pkgJsonPath = join(testDir, 'package.json');

      await outputJson(pkgJsonPath, {
        dependencies: {
          alpha: 'first',
          omega: 'last',
        },
        devDependencies: {
          '@lerna-lite/cli': '0.1.100',
        },
      });

      await lernaInit(testDir)();

      expect(await readJson(pkgJsonPath)).toMatchObject({
        dependencies: {
          alpha: 'first',
          omega: 'last',
        },
        devDependencies: {
          '@lerna-lite/cli': `^${lernaVersion}`,
        },
      });
    });

    it('updates existing lerna in sorted dependencies', async () => {
      const testDir = await initFixture('has-package');
      const pkgJsonPath = join(testDir, 'package.json');

      await outputJson(pkgJsonPath, {
        dependencies: {
          alpha: 'first',
          '@lerna-lite/cli': '0.1.100',
          omega: 'last',
        },
      });

      await lernaInit(testDir)();

      expect(await readJson(pkgJsonPath)).toMatchObject({
        dependencies: {
          alpha: 'first',
          '@lerna-lite/cli': `^${lernaVersion}`,
          omega: 'last',
        },
      });
    });
  });

  describe('when lerna.json exists', () => {
    it('deletes lerna property if found', async () => {
      const testDir = await initFixture('has-lerna');
      const lernaJsonPath = join(testDir, 'lerna.json');

      await outputJson(lernaJsonPath, {
        '@lerna-lite/cli': '0.1.100',
        version: '1.2.3',
      });

      await lernaInit(testDir)();

      expect(await readJson(lernaJsonPath)).toEqual({
        $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
        packages: ['packages/*'],
        version: '1.2.3',
      });
    });

    // it('creates package directories when glob is configured', async () => {
    //   const testDir = await initFixture('has-lerna');
    //   const lernaJsonPath = join(testDir, 'lerna.json');

    //   await outputJson(lernaJsonPath, {
    //     packages: ['modules/*'],
    //   });

    //   await lernaInit(testDir)();

    //   expect(await pathExists(join(testDir, 'modules'), null)).toBe(true);
    // });
  });

  describe('when re-initializing with --exact', () => {
    it('sets lerna.json command.init.exact to true', async () => {
      const testDir = await initFixture('updates');
      const lernaJsonPath = join(testDir, 'lerna.json');
      const pkgJsonPath = join(testDir, 'package.json');

      await outputJson(lernaJsonPath, {
        '@lerna-lite/cli': '0.1.100',
        $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
        command: {
          bootstrap: {
            hoist: true,
          },
        },
        version: '1.2.3',
      });
      await outputJson(pkgJsonPath, {
        devDependencies: {
          '@lerna-lite/cli': lernaVersion,
        },
      });

      await lernaInit(testDir)('--exact');

      expect(await readJson(lernaJsonPath)).toEqual({
        $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
        command: {
          bootstrap: {
            hoist: true,
          },
          init: {
            exact: true,
          },
        },
        packages: ['packages/*'],
        version: '1.2.3',
      });
    });
  });
});
