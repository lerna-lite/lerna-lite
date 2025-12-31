import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import type { PackageGraphNode } from '../../../../dist/index.js';
import * as childProcesses from '../../../child-process.js';
import { diffWorkspaceCatalog, makeDiffPredicate } from '../lib/make-diff-predicate.js';

vi.mock('../../../child-process');

const { globMock } = vi.hoisted(() => ({ globMock: vi.fn() }));
vi.mock('tinyglobby', async () => ({
  ...(await vi.importActual('tinyglobby')),
  globSync: globMock,
}));
const { existsFileMock } = vi.hoisted(() => ({ existsFileMock: vi.fn() }));
const { readFileMock } = vi.hoisted(() => ({ readFileMock: vi.fn() }));
vi.mock('node:fs', async () => ({
  ...(await vi.importActual('node:fs')),
  existsSync: existsFileMock,
  readFileSync: readFileMock,
}));

function setup(changes: string | string[]) {
  (childProcesses.execSync as Mock).mockReturnValueOnce(([] as string[]).concat(changes).join('\n'));
}

beforeEach(() => {
  readFileMock.mockReset();
  (childProcesses.execSync as Mock).mockReset();
});

test('git diff call', () => {
  setup([
    'packages/pkg-1/__tests__/index.test.js',
    'packages/pkg-1/index.js',
    'packages/pkg-1/package.json',
    'packages/pkg-1/README.md',
  ]);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    externalDependencies: new Map([['pkg-2', {}]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], {
    cwd: '/test',
  });
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
  setup([
    'packages/pkg-2/examples/.eslintrc.yaml',
    'packages/pkg-2/examples/do-a-thing/index.js',
    'packages/pkg-2/examples/and-another-thing/package.json',
  ]);

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

describe('pnpm workspace catalog', () => {
  test('diffWorkspaceCatalog with external dependency changes in pnpm workspace catalog', () => {
    setup([]);

    const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, ['vite'], {});
    const result = hasDiff({
      location: '/test/packages/pkg-1',
      localDependencies: new Map([]),
      externalDependencies: new Map([['vite', {}]]),
    } as PackageGraphNode);

    expect(result).toBe(true);
    expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], {
      cwd: '/test',
    });
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
    expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], {
      cwd: '/test',
    });
  });

  test('diff pnpm workspace catalog returning dependencies that changed in the catalog', () => {
    // make a diff on the catalog for the "execa" dependency
    const prevFileContent = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.1\n  fs-extra: ^11.3.0';
    const newFileContent = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent); // first call is to get previous catalog commit

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual(['execa']);
  });

  test('diff pnpm workspace catalogs returning dependencies that changed in the catalog', () => {
    // make a diff on the catalog for the "execa" dependency
    const prevFileContent = 'packages:\n  - packages/**\n\ncatalogs:\n  build:\n    execa: ^8.0.1\n    fs-extra: ^11.3.0';
    const newFileContent = 'packages:\n  - packages/**\n\ncatalogs:\n  build:\n    execa: ^9.5.2\n    fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent); // first call is to get previous catalog commit

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual(['execa']);
  });

  test('diff pnpm workspace catalog returns changed external dependencies when catalog values differ', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^11.3.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual(['execa']);
  });

  test('diff pnpm workspace catalog returns changed local dependencies when catalog values differ', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  "@mono/pkg-1": ^8.0.0\n  fs-extra: ^11.3.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  "@mono/pkg-1": ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual(['@mono/pkg-1']);
  });

  test('diff pnpm workspace catalog returns multiple changed dependencies', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^10.0.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes.sort()).toEqual(['execa', 'fs-extra']);
  });

  test('diff pnpm workspace catalog returns empty array if no changes', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';
    const curr = prev;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual([]);
  });

  test('diff pnpm workspace catalog returns empty array if catalog key is missing', () => {
    const prev = 'packages:\n  - packages/**\n\n';
    const curr = 'packages:\n  - packages/**\n\n';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual([]);
  });

  test('diff pnpm workspace catalog returns empty array if all methods fail', () => {
    readFileMock.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    (childProcesses.execSync as Mock)
      .mockImplementationOnce(() => {
        throw new Error('fail');
      }) // fail YAML parse
      .mockImplementationOnce(() => {
        throw new Error('fail');
      }); // fail git diff

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual([]);
  });

  test('diff pnpm workspace catalog adds dependency from indented diff line when YAML shows no changes', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0\n  bar: ^2.0.0';
    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev); // previous YAML

    const changes = diffWorkspaceCatalog('v1.0.0', 'pnpm');
    expect(changes).toEqual(['bar']);
  });
});

