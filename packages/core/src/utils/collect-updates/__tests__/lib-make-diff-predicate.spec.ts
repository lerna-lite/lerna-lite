import { beforeEach, expect, Mock, test, vi } from 'vitest';

vi.mock('../../../child-process');

// mocked modules
import * as childProcesses from '../../../child-process.js';

const { globMock } = vi.hoisted(() => ({ globMock: vi.fn() }));
vi.mock('tinyglobby', async () => ({
  ...(await vi.importActual('tinyglobby')),
  globSync: globMock,
}));
const { readFileMock } = vi.hoisted(() => ({ readFileMock: vi.fn() }));
vi.mock('node:fs', async () => ({
  ...(await vi.importActual('node:fs')),
  readFileSync: readFileMock,
}));

// file under test
import { PackageGraphNode } from '../../../../dist/index.js';
import { diffWorkspaceCatalog, makeDiffPredicate } from '../lib/make-diff-predicate.js';

function setup(changes) {
  (childProcesses.execSync as Mock).mockReturnValueOnce([].concat(changes).join('\n'));
}

beforeEach(() => {
  (readFileMock as Mock).mockReset();
  (childProcesses.execSync as Mock).mockReset();
});

test('git diff call', () => {
  setup(['packages/pkg-1/__tests__/index.test.js', 'packages/pkg-1/index.js', 'packages/pkg-1/package.json', 'packages/pkg-1/README.md']);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], { cwd: '/test' });
});

test('empty diff', () => {
  setup('');

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    localDependencies: new Map([]),
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(false);
});

test('rooted package', () => {
  setup('package.json');

  const hasDiff = makeDiffPredicate('deadbeef', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test',
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'deadbeef'], {
    cwd: '/test',
  });
});

