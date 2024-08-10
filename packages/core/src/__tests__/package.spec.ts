import { describe, expect, it, Mock, vi } from 'vitest';

import { log } from '@lerna-lite/npmlog';
import { loadJsonFile, loadJsonFileSync } from 'load-json-file';
import { homedir } from 'node:os';
import { dirname, normalize, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import npa from 'npm-package-arg';
import { writePackage } from 'write-package';

vi.mock('load-json-file');
vi.mock('write-package');

// file under test
import { Package } from '../package.js';
import { NpaResolveResult, RawManifest } from '../models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

describe('Package', () => {
  const factory = (json) => new Package(json, normalize(`/root/path/to/${json.name || 'package'}`), normalize('/root'));

  describe('get .name', () => {
    it('should return the name', () => {
      const pkg = factory({ name: 'get-name' });
      expect(pkg.name).toBe('get-name');
    });
  });

  describe('get .location', () => {
    it('should return the location', () => {
      const pkg = factory({ name: 'get-location' });
      expect(pkg.location).toBe(normalize('/root/path/to/get-location'));
    });
  });

  describe('get .workspaces', () => {
    it('should return the workspaces', () => {
      const pkg = factory({ name: 'get-workspaces' });
      expect(pkg.workspaces).toBe(undefined);

      pkg.workspaces = ['modules/*'];
      expect(pkg.workspaces).toEqual(['modules/*']);
    });
  });

  describe('get .resolved', () => {
    it('returns npa.Result relative to rootPath, always posix', () => {
      const pkg = factory({ name: 'get-resolved' });

      let homeDir = homedir();

      // on Windows, make sure to use same drive letter
      if (/([A-Z]:\\).*/i.test(__dirname)) {
        homeDir = __dirname.substring(0, 1); // ie D:\\
      }

      expect(pkg.resolved).toMatchObject({
        type: 'directory',
        name: 'get-resolved',
        where: normalize('/root'),
        // windows is so fucking ridiculous
        fetchSpec: pathResolve(homeDir, pkg.location),
      });
    });
  });

  describe('get .rootPath', () => {
    it('should return the rootPath', () => {
      const pkg = factory({ name: 'get-rootPath' });
      expect(pkg.rootPath).toBe(normalize('/root'));
    });
  });

  describe('get .version', () => {
    it('should return the version', () => {
      const pkg = factory({ version: '1.0.0' });
      expect(pkg.version).toBe('1.0.0');
    });
  });

  describe('set .version', () => {
    it('should set the version', () => {
      const pkg = factory({ version: '1.0.0' });
      pkg.version = '2.0.0';
      expect(pkg.version).toBe('2.0.0');
    });
  });

  describe('get .contents', () => {
    it('returns pkg.location by default', () => {
      const pkg = factory({ version: '1.0.0' });
      expect(pkg.contents).toBe(normalize('/root/path/to/package'));
    });

    it('returns pkg.publishConfig.directory when present', () => {
      const pkg = factory({
        version: '1.0.0',
        publishConfig: {
          directory: 'dist',
        },
      });
      expect(pkg.contents).toBe(normalize('/root/path/to/package/dist'));
    });

    it('returns pkg.location when pkg.publishConfig.directory is not present', () => {
      const pkg = factory({
        version: '1.0.0',
        publishConfig: {
          tag: 'next',
        },
      });
      expect(pkg.contents).toBe(normalize('/root/path/to/package'));
    });
  });

  describe('set .contents', () => {
    it('sets pkg.contents to joined value', () => {
      const pkg = factory({ version: '1.0.0' });
      pkg.contents = 'dist';
      expect(pkg.contents).toBe(normalize('/root/path/to/package/dist'));
    });
  });

  describe('get .pkg', () => {
    it('should return the same package name', () => {
      const pkg = factory({
        name: 'obj-bin',
        bin: { 'custom-bin': 'bin.js' },
      });
      expect(pkg.pkg.name).toBe('obj-bin');
    });
  });

  describe('get .bin', () => {
    it('should return the bin object', () => {
      const pkg = factory({
        name: 'obj-bin',
        bin: { 'custom-bin': 'bin.js' },
      });
      expect(pkg.bin).toEqual({ 'custom-bin': 'bin.js' });
    });

    it('returns a normalized object when pkg.bin is a string', () => {
      const pkg = factory({
        name: 'string-bin',
        bin: 'bin.js',
      });
      expect(pkg.bin).toEqual({ 'string-bin': 'bin.js' });
    });

    it('strips scope from normalized bin name', () => {
      const pkg = factory({
        name: '@scoped/string-bin',
        bin: 'bin.js',
      });
      expect(pkg.bin).toEqual({ 'string-bin': 'bin.js' });
    });
  });

  describe('get .binLocation', () => {
    it('should return the bin location', () => {
      const pkg = factory({
        name: 'obj-bin',
        bin: { 'custom-bin': 'bin.js' },
      });
      expect(pkg.binLocation.includes('obj-bin')).toBeTruthy();
    });
  });

  describe('get .nodeModulesLocation', () => {
    it('should return the bin location', () => {
      const pkg = factory({
        name: 'obj-bin',
        bin: { 'custom-bin': 'bin.js' },
      });
      expect(pkg.nodeModulesLocation.includes('node_modules')).toBeTruthy();
    });
  });

  describe('get .dependencies', () => {
    it('should return the dependencies', () => {
      const pkg = factory({
        dependencies: { 'my-dependency': '^1.0.0' },
      });
      expect(pkg.dependencies).toEqual({ 'my-dependency': '^1.0.0' });
    });
  });

  describe('get .devDependencies', () => {
    it('should return the devDependencies', () => {
      const pkg = factory({
        devDependencies: { 'my-dev-dependency': '^1.0.0' },
      });
      expect(pkg.devDependencies).toEqual({ 'my-dev-dependency': '^1.0.0' });
    });
  });

  describe('get .optionalDependencies', () => {
    it('should return the optionalDependencies', () => {
      const pkg = factory({
        optionalDependencies: { 'my-optional-dependency': '^1.0.0' },
      });
      expect(pkg.optionalDependencies).toEqual({ 'my-optional-dependency': '^1.0.0' });
    });
  });

  describe('get .peerDependencies', () => {
    it('should return the peerDependencies', () => {
      const pkg = factory({
        peerDependencies: { 'my-peer-dependency': '>=1.0.0' },
      });
      expect(pkg.peerDependencies).toEqual({ 'my-peer-dependency': '>=1.0.0' });
    });
  });

  describe('get .scripts', () => {
    it('should return the scripts', () => {
      const pkg = factory({
        scripts: { 'my-script': 'echo "hello world"' },
      });
      expect(pkg.scripts).toEqual({
        'my-script': 'echo "hello world"',
      });
    });

    it('preserves immutability of the input', () => {
      const json = {
        scripts: { 'my-script': 'keep' },
      };
      const pkg = factory(json);

      pkg.scripts['my-script'] = 'tweaked';

      expect(pkg.scripts).toHaveProperty('my-script', 'tweaked');
      expect(json.scripts).toHaveProperty('my-script', 'keep');
    });
  });

  describe('get .private', () => {
    it('should indicate if the package is private', () => {
      const pkg = factory({ name: 'not-private' });
      expect(pkg.private).toBe(false);
    });
  });

  describe('.get()', () => {
    it('retrieves arbitrary values from manifest', () => {
      const pkg = factory({ name: 'gettable', 'my-value': 'foo' });

      expect(pkg.get('missing')).toBe(undefined);
      expect(pkg.get('my-value')).toBe('foo');
    });
  });

  describe('.set()', () => {
    it('stores arbitrary values on manifest', () => {
      const pkg = factory({ name: 'settable' });

      pkg.set('foo', 'bar');

      expect(pkg.toJSON()).toEqual({
        name: 'settable',
        foo: 'bar',
      });
    });

    it('is chainable', () => {
      const pkg = factory({ name: 'chainable' });

      expect(pkg.set('foo', true).set('bar', false).get('foo')).toBe(true);
    });
  });

  describe('.toJSON()', () => {
    it('should return clone of internal package for serialization', () => {
      const json = {
        name: 'is-cloned',
      };
      const pkg = factory(json);

      expect(pkg.toJSON()).not.toBe(json);
      expect(pkg.toJSON()).toEqual(json);

      const implicit = JSON.stringify(pkg, null, 2);
      const explicit = JSON.stringify(json, null, 2);

      expect(implicit).toBe(explicit);
    });
  });

  describe('.refresh()', () => {
    it('reloads private state from disk', async () => {
      (loadJsonFile as any).mockImplementationOnce(() => Promise.resolve({ name: 'ignored', mutated: true }));

      const pkg = factory({ name: 'refresh' });
      const result = await pkg.refresh();

      expect(result).toBe(pkg);
      // a package's name never changes
      expect(pkg.name).toBe('refresh');
      expect(pkg.get('mutated')).toBe(true);
      expect(loadJsonFile).toHaveBeenLastCalledWith(pkg.manifestLocation);
    });
  });

  describe('.serialize()', () => {
    it('writes changes to disk', async () => {
      (writePackage as any).mockImplementation(() => Promise.resolve());

      const pkg = factory({ name: 'serialize-me' });
      const result = await pkg.set('woo', 'hoo').serialize();

      expect(result).toBe(pkg);
      expect(writePackage).toHaveBeenLastCalledWith(
        pkg.manifestLocation,
        expect.objectContaining({
          name: 'serialize-me',
          woo: 'hoo',
        })
      );
    });
  });

  describe('.updateLocalDependency()', () => {
    describe('gitCommittish', () => {
      it("works with a resolved 'gitCommittish'", () => {
        const pkg = factory({
          dependencies: {
            a: '^1.0.0',
            b: '^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.type = undefined as any;
        resolved.registry = undefined as any;
        resolved.gitCommittish = '1.2.3';
        resolved.hosted = {
          committish: '',
          domain: 'localhost',
          noGitPlus: false,
          noCommittish: false,
          saveSpec: true,
        } as any;

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect((resolved.hosted as any).committish).toBe('2.0.0');
      });
    });

    describe('gitRange', () => {
      it("works with a resolved 'gitRange'", () => {
        const pkg = factory({
          dependencies: {
            a: '^1.0.0',
            b: '^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.type = undefined as any;
        resolved.registry = undefined as any;
        resolved.gitRange = '1.2.3';
        resolved.hosted = {
          committish: '',
          domain: 'localhost',
          noGitPlus: false,
          noCommittish: false,
          saveSpec: true,
        } as any;

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect((resolved.hosted as any).committish).toBe('semver:^2.0.0');
      });

      it('does not bump peerDependencies by default without a flag', () => {
        const pkg = factory({
          peerDependencies: {
            a: '^1.0.0',
            b: '^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "peerDependencies": {
              "a": "^1.0.0",
              "b": "^1.0.0",
            },
          }
        `);
      });

      it('bumps peerDependencies when allowPeerDependenciesUpdate flag is enabled except for dependencies with semver range operator', () => {
        const pkg = factory({
          peerDependencies: {
            a: '^1.0.0',
            b: '>=1.0.0', // range will not be bumped
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0', '.');

        pkg.updateLocalDependency(resolvedA, '2.0.0', '^', true);
        pkg.updateLocalDependency(resolvedB, '2.0.0', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "peerDependencies": {
              "a": "^2.0.0",
              "b": ">=1.0.0",
            },
          }
        `);
      });

      it('bumps peerDependencies canary versions when allowPeerDependenciesUpdate flag is enabled except for dependencies with semver range operator', () => {
        const pkg = factory({
          peerDependencies: {
            a: '^1.0.0-alpha.0',
            b: '>=1.0.0-alpha.0', // range will not be bumped
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0-alpha.0', '.');
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0-alpha.0', '.');

        pkg.updateLocalDependency(resolvedA, '1.0.0-alpha.1', '^', true);
        pkg.updateLocalDependency(resolvedB, '1.0.0-alpha.1', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "peerDependencies": {
              "a": "^1.0.0-alpha.1",
              "b": ">=1.0.0-alpha.0",
            },
          }
        `);
      });

      it('bumps peerDependencies canary with SHA versions when allowPeerDependenciesUpdate flag is enabled except for dependencies with semver range operator', () => {
        const pkg = factory({
          peerDependencies: {
            a: '^1.0.0-alpha.0+SHA',
            b: '>=1.0.0-alpha.0+SHA', // range will not be bumped
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0-alpha.0+SHA', '.');
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0-alpha.0+SHA', '.');

        pkg.updateLocalDependency(resolvedA, '1.0.0-alpha.1+SHA', '^', true);
        pkg.updateLocalDependency(resolvedB, '1.0.0-alpha.1+SHA', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "peerDependencies": {
              "a": "^1.0.0-alpha.1+SHA",
              "b": ">=1.0.0-alpha.0+SHA",
            },
          }
        `);
      });
    });

    describe('Version with `workspace:` protocol', () => {
      it('works with `workspace:` protocol range', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:^1.0.0',
            b: 'workspace:>=1.0.0', // range will not be bumped
            c: 'workspace:./foo',
            d: 'file:./foo',
            e: '^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:^1.0.0';

        pkg.updateLocalDependency(resolved, '2.0.0', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "workspace:^2.0.0",
              "b": "workspace:>=1.0.0",
              "c": "workspace:./foo",
              "d": "file:./foo",
              "e": "^1.0.0",
            },
          }
        `);
      });

      it('works with `workspace:` protocol range and bumps both when dependencies and peerDependencies are found and allowPeerDependenciesUpdate flag is enabled', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:^1.0.0',
            b: 'workspace:>=1.0.0', // range will not be bumped
            c: 'workspace:./foo',
            d: 'file:./foo',
            e: '^1.0.0',
          },
          peerDependencies: {
            a: 'workspace:^1.0.0',
            b: 'workspace:>=1.0.0',
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolvedA.workspaceSpec = 'workspace:^1.0.0';
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0', '.');
        resolvedB.workspaceSpec = 'workspace:>=1.0.0';

        pkg.updateLocalDependency(resolvedA, '2.0.0', '^', true);
        pkg.updateLocalDependency(resolvedB, '2.0.0', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "workspace:^2.0.0",
              "b": "workspace:>=1.0.0",
              "c": "workspace:./foo",
              "d": "file:./foo",
              "e": "^1.0.0",
            },
            "peerDependencies": {
              "a": "workspace:^2.0.0",
              "b": "workspace:>=1.0.0",
            },
          }
        `);
      });

      it('bumps peer dependencies that have `workspace:` protocol even when allowPeerDependenciesUpdate flag is disabled', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:^1.0.0',
            b: 'workspace:>=1.0.0',
            c: 'workspace:./foo',
            d: 'file:./foo',
            e: '^1.0.0',
          },
          peerDependencies: {
            a: 'workspace:^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:^1.0.0';

        pkg.updateLocalDependency(resolved, '2.0.0', '^', false, 'version');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "workspace:^2.0.0",
              "b": "workspace:>=1.0.0",
              "c": "workspace:./foo",
              "d": "file:./foo",
              "e": "^1.0.0",
            },
            "peerDependencies": {
              "a": "workspace:^2.0.0",
            },
          }
        `);
      });

      it('works with `workspace:` protocol range and DOES NOT update peerDependencies when allowPeerDependenciesUpdate flag is enabled but the version is a range', () => {
        const pkg = factory({
          dependencies: {
            b: 'workspace:>=1.0.0',
            c: 'workspace:./foo',
            d: 'file:./foo',
            e: '^1.0.0',
          },
          peerDependencies: {
            a: 'workspace:>=1.0.0 < 2.0.0', // ranges will not be bumped
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:>=1.0.0 < 2.0.0';

        pkg.updateLocalDependency(resolved, '2.0.0', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "b": "workspace:>=1.0.0",
              "c": "workspace:./foo",
              "d": "file:./foo",
              "e": "^1.0.0",
            },
            "peerDependencies": {
              "a": "workspace:>=1.0.0 < 2.0.0",
            },
          }
        `);
      });

      it('works with star workspace input target `workspace:*` and will keep same output target', () => {
        const pkg = factory({
          devDependencies: {
            a: 'workspace:*',
            b: 'workspace:^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:*';

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "devDependencies": {
              "a": "workspace:*",
              "b": "workspace:^1.0.0",
            },
          }
        `);
      });

      it('works with caret workspace input target `workspace:^` and will keep same output target', () => {
        const pkg = factory({
          optionalDependencies: {
            a: 'workspace:^',
            b: 'workspace:^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:^';

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "optionalDependencies": {
              "a": "workspace:^",
              "b": "workspace:^1.0.0",
            },
          }
        `);
      });

      it('works with tilde workspace input target `workspace:~` and will keep same output target', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:~',
            b: 'workspace:^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:~';

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "workspace:~",
              "b": "workspace:^1.0.0",
            },
          }
        `);
      });

      it('works with workspace fixed version input target `workspace:X.Y.Z` and will keep same output target', () => {
        const pkg = factory({
          dependencies: {
            b: 'workspace:^1.0.0',
          },
          peerDependencies: {
            a: 'workspace:1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:1.0.0';

        pkg.updateLocalDependency(resolved, '2.0.0', '^', true);

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "b": "workspace:^1.0.0",
            },
            "peerDependencies": {
              "a": "workspace:2.0.0",
            },
          }
        `);
      });

      it('works with operator symbols like >= and workspace input target `workspace:>=X.Y.Z` but will range never be bumped', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:>=1.2.0',
            b: 'workspace:^1.0.0',
          },
        });

        const resolved: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolved.workspaceSpec = 'workspace:>=1.2.0';

        pkg.updateLocalDependency(resolved, '2.0.0', '^');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "workspace:>=1.2.0",
              "b": "workspace:^1.0.0",
            },
          }
        `);
      });
    });

    describe('Publish with `workspace:` protocol', () => {
      it('should transform `workspace:*` protocol to exact range when calling a publish', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:*',
            b: 'workspace:^1.0.0',
          },
          peerDependencies: {
            a: '>=1.0.0', // range will not be bumped
            b: 'workspace:^1.0.0', // will be bumped
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolvedA.workspaceSpec = 'workspace:*';
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0', '.');
        resolvedB.workspaceSpec = 'workspace:^1.0.0';

        pkg.updateLocalDependency(resolvedA, '2.0.0', '^', true, 'publish');
        pkg.updateLocalDependency(resolvedB, '1.1.0', '^', true, 'publish');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "2.0.0",
              "b": "^1.1.0",
            },
            "peerDependencies": {
              "a": ">=1.0.0",
              "b": "^1.1.0",
            },
          }
        `);
      });

      it('should transform `workspace:^` protocol to semver range when calling a publish', () => {
        const pkg = factory({
          dependencies: {
            a: 'workspace:^',
            b: 'workspace:~1.0.0',
          },
          peerDependencies: {
            a: 'workspace:^',
            b: 'workspace:~1.0.0', // will be bumped
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolvedA.workspaceSpec = 'workspace:^';
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0', '.');
        resolvedB.workspaceSpec = 'workspace:~1.0.0';

        pkg.updateLocalDependency(resolvedA, '2.0.0', '^', true, 'publish');
        pkg.updateLocalDependency(resolvedB, '1.1.0', '~', true, 'publish');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "^2.0.0",
              "b": "~1.1.0",
            },
            "peerDependencies": {
              "a": "^2.0.0",
              "b": "~1.1.0",
            },
          }
        `);
      });

      it('should transform `workspace:~` protocol to semver range when calling a publish', () => {
        const pkg = factory({
          dependencies: {
            b: 'workspace:^1.0.0',
          },
          peerDependencies: {
            // workspace: will always be bumped even without flag enabled
            a: 'workspace:>=1.0.0',
            b: '~1.0.0',
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolvedA.workspaceSpec = 'workspace:>=1.0.0';
        const resolvedB: NpaResolveResult = npa.resolve('b', '^1.0.0', '.');
        resolvedB.workspaceSpec = 'workspace:^1.0.0';

        pkg.updateLocalDependency(resolvedA, '2.0.0', '^', false, 'publish');
        pkg.updateLocalDependency(resolvedB, '1.1.0', '^', false, 'publish');

        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "b": "^1.1.0",
            },
            "peerDependencies": {
              "a": ">=1.0.0",
              "b": "~1.0.0",
            },
          }
        `);
      });

      it('should remove `workspace:` prefix on external dependencies without any version bump applied', () => {
        const logErrorSpy = vi.spyOn(log, 'error');
        const pkg = factory({
          dependencies: {
            a: 'workspace:*',
            b: 'workspace:^2.2.4',
          },
          peerDependencies: {
            b: 'workspace:>=2.0.0',
          },
        });

        const resolvedA: NpaResolveResult = npa.resolve('a', '^1.0.0', '.');
        resolvedA.workspaceSpec = 'workspace:*';
        resolvedA.fetchSpec = 'latest';
        const resolvedB: NpaResolveResult = npa.resolve('b', '^2.2.4', '.');
        resolvedB.workspaceSpec = 'workspace:^2.2.4';

        pkg.removeDependencyWorkspaceProtocolPrefix('package-1', resolvedA);
        pkg.removeDependencyWorkspaceProtocolPrefix('package-2', resolvedB);

        expect(logErrorSpy).toHaveBeenCalledWith(
          'publish',
          [
            `Your package named "package-1" has external dependencies not handled by Lerna-Lite and without workspace version suffix, `,
            `we recommend using defined versions with workspace protocol. Your dependency is currently being published with "a": "latest".`,
          ].join('')
        );
        expect(pkg.toJSON()).toMatchInlineSnapshot(`
          {
            "dependencies": {
              "a": "latest",
              "b": "^2.2.4",
            },
            "peerDependencies": {
              "b": "^2.2.4",
            },
          }
        `);
      });
    });
  });
});

describe('Package.lazy()', () => {
  (loadJsonFileSync as Mock).mockImplementation(() => ({ name: 'bar', version: '1.0.0' }));

  it('returns package instance from string directory argument', () => {
    const pkg = Package.lazy('/foo/bar');

    expect(pkg).toBeInstanceOf(Package);
    expect(pkg.location).toMatch(normalize('/foo/bar'));
  });

  it('returns package instance from package.json file argument', () => {
    const pkg = Package.lazy('/foo/bar/package.json');

    expect(pkg).toBeInstanceOf(Package);
    expect(pkg.location).toMatch(normalize('/foo/bar'));
  });

  it('returns package instance from json and dir arguments', () => {
    const pkg = Package.lazy({ name: 'bar', version: '1.2.3' } as RawManifest, '/foo/bar');

    expect(pkg).toBeInstanceOf(Package);
    expect(pkg.version).toBe('1.2.3');
  });

  it('returns existing package instance', () => {
    const existing = new Package({ name: 'existing' } as RawManifest, '/foo/bar', '/foo');
    const pkg = Package.lazy(existing);

    expect(pkg).toBe(existing);
  });
});
