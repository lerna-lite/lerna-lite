import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it, vi } from 'vitest';

import * as childProcess from '../child-process.js';
import { PackageGraph } from '../package-graph/package-graph.js';
import { Package } from '../package.js';
import * as catalogs from '../utils/catalog-utils.js';
import { makeDiffPredicate } from '../utils/collect-updates/lib/make-diff-predicate.js';

afterEach(() => vi.restoreAllMocks());

const pkg = (name: string, fields = {}) => new Package({ name, version: '2.0.0', ...fields }, `/test/${name}`, '/test');

it.each(['auto', 'explicit'] as const)('respects catalog ranges when resolving local dependencies in %s mode', (mode) => {
  vi.spyOn(catalogs, 'readWorkspaceCatalogConfig').mockReturnValue({ catalog: { a: '^1.0.0' }, catalogs: {} });
  const graph = new PackageGraph([pkg('a'), pkg('b', { dependencies: { a: 'catalog:' } })], 'allDependencies', mode, 'pnpm');
  expect(graph.get('b')!.localDependencies.has('a')).toBe(false);
  expect(graph.get('b')!.externalDependencies.get('a').fetchSpec).toBe('^1.0.0');
});

it('rejects missing named catalog entries instead of publishing a default version', () => {
  const b = pkg('b', { dependencies: { a: 'catalog:missing' } });
  expect(() => b.resolveDependencyCatalogProtocol(b, { catalog: { a: '^1.0.0' }, catalogs: {} })).toThrow(
    'No version found in "missing" catalog for "a"'
  );
});

it.each(['version', 'publish'] as const)('resolves each workspace declaration separately during %s', (command) => {
  const b = pkg('b', {
    dependencies: { a: 'workspace:^' },
    devDependencies: { a: 'workspace:*' },
    optionalDependencies: { a: 'workspace:~2.0.0' },
    peerDependencies: { a: 'workspace:~' },
  });
  const graph = new PackageGraph([pkg('a'), b]);
  b.updateLocalDependency(graph.get('b')!.localDependencies.get('a'), '3.0.0', '^', false, command);
  if (command === 'version') {
    expect(b.dependencies.a).toBe('workspace:^');
    expect(b.devDependencies.a).toBe('workspace:*');
    expect(b.optionalDependencies.a).toBe('workspace:~3.0.0');
    expect(b.peerDependencies.a).toBe('workspace:~');
  } else {
    expect(b.dependencies.a).toBe('^3.0.0');
    expect(b.devDependencies.a).toBe('3.0.0');
    expect(b.optionalDependencies.a).toBe('~3.0.0');
    expect(b.peerDependencies.a).toBe('~3.0.0');
  }
});

it.each([false, true])('only treats catalog references as changed after a catalog edit (uses catalog: %s)', (usesCatalog) => {
  vi.spyOn(childProcess, 'execSync').mockReturnValue('');
  vi.spyOn(catalogs, 'readWorkspaceCatalogConfig').mockReturnValue({ catalog: { react: '^18.0.0' }, catalogs: {} });
  const graph = new PackageGraph([pkg('b', { dependencies: { react: usesCatalog ? 'catalog:' : '^18.0.0' } })]);
  const predicate = makeDiffPredicate('v1.0.0', { cwd: '/test' }, [], ['react'], {});
  expect(predicate(graph.get('b')!)).toBe(usesCatalog);
});

it.each(['pnpm', 'yarn', 'bun'] as const)('reads %s catalogs from the supplied project root', (client) => {
  const root = mkdtempSync(join(tmpdir(), 'lerna-protocol-test-'));
  try {
    mkdirSync(join(root, 'packages'));
    writeFileSync(join(root, client === 'yarn' ? '.yarnrc.yml' : 'pnpm-workspace.yaml'), 'catalog:\n  react: ^18.0.0\n');
    writeFileSync(join(root, 'package.json'), JSON.stringify({ catalog: { react: '^18.0.0' } }));
    const b = new Package({ name: 'b', version: '1.0.0', dependencies: { react: 'catalog:' } }, join(root, 'packages'), root);
    const graph = new PackageGraph([b], 'allDependencies', 'auto', client, root);
    expect(graph.get('b')!.externalDependencies.get('react').fetchSpec).toBe('^18.0.0');
    expect(graph.hasWorkspaceCatalog).toBe(true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('detects a catalog reference in devDependencies when a runtime declaration masks its graph metadata', () => {
  vi.spyOn(childProcess, 'execSync').mockReturnValue('');
  const b = pkg('b', { dependencies: { react: '^18.0.0' }, devDependencies: { react: 'catalog:' } });
  const graph = new PackageGraph([b]);
  expect(makeDiffPredicate('v1.0.0', { cwd: '/test' }, [], ['react'], {})(graph.get('b')!)).toBe(true);
});
