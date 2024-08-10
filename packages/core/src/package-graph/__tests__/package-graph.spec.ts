import { describe, expect, it } from 'vitest';

import { RawManifest } from '../../models/index.js';
import { Package } from '../../package.js';
import { PackageGraphNode } from '../lib/package-graph-node.js';

// file under test
import { PackageGraph } from '../package-graph.js';

describe('PackageGraph', () => {
  describe('constructor', () => {
    it('throws an error when duplicate package names are present', () => {
      const pkgs = [
        new Package({ name: 'pkg-1', version: '1.0.0' } as Package, '/test/pkg-1', '/test'),
        new Package({ name: 'pkg-2', version: '2.0.0' } as Package, '/test/pkg-2', '/test'),
        new Package({ name: 'pkg-2', version: '3.0.0' } as Package, '/test/pkg-3', '/test'),
      ];

      expect(() => new PackageGraph(pkgs)).toThrowError('Package name "pkg-2" used in multiple packages:\n\t/test/pkg-2\n\t/test/pkg-3');
    });

    it('externalizes non-satisfied semver of local sibling', () => {
      const pkgs = [
        new Package(
          {
            name: 'pkg-1',
            version: '1.0.0',
            optionalDependencies: {
              // non-circular external
              'pkg-2': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-1'
        ),
        new Package(
          {
            name: 'pkg-2',
            version: '2.0.0',
            devDependencies: {
              'pkg-1': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '3.0.0',
            dependencies: {
              'pkg-2': '^2.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];
      const graph = new PackageGraph(pkgs);

      expect(graph.get('pkg-1')!.externalDependencies.has('pkg-2')).toBe(true);
      expect(graph.get('pkg-2')!.localDependents.has('pkg-1')).toBe(false);
      expect(graph.get('pkg-2')!.localDependencies.has('pkg-1')).toBe(true);
      expect(graph.get('pkg-3')!.localDependencies.has('pkg-2')).toBe(true);
    });

    it('localizes all non-satisfied siblings when forced', () => {
      const pkgs = [
        new Package(
          {
            name: 'pkg-1',
            version: '1.0.0',
          } as unknown as RawManifest,
          '/test/pkg-1'
        ),
        new Package(
          {
            name: 'pkg-2',
            version: '2.0.0',
            dependencies: {
              // non-circular external
              'pkg-1': '^2.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
      ];
      const graph = new PackageGraph(pkgs, 'allDependencies', true);
      const [pkg1, pkg2] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(true);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(true);
    });

    it('only localizes workspace: siblings when it must be explicit', () => {
      const pkgs = [
        new Package(
          {
            name: 'pkg-1',
            version: '1.0.0',
          } as unknown as RawManifest,
          '/test/pkg-1'
        ),
        new Package(
          {
            name: 'pkg-2',
            version: '1.0.0',
            dependencies: {
              'pkg-1': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'workspace:^1.0.0',
            },
            peerDependencies: {
              'pkg-1': 'workspace:^1.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'workspace:*',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
        new Package(
          {
            name: 'pkg-5',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'workspace:^',
              'pkg-2': 'workspace:~',
              'pkg-3': 'workspace:^1.0.0',
              'pkg-4': 'workspace:>=1.0.0',
            },
            peerDependencies: {
              'pkg-1': 'workspace:^1.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-5'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit');
      const [pkg1, pkg2, pkg3, pkg4, pkg5] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.get('pkg-1').workspaceSpec).toBe('workspace:*');
      expect(pkg5.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg5.localDependencies.has('pkg-2')).toBe(true);
      expect(pkg5.localDependencies.get('pkg-1').workspaceSpec).toBe('workspace:^');
      expect(pkg5.localDependencies.get('pkg-2').workspaceSpec).toBe('workspace:~');
      expect(pkg5.localDependencies.get('pkg-3').workspaceSpec).toBe('workspace:^1.0.0');
      expect(pkg5.localDependencies.get('pkg-4').workspaceSpec).toBe('workspace:>=1.0.0');
    });
  });

  describe('Node', () => {
    it('proxies Package properties', () => {
      const pkg = new Package({ name: 'my-pkg', version: '1.2.3' } as unknown as RawManifest, '/path/to/my-pkg');
      const graph = new PackageGraph([pkg]);
      const node = graph.get('my-pkg') as PackageGraphNode;

      // most of these properties are non-enumerable, so a snapshot doesn't work
      expect(node.name).toBe('my-pkg');
      expect(node.location).toBe('/path/to/my-pkg');
      expect(node.prereleaseId).toBeUndefined();
      expect(node.version).toBe('1.2.3');
      expect(node.pkg).toBe(pkg);
    });

    it('exposes graph-specific Map properties', () => {
      const node = new PackageGraph([new Package({ name: 'my-pkg', version: '4.5.6' } as unknown as RawManifest, '/path/to/my-pkg')]).get('my-pkg');

      expect(node).toHaveProperty('externalDependencies', expect.any(Map));
      expect(node).toHaveProperty('localDependencies', expect.any(Map));
      expect(node).toHaveProperty('localDependents', expect.any(Map));
    });

    it('handles yarn patch protocol versions transparently and without hiccups', () => {
      const pkg = new Package(
        {
          name: 'my-pkg',
          version: '1.0.0',
          dependencies: {
            '@ionic-native/splash-screen':
              'patch:@ionic-native/splash-screen@npm%3A5.36.0#~/.yarn/patches/@ionic-native-splash-screen-npm-5.36.0-531cbbe0f8.patch',
          },
        } as unknown as RawManifest,
        '/path/to/my-pkg'
      );
      const node = new PackageGraph([pkg]).get('my-pkg');
      expect(node?.externalDependencies.get('@ionic-native/splash-screen').rawSpec).toBe('5.36.0');
      expect(node?.externalDependencies.get('@ionic-native/splash-screen').fetchSpec).toBe('5.36.0');
      expect(node).toHaveProperty('externalDependencies', expect.any(Map));
      expect(node).toHaveProperty('localDependencies', expect.any(Map));
      expect(node).toHaveProperty('localDependents', expect.any(Map));
    });

    it('computes prereleaseId from prerelease version', () => {
      const node = new PackageGraph([new Package({ name: 'my-pkg', version: '1.2.3-rc.4' } as unknown as RawManifest, '/path/to/my-pkg')]).get(
        'my-pkg'
      ) as PackageGraphNode;

      expect(node.prereleaseId).toBe('rc');
    });

    describe('.toString()', () => {
      it("returns the node's name", () => {
        const node = new PackageGraph([new Package({ name: 'pkg-name', version: '0.1.2' } as unknown as RawManifest, '/path/to/pkg-name')]).get(
          'pkg-name'
        ) as PackageGraphNode;

        expect(node.toString()).toBe('pkg-name');
      });
    });
  });

  describe('.get()', () => {
    it('should return a node with localDependencies', () => {
      const packages = [
        new Package(
          {
            name: 'my-package-1',
            version: '1.0.0',
            dependencies: {
              'external-thing': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/path/to/package-1'
        ),
        new Package(
          {
            name: 'my-package-2',
            version: '1.0.0',
            devDependencies: {
              'my-package-1': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/path/to/package-2'
        ),
      ];
      const graph = new PackageGraph(packages, 'allDependencies');

      expect(graph.get('my-package-1')!.localDependencies.size).toBe(0);
      expect(graph.get('my-package-2')!.localDependencies.has('my-package-1')).toBe(true);
    });

    it('should skip gitCommittish of packages that are not in localDependencies', () => {
      const packages = [
        new Package(
          {
            name: 'my-package-1',
            version: '1.0.0',
            devDependencies: {
              'my-package-2': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/path/to/package-1'
        ),
        new Package(
          {
            name: 'my-package-2',
            version: '1.0.0',
            dependencies: {
              'external-thing': 'github:user-foo/project-foo#v1.0.0',
            },
          } as unknown as RawManifest,
          '/path/to/package-2'
        ),
      ];
      const graph = new PackageGraph(packages, 'dependencies');

      expect(graph.get('my-package-1')!.localDependencies.size).toBe(0);
      expect(graph.get('my-package-2')!.localDependencies.size).toBe(0);
    });

    it('should return the localDependencies for matched gitCommittish', () => {
      const packages = [
        new Package(
          {
            name: 'my-package-1',
            version: '1.0.0',
            dependencies: {
              'external-thing': '^1.0.0',
            },
          } as unknown as RawManifest,
          '/path/to/package-1'
        ),
        new Package(
          {
            name: 'my-package-2',
            version: '1.0.0',
            devDependencies: {
              'my-package-1': 'github:user-foo/project-foo#v1.0.0',
            },
          } as unknown as RawManifest,
          '/path/to/package-2'
        ),
      ];
      const graph = new PackageGraph(packages);

      expect(graph.get('my-package-2')!.localDependencies.has('my-package-1')).toBe(true);
    });
  });

  describe('.rawPackageList', () => {
    it('retuns an array of Package instances', () => {
      const pkgs = [
        new Package({ name: 'pkg-1', version: '1.0.0' } as unknown as RawManifest, '/test/pkg-1', '/test'),
        new Package({ name: 'pkg-2', version: '2.0.0' } as unknown as RawManifest, '/test/pkg-2', '/test'),
      ];
      const graph = new PackageGraph(pkgs);

      expect(graph.rawPackageList).toEqual(pkgs);
    });
  });

  describe.each`
    method               | filtered     | expected
    ${'addDependencies'} | ${['pkg-a']} | ${['pkg-a', 'pkg-b']}
    ${'addDependents'}   | ${['pkg-d']} | ${['pkg-d', 'pkg-c']}
  `('.$method()', ({ method, filtered, expected }) => {
    it(`extends ${filtered} to ${expected}`, () => {
      const pkgs = [
        { name: 'pkg-a', version: '1.0.0', dependencies: { 'pkg-b': '1.0.0' } },
        { name: 'pkg-b', version: '1.0.0', dependencies: {} },
        { name: 'pkg-c', version: '1.0.0', dependencies: { 'pkg-d': '1.0.0' } },
        { name: 'pkg-d', version: '1.0.0', dependencies: { 'pkg-c': '1.0.0' } },
        // cycle c <-> d catches nested search.add()
      ].map((json) => new Package(json as unknown as RawManifest, `/test/${json.name}`, '/test'));
      const graph = new PackageGraph(pkgs);

      const search = filtered.map((name) => graph.get(name)!.pkg);
      const result = graph[method](search);

      expect(result.map((pkg) => pkg.name)).toEqual(expected);
    });
  });
});
