import { expect, Mock, test, vi } from 'vitest';

vi.mock('../../../child-process');

// mocked modules
import * as childProcesses from '../../../child-process.js';

const { globMock } = vi.hoisted(() => ({ globMock: vi.fn() }));
vi.mock('tinyglobby', async () => ({
  ...(await vi.importActual('tinyglobby')),
  globSync: globMock,
}));

// file under test
import { makeDiffPredicate } from '../lib/make-diff-predicate.js';
import { PackageGraphNode } from '../../../../dist/index.js';

function setup(changes) {
  (childProcesses.execSync as Mock).mockReturnValueOnce([].concat(changes).join('\n'));
}

test('git diff call', () => {
  setup(['packages/pkg-1/__tests__/index.test.js', 'packages/pkg-1/index.js', 'packages/pkg-1/package.json', 'packages/pkg-1/README.md']);

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-1'], { cwd: '/test' });
});

test('empty diff', () => {
  setup('');

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-1',
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
  } as PackageGraphNode);

  expect(result).toBe(false);
});

test('rooted package', () => {
  setup('package.json');

  const hasDiff = makeDiffPredicate('deadbeef', { cwd: '/test' }, undefined, [], {});
  const result = hasDiff({
    location: '/test',
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
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
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
  } as PackageGraphNode);

  expect(result).toBe(false);
});

test('ignore changes (match base)', () => {
  setup('packages/pkg-3/README.md');

  const hasDiff = makeDiffPredicate('v1.0.0', { cwd: '/test' }, ['*.md'], [], {});
  const result = hasDiff({
    location: '/test/packages/pkg-3',
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
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
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
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
    externalDependencies: new Map([['pkg-2', { fetchSpec: 'workspace:*' }]]),
  } as PackageGraphNode);

  expect(result).toBe(true);
  expect(childProcesses.execSync).toHaveBeenLastCalledWith('git', ['diff', '--name-only', 'v1.0.0', '--', 'packages/pkg-2'], {
    cwd: '/test',
  });
});