describe('yarn workspace catalog', () => {
  test('diffWorkspaceCatalog with external dependency changes in yarn workspace catalog', () => {
    setup([]);

    const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, ['vite'], {});
    const result = hasDiff({
      location: '/test/packages/pkg-1',
      localDependencies: new Map([]),
      externalDependencies: new Map([['vite', {}]]),
    } as PackageGraphNode);

    expect(result).toBe(true);
    expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], {
      cwd: '/test',
    });
  });

  test('diffWorkspaceCatalog with local dependency changes in yarn workspace catalog', () => {
    setup([]);

    const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, ['@mono/pkg-1'], {});
    const result = hasDiff({
      location: '/test/packages/pkg-1',
      localDependencies: new Map([['@mono/pkg-1', {}]]),
      externalDependencies: new Map([]),
    } as PackageGraphNode);

    expect(result).toBe(true);
    expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], {
      cwd: '/test',
    });
  });

  test('diff yarn workspace catalog returning dependencies that changed in the catalog', () => {
    // make a diff on the catalog for the "execa" dependency
    const prevFileContent = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.1\n  fs-extra: ^11.3.0';
    const newFileContent = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent); // first call is to get previous catalog commit

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual(['execa']);
  });

  test('diff yarn workspace catalogs returning dependencies that changed in the catalog', () => {
    // make a diff on the catalog for the "execa" dependency
    const prevFileContent = 'packages:\n  - packages/**\n\ncatalogs:\n  build:\n    execa: ^8.0.1\n    fs-extra: ^11.3.0';
    const newFileContent = 'packages:\n  - packages/**\n\ncatalogs:\n  build:\n    execa: ^9.5.2\n    fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent); // first call is to get previous catalog commit

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual(['execa']);
  });

  test('diff yarn workspace catalog returns changed external dependencies when catalog values differ', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^11.3.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual(['execa']);
  });

  test('diff yarn workspace catalog returns changed local dependencies when catalog values differ', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  "@mono/pkg-1": ^8.0.0\n  fs-extra: ^11.3.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  "@mono/pkg-1": ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual(['@mono/pkg-1']);
  });

  test('diff yarn workspace catalog returns multiple changed dependencies', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^8.0.0\n  fs-extra: ^10.0.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes.sort()).toEqual(['execa', 'fs-extra']);
  });

  test('diff yarn workspace catalog returns empty array if no changes', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  execa: ^9.5.2\n  fs-extra: ^11.3.0';
    const curr = prev;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual([]);
  });

  test('diff yarn workspace catalog returns empty array if catalog key is missing', () => {
    const prev = 'packages:\n  - packages/**\n\n';
    const curr = 'packages:\n  - packages/**\n\n';

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev);

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual([]);
  });

  test('diff yarn workspace catalog returns empty array if all methods fail', () => {
    readFileMock.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    (childProcesses.execSync as Mock)
      .mockImplementationOnce(() => {
        throw new Error('fail');
      }) // fail YAML parse
      .mockImplementationOnce(() => {
        throw new Error('fail');
      }); // fail git diff

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual([]);
  });

  test('diff yarn workspace catalog adds dependency from indented diff line when YAML shows no changes', () => {
    const prev = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0';
    const curr = 'packages:\n  - packages/**\n\ncatalog:\n  foo: ^1.0.0\n  bar: ^2.0.0';
    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(curr);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prev); // previous YAML

    const changes = diffWorkspaceCatalog('v1.0.0', 'yarn');
    expect(changes).toEqual(['bar']);
  });
});

describe('Bun workspaces catalog in package.json', () => {
  test('diff package workspace catalogs returning dependencies that changed in the catalog', () => {
    // make a diff on the catalog for the "execa" dependency
    const prevFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalogs":{"build":{"react":"^18.0.0","react-dom":"^18.0.0"}}}}`;
    const newFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalogs":{"build":{"react":"^19.0.1","react-dom":"^18.0.0"}}}}`;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent); // first call is to get previous catalog commit

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual(['react']);
  });

  test('diff package workspace catalog returns changed external dependencies when catalog values differ', () => {
    const prevFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"react":"^18.0.0","react-dom":"^18.0.0"}}}`;
    const newFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"react":"^19.0.1","react-dom":"^19.0.2"}}}`;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent);

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual(['react', 'react-dom']);
  });

  test('diff package workspace catalog returns changed local dependencies when catalog values differ', () => {
    const prevFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"@mono/pkg-1":"^8.0.0","react":"^18.0.0","react-dom":"^18.0.0"}}}`;
    const newFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"@mono/pkg-1":"^8.2.1","react":"^18.0.0","react-dom":"^18.0.0"}}}`;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent);

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual(['@mono/pkg-1']);
  });

  test('diff package workspace catalog returns multiple changed dependencies', () => {
    const prevFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"react":"^18.0.0","react-dom":"^18.0.0"}}}`;
    const newFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"react":"^19.0.1","react-dom":"^19.2.0"}}}`;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent);

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes.sort()).toEqual(['react', 'react-dom']);
  });

  test('diff package workspace catalog returns empty array if no changes', () => {
    const prevFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"react":"^18.0.0","react-dom":"^18.0.0"}}}`;
    const newFileContent = prevFileContent;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent);

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual([]);
  });

  test('diff package workspace catalog returns empty array if catalog key is missing', () => {
    const prevFileContent = `{"name":"monorepo","workspaces":{}`;
    const newFileContent = `{"name":"monorepo","workspaces":{}`;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent);

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual([]);
  });

  test('diff package workspace catalog returns empty array if all methods fail', () => {
    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockImplementationOnce(() => {
      throw new Error('fail');
    });
    (childProcesses.execSync as Mock)
      .mockImplementationOnce(() => {
        throw new Error('fail');
      }) // fail YAML parse
      .mockImplementationOnce(() => {
        throw new Error('fail');
      }); // fail git diff

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual([]);
  });

  test('diff package workspace catalog adds dependency from indented diff line when YAML shows no changes', () => {
    const prevFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"foo":"^1.0.0"}}}`;
    const newFileContent = `{"name":"monorepo","workspaces":{"packages":["packages/**"],"catalog":{"foo":"^1.0.0","bar":"^2.0.0"}}}`;

    existsFileMock.mockReturnValueOnce(true);
    readFileMock.mockReturnValueOnce(newFileContent);
    (childProcesses.execSync as Mock).mockReturnValueOnce(prevFileContent); // previous YAML

    const changes = diffWorkspaceCatalog('v1.0.0', 'bun');
    expect(changes).toEqual(['bar']);
  });
});