test('ignore changes (globstars)', () => {
  setup(['packages/pkg-2/examples/.eslintrc.yaml', 'packages/pkg-2/examples/do-a-thing/index.js', 'packages/pkg-2/examples/and-another-thing/package.json']);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, ['**/examples/**', '*.md'], [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-2',
    localDependencies: new Map([]),
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(false);
});

test('ignore changes (match base)', () => {
  setup('packages/pkg-3/README.md');

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, ['*.md'], [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-3',
    localDependencies: new Map([]),
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(false);
});

test('exclude subpackages when --independent-subpackages option is enabled and nested package.json is found', () => {
  globMock.mockReturnValueOnce(['packages/pkg-2/and-another-thing/package.json']);

  setup(['packages/pkg-2/package.json', 'packages/pkg-2/do-a-thing/index.js', 'packages/pkg-2/and-another-thing/package.json']);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, ['**/examples/**', '*.md'], [], {
    independentSubpackages: true,
  });
  const result = hasDiff({
    location: '/test/packages/pkg-2',
    localDependencies: new Map([]),
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith(
    'git',
    ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-2', ':^packages/pkg-2/packages/pkg-2/and-another-thing'],
    {
      cwd: '/test',
    }
  );
});

test('not exclude any subpackages when --independent-subpackages option is enabled but no nested package.json are found', () => {
  globMock.mockReturnValueOnce([]);

  setup(['packages/pkg-2/package.json', 'packages/pkg-2/do-a-thing/index.js', 'packages/pkg-2/and-another-thing/method.js']);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, ['**/examples/**', '*.md'], [], {
    independentSubpackages: true,
  });
  const result = hasDiff({
    location: '/test/packages/pkg-2',
    localDependencies: new Map([]),
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-2'], {
    cwd: '/test',
  });
});

test('diffWorkspaceCatalog with external dependency changes in pnpm workspace catalog', () => {
  setup([]);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, ['vite'], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    localDependencies: new Map([]),
    externalDependencies: new Map([['vite', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], { cwd: '/test' });
});

test('diffWorkspaceCatalog with local dependency changes in pnpm workspace catalog', () => {
  setup([]);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, ['@mono/pkg-1'], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    localDependencies: new Map([['@mono/pkg-1', {}]]),
    externalDependencies: new Map([]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], { cwd: '/test' });
});

test('diff workspace catalog returning dependencies that changed in the catalog', () => {
  // make a diff on the catalog for the "execa" dependency
  const mockPrevCatalogCommit = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^11.3.0';
  const mockNewCatalogCommit = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';
  const diff =
    'diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml\nindex 1994993f..bf229582 100644\n--- a/pnpm-workspace.yaml\n+++ b/pnpm-workspace.yaml\n@@ -5,16 +5,16 @@ catalog:' +
    '\n-  execa: ^8.0.1\n+  execa: ^9.5.2\n   fs-extra: ^11.3.0' +
    'diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml\nindex 1994993f..bf229582 100644\n--- a/pnpm-workspace.yaml\n+++ b/pnpm-workspace.yaml' +
    '\n@@ -11,13 +11,13 @@ catalog:\n-  execa: ^8.0.1\n+  execa: ^9.5.2\n   fs-extra: ^11.3.0\n@@ -30,7 +30,7';

  (readFileMock as Mock).mockName('readFile').mockReturnValueOnce(mockNewCatalogCommit);
  (childProcesses.execSync as Mock)
    .mockReturnValueOnce(mockPrevCatalogCommit) // first call is to get previous catalog commit
    .mockReturnValueOnce(diff); // next call is to get diff between current and previous catalog

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual(['execa']);
});

test('diffWorkspaceCatalog returns changed external dependencies when catalog values differ', () => {
  const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^11.3.0';
  const curr = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual(['execa']);
});

test('diffWorkspaceCatalog returns changed local dependencies when catalog values differ', () => {
  const prev = 'packages:\n  - packages/**\n\ncatalog:\n  "@mono/pkg-1": ^8.0.0\n  fs-extra: ^11.3.0';
  const curr = 'packages:\n  - packages/**\n\ncatalog:\n  "@mono/pkg-1": ^9.5.2\n  fs-extra: ^11.3.0';
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual(['@mono/pkg-1']);
});

test('diffWorkspaceCatalog returns multiple changed dependencies', () => {
  const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^10.0.0';
  const curr = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes.sort()).toEqual(['execa', 'fs-extra']);
});

test('diffWorkspaceCatalog returns empty array if no changes', () => {
  const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';
  const curr = prev;
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual([]);
});

test('diffWorkspaceCatalog returns empty array if catalog key is missing', () => {
  const prev = 'packages:\n  - packages/**\n\n';
  const curr = 'packages:\n  - packages/**\n\n';
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual([]);
});

test('diffWorkspaceCatalog returns empty array if all methods fail', () => {
  (readFileMock as Mock).mockImplementationOnce(() => {
    throw new Error('fail');
  });
  (childProcesses.execSync as Mock)
    .mockImplementationOnce(() => {
      throw new Error('fail');
    }) // fail YAML parse
    .mockImplementationOnce(() => {
      throw new Error('fail');
    }); // fail git diff

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual([]);
});

test('diffWorkspaceCatalog adds dependency from indented diff line when YAML shows no changes', () => {
  const prev = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0';
  const curr = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0';
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock)
    .mockReturnValueOnce(prev) // previous YAML
    .mockReturnValueOnce('+  bar: ^2.0.0\n'); // diff output

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual(['bar']);
});

test('diffWorkspaceCatalog adds dependency from dot notation diff line when YAML shows no changes', () => {
  const prev = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0';
  const curr = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0';
  (readFileMock as Mock).mockReturnValueOnce(curr);
  (childProcesses.execSync as Mock)
    .mockReturnValueOnce(prev) // previous YAML
    .mockReturnValueOnce('+ catalog.baz: ^3.0.0\n'); // diff output

  const changes = diffWorkspaceCatalog('v1.0.0');
  expect(changes).toEqual(['baz']);
});
