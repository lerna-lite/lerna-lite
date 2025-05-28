import { basename, dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initFixtureFactory } from '@lerna-test/helpers';
import { outputFile, remove, writeJson } from 'fs-extra/esm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

const { writeFileMock } = vi.hoisted(() => ({ writeFileMock: vi.fn() }));
vi.mock('node:fs', async () => ({
  ...(await vi.importActual('node:fs')),
  writeFileSync: writeFileMock,
}));

vi.mock('write-json-file');
import { writeJsonFile } from 'write-json-file';

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// file under test
import { Project } from '../project.js';

describe('Project', () => {
  let testDir = '';

  beforeAll(async () => {
    testDir = await initFixture('basic');
  });

  beforeEach(() => {
    (writeFileMock as Mock).mockReset();
  });

  afterEach(() => {
    // ensure common CWD is restored when individual tests
    // initialize their own fixture (which changes CWD)
    if (process.cwd() !== testDir) {
      process.chdir(testDir);
    }
  });

  describe('.rootPath', () => {
    it('should be added to the instance', () => {
      const project = new Project(testDir);
      expect(project.rootPath).toBe(testDir);
    });

    it('resolves to CWD when lerna.json missing', async () => {
      const cwd = await initFixture('no-lerna-config');
      const project = new Project(cwd);

      expect(project.rootPath).toBe(cwd);
    });

    it("defaults CWD to '.' when constructor argument missing", () => {
      const project = new Project();
      expect(project.rootPath).toBe(testDir);
    });
  });

  describe('.config', () => {
    it('returns parsed lerna.json', () => {
      const project = new Project(testDir);
      expect(project.config).toEqual({
        version: '1.0.0',
      });
    });

    it('defaults to an empty object', async () => {
      await initFixture('no-lerna-config');

      expect(new Project().config).toEqual({});
    });

    it('does not error when lerna.json contains trailing commas and/or comments', async () => {
      const cwd = await initFixture('invalid-lerna-json-recoverable');

      expect(new Project(cwd).config).toMatchInlineSnapshot(`
        {
          "version": "1.0.0",
        }
      `);
    });

    it('does not error when lerna.jsonc contains trailing commas and/or comments', async () => {
      const cwd = await initFixture('invalid-lerna-jsonc-recoverable');

      expect(new Project(cwd).config).toMatchInlineSnapshot(`
        {
          "version": "1.0.0",
        }
      `);
    });

    it('can load lerna.jsonc config with comments', async () => {
      const cwd = await initFixture('lerna-jsonc-config');
      const project = new Project(cwd);

      expect(project.config).toEqual({
        version: '1.0.0',
      });
      expect(project.config).toMatchInlineSnapshot(`
        {
          "version": "1.0.0",
        }
      `);
    });

    it('can load lerna.json5 config with trailing commas and/or comments', async () => {
      const cwd = await initFixture('lerna-json5-config');
      const project = new Project(cwd);

      expect(project.config).toEqual({
        version: '1.0.0',
      });
      expect(project.config).toMatchInlineSnapshot(`
        {
          "version": "1.0.0",
        }
      `);
    });

    it('can write to lerna.jsonc config as json format', async () => {
      (writeJsonFile as Mock).mockResolvedValue({});
      const cwd = await initFixture('lerna-jsonc-config');
      const project = new Project(cwd);

      project.serializeConfig();
      expect(writeJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('lerna.jsonc'),
        { version: '1.0.0' },
        {
          indent: 2,
          detectIndent: true,
        }
      );
    });

    it('can write to lerna.json5 config as json5 format', async () => {
      const cwd = await initFixture('lerna-json5-config');
      const project = new Project(cwd);

      project.serializeConfig();

      (writeFileMock as Mock).mockName('writeFileSync');

      expect(writeFileMock).toHaveBeenCalledWith(expect.stringContaining('lerna.json5'), expect.stringContaining(`version: '1.0.0'`));
    });

    it('errors when lerna.json is irrecoverably invalid JSON', async () => {
      const cwd = await initFixture('invalid-lerna-json-irrecoverable');

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          prefix: 'JSONError',
        })
      );

      expect(() => new Project(cwd)).toThrow(/Error in:.*lerna\.json\sJSON5: invalid character '2' at 2:3/);
    });

    it('returns parsed rootPkg.lerna', async () => {
      const cwd = await initFixture('pkg-prop');
      const project = new Project(cwd);

      expect(project.config).toEqual({
        command: {
          publish: {
            loglevel: 'verbose',
          },
        },
        loglevel: 'success',
        version: '1.0.0',
      });
    });

    it('errors when root package.json is not valid JSON', async () => {
      const cwd = await initFixture('pkg-prop-syntax-error');

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          prefix: 'JSONError',
        })
      );
    });

    // TODO investigate why the following 2 tests fail on CI but pass locally
    it.skip('extends local shared config', async () => {
      const cwd = await initFixture('extends');
      const project = new Project(cwd);

      expect(project.config).toEqual({
        packages: ['custom-local/*'],
        version: '1.0.0',
      });
    });

    it.skip('extends local shared config subpath', async () => {
      const cwd = await initFixture('extends');

      await writeJson(pathResolve(cwd, 'lerna.json'), {
        extends: 'local-package/subpath',
        version: '1.0.0',
      });

      const project = new Project(cwd);

      expect(project.config).toEqual({
        packages: ['subpath-local/*'],
        version: '1.0.0',
      });
    });

    it('extends config recursively', async () => {
      const cwd = await initFixture('extends-recursive');
      const project = new Project(cwd);

      expect(project.config).toEqual({
        command: {
          list: {
            json: true,
            private: false,
          },
        },
        packages: ['recursive-pkgs/*'],
        version: '1.0.0',
      });
    });

    it('throws an error when extend target is unresolvable', async () => {
      const cwd = await initFixture('extends-unresolved');

      expect(() => new Project(cwd)).toThrow('must be locally-resolvable');
    });

    it('throws an error when extend target is circular', async () => {
      const cwd = await initFixture('extends-circular');

      expect(() => new Project(cwd)).toThrow('cannot be circular');
    });
  });

  describe('get .version', () => {
    it('reads the `version` key from internal config', () => {
      const project = new Project(testDir);
      expect(project.version).toBe('1.0.0');
    });
  });

  describe('set .version', () => {
    it('sets the `version` key of internal config', () => {
      const project = new Project(testDir);
      project.version = '2.0.0';
      expect(project.config.version).toBe('2.0.0');
    });
  });

  describe('get .packageConfigs', () => {
    it('returns the default packageConfigs', () => {
      const project = new Project(testDir);
      expect(project.packageConfigs).toEqual(['packages/*']);
    });

    it('returns custom packageConfigs', () => {
      const project = new Project(testDir);
      const customPackages = ['.', 'my-packages/*'];
      project.config.packages = customPackages;
      expect(project.packageConfigs).toBe(customPackages);
    });

    it('returns workspace packageConfigs', async () => {
      const cwd = await initFixture('yarn-workspaces');
      const project = new Project(cwd);
      expect(project.packageConfigs).toEqual(['packages/*']);
    });

    it('throws with friendly error if workspaces are not configured', () => {
      const project = new Project(testDir);
      project.config.useWorkspaces = true;
      expect(() => project.packageConfigs).toThrow(/workspaces need to be defined/);
    });
  });

  describe('get .packageParentDirs', () => {
    it('returns a list of package parent directories', () => {
      const project = new Project(testDir);
      project.config.packages = ['.', 'packages/*', 'dir/nested/*', 'globstar/**'];
      expect(project.packageParentDirs).toEqual([testDir, join(testDir, 'packages'), join(testDir, 'dir/nested'), join(testDir, 'globstar')]);
    });
  });

  describe('.getPackages()', () => {
    it('returns a list of package instances asynchronously', async () => {
      const project = new Project(testDir);
      const result = await project.getPackages();
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "name": "pkg-1",
            "version": "1.0.0",
          },
          {
            "dependencies": {
              "pkg-1": "^1.0.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
        ]
      `);
    });

    it('is available from a static method', async () => {
      const result = await Project.getPackages(testDir);
      expect(result).toMatchObject([{ name: 'pkg-1' }, { name: 'pkg-2' }]);
    });
  });

  describe('.getPackagesSync()', () => {
    it('returns a list of package instances synchronously', () => {
      const project = new Project(testDir);
      expect(project.getPackagesSync()).toMatchInlineSnapshot(`
        [
          {
            "name": "pkg-1",
            "version": "1.0.0",
          },
          {
            "dependencies": {
              "pkg-1": "^1.0.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
        ]
      `);
    });

    it('is available from a static method', () => {
      expect(Project.getPackagesSync(testDir)).toMatchObject([{ name: 'pkg-1' }, { name: 'pkg-2' }]);
    });
  });

  describe('get .manifest', () => {
    it('returns a Package instance', () => {
      const project = new Project(testDir);
      expect(project.manifest).toBeDefined();
      expect(project.manifest.name).toBe('test');
      expect(project.manifest.location).toBe(testDir);
    });

    it('caches the first successful value', () => {
      const project = new Project(testDir);
      expect(project.manifest).toBe(project.manifest);
    });

    it('defaults package.json name field when absent', async () => {
      const cwd = await initFixture('basic');
      const manifestLocation = join(cwd, 'package.json');

      await writeJson(manifestLocation, { private: true }, { spaces: 2 });

      const project = new Project(cwd);
      expect(project.manifest).toHaveProperty('name', basename(cwd));
    });

    it('does not cache failures', async () => {
      const cwd = await initFixture('basic');
      const manifestLocation = join(cwd, 'package.json');

      await remove(manifestLocation);

      const project = new Project(cwd);
      expect(project.manifest).toBe(undefined);

      await writeJson(manifestLocation, { name: 'test' }, { spaces: 2 });
      expect(project.manifest).toHaveProperty('name', 'test');
    });

    it('errors when root package.json is not valid JSON', async () => {
      const cwd = await initFixture('invalid-package-json');

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          prefix: 'JSONError',
        })
      );
    });
  });

  describe('get .licensePath', () => {
    it('returns path to root LICENSE', async () => {
      const cwd = await initFixture('licenses');
      const project = new Project(cwd);

      expect(project.licensePath).toMatch(/LICENSE$/);
    });

    it('returns path to root LICENSE.md', async () => {
      const cwd = await initFixture('licenses-missing');
      const project = new Project(cwd);

      await outputFile(join(cwd, 'LICENSE.md'), 'copyright, yo', 'utf8');

      expect(project.licensePath).toMatch(/LICENSE\.md$/);
    });

    it('returns path to root licence.txt', async () => {
      const cwd = await initFixture('licenses-missing');
      const project = new Project(cwd);

      await outputFile(join(cwd, 'licence.txt'), 'copyright, yo', 'utf8');

      expect(project.licensePath).toMatch(/licence\.txt$/);
    });

    it('returns undefined when root license does not exist', async () => {
      const cwd = await initFixture('licenses-missing');
      const project = new Project(cwd);

      expect(project.licensePath).toBeUndefined();
    });

    it('caches the first successful value', async () => {
      const cwd = await initFixture('licenses-missing');
      const project = new Project(cwd);

      expect(project.licensePath).toBeUndefined();

      await outputFile(join(cwd, 'LiCeNsE'), 'copyright, yo', 'utf8');

      const foundPath = project.licensePath;
      expect(foundPath).toMatch(/LiCeNsE$/);

      await remove(project.licensePath);

      expect(project.licensePath).toBe(foundPath);
    });
  });

  describe('getPackageLicensePaths()', () => {
    it('returns a list of existing package license files', async () => {
      const cwd = await initFixture('licenses-names');
      const project = new Project(cwd);
      const licensePaths = await project.getPackageLicensePaths();

      expect(licensePaths).toEqual([
        join(cwd, 'packages', 'package-1', 'LICENSE'),
        join(cwd, 'packages', 'package-2', 'licence'),
        join(cwd, 'packages', 'package-3', 'LiCeNSe'),
        join(cwd, 'packages', 'package-5', 'LICENCE'),
        // We do not care about duplicates, they are weeded out elsewhere
        join(cwd, 'packages', 'package-5', 'license'),
      ]);
    });
  });

  describe('isIndependent()', () => {
    it('returns if the repository versioning is independent', () => {
      const project = new Project(testDir);
      expect(project.isIndependent()).toBe(false);

      project.version = 'independent';
      expect(project.isIndependent()).toBe(true);
    });
  });
});
