import { log } from '@lerna-lite/npmlog';
// helpers
import { initFixtureFactory } from '@lerna-test/helpers';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { RawManifest } from '../../models/interfaces.js';
import { Package } from '../../package.js';
import * as CatalogUtils from '../../utils/catalog-utils.js';
import { PackageGraphNode } from '../lib/package-graph-node.js';
// file under test
import { PackageGraph } from '../package-graph.js';

const initFixture = initFixtureFactory(__dirname);
const readWorkspaceCatalogConfig = vi.spyOn(CatalogUtils, 'readWorkspaceCatalogConfig');

describe('PackageGraph', () => {
  let testDir = '';

  beforeAll(async () => {
    testDir = await initFixture('pnpm-catalog');
  });

  afterEach(() => {
    // ensure common CWD is restored when individual tests
    // initialize their own fixture (which changes CWD)
    if (process.cwd() !== testDir) {
      process.chdir(testDir);
    }
  });

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

  describe('pnpm workspace catalog', () => {
    beforeAll(async () => {
      testDir = await initFixture('pnpm-catalog');
    });

    it('can read catalog & catalogs from "pnpm-workspace.yaml" file', () => {
      expect(readWorkspaceCatalogConfig('pnpm')).toEqual({
        catalog: {
          'package-1': '2.3.4',
          'fs-extra': '^11.2.0',
          'p-map': '^7.0.3',
          'pkg-1': '1.0.0',
          tinyrainbow: '^2.0.0',
        },
        catalogs: {
          react17: {
            react: '^17.0.2',
            'react-dom': '^17.0.2',
          },
          react18: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
      });
    });

    it('only localizes catalog: siblings when it must be explicit using pnpm', () => {
      const logWarnSpy = vi.spyOn(log, 'warn');
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
              'pkg-1': 'catalog:',
              react: 'catalog:react18',
            },
            peerDependencies: {
              'pkg-1': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-2': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'pnpm');
      const [pkg1, pkg2, pkg3, pkg4] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg3.localDependencies.get('pkg-1').catalogSpec).toBe('catalog:');
      expect(pkg3.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3.externalDependencies.get('react').catalogSpec).toBe('catalog:react18'); // named catalog
      expect(pkg3.externalDependencies.get('react').fetchSpec).toBe('^18.2.0');
      expect(pkg4.localDependencies.get('pkg-2').catalogSpec).toBe('catalog:');
      expect(pkg4.localDependencies.get('pkg-2').fetchSpec).toBe(''); // not found in global catalog so it will show warning below
      expect(logWarnSpy).toHaveBeenCalledWith('graph', 'No version found in "default" catalog for "pkg-2"');
    });

    it('only resolves semver range from global catalog: when defined as catalog and does not override same dependencies name unless defined as catalog:', () => {
      const logWarnSpy = vi.spyOn(log, 'warn');
      const pkgs = [
        new Package(
          {
            name: 'pkg-1',
            version: '1.3.0',
          } as unknown as RawManifest,
          '/test/pkg-1'
        ),
        new Package(
          {
            name: 'pkg-2',
            version: '1.0.0',
            dependencies: {
              'pkg-1': '^1.3.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:',
              react: 'catalog:react18',
            },
            peerDependencies: {
              'pkg-1': '>=1.0.0',
              react: '^18.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-2': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'pnpm');
      const [pkg1, pkg2, pkg3, pkg4] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg3.localDependencies.get('pkg-1').catalogSpec).toBe('catalog:');
      expect(pkg3.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3.externalDependencies.get('react').catalogSpec).toBe('catalog:react18'); // named catalog
      expect(pkg3.externalDependencies.get('react').fetchSpec).toBe('^18.2.0');
      expect(pkg3.pkg.peerDependencies['pkg-1']).toBe('>=1.0.0');
      expect(pkg3.pkg.peerDependencies['react']).toBe('^18.0.0');
      expect(pkg4.localDependencies.get('pkg-2').catalogSpec).toBe('catalog:');
      expect(pkg4.localDependencies.get('pkg-2').fetchSpec).toBe(''); // not found in global catalog so it will show warning below
      expect(logWarnSpy).toHaveBeenCalledWith('graph', 'No version found in "default" catalog for "pkg-2"');
    });

    it('resolves dependencies from catalogs.default when not found in main catalog', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
            'external-pkg': '^3.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:', // should resolve from main catalog
              'pkg-2': 'catalog:', // should resolve from catalogs.default
              'external-pkg': 'catalog:', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'pnpm');
      const pkg3 = graph.get('pkg-3');

      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
      expect(pkg3!.externalDependencies.get('external-pkg').fetchSpec).toBe('^3.0.0');
    });

    it('resolves dependencies using explicit catalog:default specification', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:default', // should resolve from catalogs.default explicitly
              'pkg-2': 'catalog:default', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'pnpm');
      const pkg3 = graph.get('pkg-3');

      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
    });
  });

  describe('yarn workspace catalog', () => {
    beforeAll(async () => {
      testDir = await initFixture('yarn-catalog');
    });

    it('can read catalog & catalogs from "yarn-workspace.yaml" file', () => {
      expect(readWorkspaceCatalogConfig('yarn')).toEqual({
        catalog: {
          'package-1': '2.3.3',
          'fs-extra': '^11.1.0',
          'p-map': '^7.0.3',
          'pkg-1': '1.0.0',
          tinyrainbow: '^2.0.0',
        },
        catalogs: {
          react18: {
            react: '^18.3.2',
            'react-dom': '^18.3.1',
          },
          react19: {
            react: '^19.0.1',
            'react-dom': '^19.0.1',
          },
        },
      });
    });

    it('only localizes catalog: siblings when it must be explicit using yarn', () => {
      const logWarnSpy = vi.spyOn(log, 'warn');
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
              'pkg-1': 'catalog:',
              react: 'catalog:react18',
            },
            peerDependencies: {
              'pkg-1': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-2': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'yarn');
      const [pkg1, pkg2, pkg3, pkg4] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg3.localDependencies.get('pkg-1').catalogSpec).toBe('catalog:');
      expect(pkg3.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3.externalDependencies.get('react').catalogSpec).toBe('catalog:react18'); // named catalog
      expect(pkg3.externalDependencies.get('react').fetchSpec).toBe('^18.3.2');
      expect(pkg4.localDependencies.get('pkg-2').catalogSpec).toBe('catalog:');
      expect(pkg4.localDependencies.get('pkg-2').fetchSpec).toBe(''); // not found in global catalog so it will show warning below
      expect(logWarnSpy).toHaveBeenCalledWith('graph', 'No version found in "default" catalog for "pkg-2"');
    });

    it('only resolves semver range from global catalog: when defined as catalog and does not override same dependencies name unless defined as catalog:', () => {
      const logWarnSpy = vi.spyOn(log, 'warn');
      const pkgs = [
        new Package(
          {
            name: 'pkg-1',
            version: '1.3.0',
          } as unknown as RawManifest,
          '/test/pkg-1'
        ),
        new Package(
          {
            name: 'pkg-2',
            version: '1.0.0',
            dependencies: {
              'pkg-1': '^1.3.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:',
              react: 'catalog:react18',
            },
            peerDependencies: {
              'pkg-1': '>=1.0.0',
              react: '^18.0.0',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-2': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'yarn');
      const [pkg1, pkg2, pkg3, pkg4] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg3.localDependencies.get('pkg-1').catalogSpec).toBe('catalog:');
      expect(pkg3.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3.externalDependencies.get('react').catalogSpec).toBe('catalog:react18'); // named catalog
      expect(pkg3.externalDependencies.get('react').fetchSpec).toBe('^18.3.2');
      expect(pkg3.pkg.peerDependencies['pkg-1']).toBe('>=1.0.0');
      expect(pkg3.pkg.peerDependencies['react']).toBe('^18.0.0');
      expect(pkg4.localDependencies.get('pkg-2').catalogSpec).toBe('catalog:');
      expect(pkg4.localDependencies.get('pkg-2').fetchSpec).toBe(''); // not found in global catalog so it will show warning below
      expect(logWarnSpy).toHaveBeenCalledWith('graph', 'No version found in "default" catalog for "pkg-2"');
    });

    it('resolves dependencies from catalogs.default when not found in main catalog', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
            'external-pkg': '^3.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:', // should resolve from main catalog
              'pkg-2': 'catalog:', // should resolve from catalogs.default
              'external-pkg': 'catalog:', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'yarn');
      const pkg3 = graph.get('pkg-3');

      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
      expect(pkg3!.externalDependencies.get('external-pkg').fetchSpec).toBe('^3.0.0');
    });

    it('resolves dependencies using explicit catalog:default specification', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:default', // should resolve from catalogs.default explicitly
              'pkg-2': 'catalog:default', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'yarn');
      const pkg3 = graph.get('pkg-3');

      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
    });
  });

  describe('package.json top-level catalog', () => {
    beforeAll(async () => {
      testDir = await initFixture('package-catalog');
    });

    it('can read catalog & catalogs from "package.json" file', () => {
      expect(readWorkspaceCatalogConfig('bun')).toEqual({
        catalog: {
          'package-1': '2.3.4',
          'fs-extra': '^11.2.0',
          'p-map': '^7.0.3',
          'pkg-1': '1.0.0',
          tinyrainbow: '^2.0.0',
        },
        catalogs: {
          react17: {
            react: '^17.0.2',
            'react-dom': '^17.0.2',
          },
          react18: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
      });
    });

    it('only localizes catalog: siblings when it must be explicit using bun', () => {
      const logWarnSpy = vi.spyOn(log, 'warn');
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
              'pkg-1': 'catalog:',
              react: 'catalog:react18',
            },
            peerDependencies: {
              'pkg-1': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-2': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'bun');
      const [pkg1, pkg2, pkg3, pkg4] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg3.localDependencies.get('pkg-1').catalogSpec).toBe('catalog:');
      expect(pkg3.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3.externalDependencies.get('react').catalogSpec).toBe('catalog:react18'); // named catalog
      expect(pkg3.externalDependencies.get('react').fetchSpec).toBe('^18.2.0');
      expect(pkg4.localDependencies.get('pkg-2').catalogSpec).toBe('catalog:');
      expect(pkg4.localDependencies.get('pkg-2').fetchSpec).toBe(''); // not found in global catalog so it will show warning below
      expect(logWarnSpy).toHaveBeenCalledWith('graph', 'No version found in "default" catalog for "pkg-2"');
    });

    it('resolves dependencies from catalogs.default when not found in main catalog using bun', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
            'external-pkg': '^3.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:', // should resolve from main catalog
              'pkg-2': 'catalog:', // should resolve from catalogs.default
              'external-pkg': 'catalog:', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'bun');
      const pkg3 = graph.get('pkg-3');

      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
      expect(pkg3!.externalDependencies.get('external-pkg').fetchSpec).toBe('^3.0.0');
    });

    it('resolves dependencies using explicit catalog:default specification using bun', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:default', // should resolve from catalogs.default explicitly
              'pkg-2': 'catalog:default', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'bun');
      const pkg3 = graph.get('pkg-3');

      // pkg-1 should resolve to 1.5.0 from catalogs.default, not 1.0.0 from main catalog
      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
    });
  });

  describe('package.json workspace catalog', () => {
    beforeAll(async () => {
      testDir = await initFixture('package-workspaces-catalog');
    });

    it('can read catalog & catalogs from "package.json" file', () => {
      expect(readWorkspaceCatalogConfig('bun')).toEqual({
        catalog: {
          'package-1': '2.3.4',
          'fs-extra': '^11.2.0',
          'p-map': '^7.0.3',
          'pkg-1': '1.0.0',
          tinyrainbow: '^2.0.0',
        },
        catalogs: {
          react17: {
            react: '^17.0.2',
            'react-dom': '^17.0.2',
          },
          react18: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
      });
    });

    it('only localizes catalog: siblings when it must be explicit using bun', () => {
      const logWarnSpy = vi.spyOn(log, 'warn');
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
              'pkg-1': 'catalog:',
              react: 'catalog:react18',
            },
            peerDependencies: {
              'pkg-1': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
        new Package(
          {
            name: 'pkg-4',
            version: '1.0.0',
            dependencies: {
              'pkg-2': 'catalog:',
            },
          } as unknown as RawManifest,
          '/test/pkg-4'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'bun');
      const [pkg1, pkg2, pkg3, pkg4] = graph.values();

      expect(pkg1.localDependents.has('pkg-2')).toBe(false);
      expect(pkg2.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg1.localDependents.has('pkg-3')).toBe(true);
      expect(pkg3.localDependencies.has('pkg-1')).toBe(true);
      expect(pkg4.localDependencies.has('pkg-1')).toBe(false);
      expect(pkg3.localDependencies.get('pkg-1').catalogSpec).toBe('catalog:');
      expect(pkg3.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3.externalDependencies.get('react').catalogSpec).toBe('catalog:react18'); // named catalog
      expect(pkg3.externalDependencies.get('react').fetchSpec).toBe('^18.2.0');
      expect(pkg4.localDependencies.get('pkg-2').catalogSpec).toBe('catalog:');
      expect(pkg4.localDependencies.get('pkg-2').fetchSpec).toBe(''); // not found in global catalog so it will show warning below
      expect(logWarnSpy).toHaveBeenCalledWith('graph', 'No version found in "default" catalog for "pkg-2"');
    });

    it('resolves dependencies from catalogs.default when not found in main catalog using bun', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
            'external-pkg': '^3.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:', // should resolve from main catalog
              'pkg-2': 'catalog:', // should resolve from catalogs.default
              'external-pkg': 'catalog:', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'bun');
      const pkg3 = graph.get('pkg-3');

      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
      expect(pkg3!.externalDependencies.get('external-pkg').fetchSpec).toBe('^3.0.0');
    });

    it('resolves dependencies using explicit catalog:default specification using bun', () => {
      readWorkspaceCatalogConfig.mockReturnValueOnce({
        catalog: {},
        catalogs: {
          default: {
            'pkg-1': '1.0.0',
            'pkg-2': '2.0.0',
          },
        },
      });

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
          } as unknown as RawManifest,
          '/test/pkg-2'
        ),
        new Package(
          {
            name: 'pkg-3',
            version: '1.0.0',
            dependencies: {
              'pkg-1': 'catalog:default', // should resolve from catalogs.default explicitly
              'pkg-2': 'catalog:default', // should resolve from catalogs.default
            },
          } as unknown as RawManifest,
          '/test/pkg-3'
        ),
      ];

      const graph = new PackageGraph(pkgs, 'allDependencies', 'explicit', 'bun');
      const pkg3 = graph.get('pkg-3');

      // pkg-1 should resolve to 1.5.0 from catalogs.default, not 1.0.0 from main catalog
      expect(pkg3!.localDependencies.get('pkg-1').fetchSpec).toBe('1.0.0');
      expect(pkg3!.localDependencies.get('pkg-2').fetchSpec).toBe('2.0.0');
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

      const search = filtered.map((name: string) => graph.get(name)!.pkg);
      const result = (graph as any)[method](search);

      expect(result.map((pkg: Package) => pkg.name)).toEqual(expected);
    });
  });
});
