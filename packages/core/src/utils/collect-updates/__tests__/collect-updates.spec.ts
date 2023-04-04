import { Package } from '../../../package';

vi.mock('../../describe-ref');
vi.mock('../lib/has-tags');
vi.mock('../lib/make-diff-predicate');

const globMock = vi.fn();
vi.mock('globby', async () => ({
  ...(await vi.importActual<any>('globby')),
  globbySync: globMock,
}));

import { Mock } from 'vitest';

// mocked modules
import { describeRefSync } from '../../describe-ref';
import { hasTags } from '../lib/has-tags';
import { makeDiffPredicate } from '../lib/make-diff-predicate';

// helpers
import buildGraph from '../__helpers__/build-graph';

// file under test
import { collectUpdates } from '../collect-updates';

// default mock implementations
(describeRefSync as Mock).mockReturnValue({
  lastTagName: 'v1.0.0',
  lastVersion: '1.0.0',
  refCount: '1',
  sha: 'deadbeef',
  isDirty: false,
});

(hasTags as Mock).mockReturnValue(true);

const changedPackages = new Set();
const hasDiff = vi
  .fn()
  .mockName('hasDiff')
  .mockImplementation((node) => changedPackages.has(node.name));

(makeDiffPredicate as Mock).mockImplementation(() => hasDiff);

// matcher constants
const ALL_NODES = Object.freeze([
  expect.objectContaining({ name: 'package-cycle-1' }),
  expect.objectContaining({ name: 'package-cycle-2' }),
  expect.objectContaining({ name: 'package-cycle-extraneous-1' }),
  expect.objectContaining({ name: 'package-cycle-extraneous-2' }),
  expect.objectContaining({ name: 'package-dag-1' }),
  expect.objectContaining({ name: 'package-dag-2a' }),
  expect.objectContaining({ name: 'package-dag-2b' }),
  expect.objectContaining({ name: 'package-dag-3' }),
  expect.objectContaining({ name: 'package-standalone' }),
]);

const toPrereleaseMapper = (names?: string[]) => (pkg: Package) => {
  return !names || names.includes(pkg.name) ? Object.assign(pkg, { version: `${pkg.version}-alpha.0` }) : pkg;
};

describe('collectUpdates()', () => {
  beforeEach(() => {
    // isolate each test
    changedPackages.clear();
  });

  it('returns node with changes', () => {
    changedPackages.add('package-standalone');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };
    const updates = collectUpdates(pkgs, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({
        name: 'package-standalone',
      }),
    ]);
    expect(hasTags).toHaveBeenLastCalledWith(execOpts, '');
    expect(describeRefSync).toHaveBeenLastCalledWith({ cwd: '/test', match: '' }, undefined, false);
    expect(makeDiffPredicate).toHaveBeenLastCalledWith('v1.0.0', execOpts, undefined, {
      independentSubpackages: undefined,
    });
  });

  it('returns node with changes in independent mode', () => {
    changedPackages.add('package-standalone');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test', match: '*@*' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      isIndependent: true,
    });

    expect(updates).toEqual([
      expect.objectContaining({
        name: 'package-standalone',
      }),
    ]);
    expect(hasTags).toHaveBeenLastCalledWith(execOpts, '*@*');
    expect(describeRefSync).toHaveBeenLastCalledWith(execOpts, undefined, false);
    expect(makeDiffPredicate).toHaveBeenLastCalledWith('v1.0.0', execOpts, undefined, {
      independentSubpackages: undefined,
    });
  });

  it('returns changed node and their dependents', () => {
    changedPackages.add('package-dag-1');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-1' }),
      expect.objectContaining({ name: 'package-dag-2a' }),
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
    ]);
  });

  it('constrains results by excluded dependents', () => {
    changedPackages.add('package-dag-1');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      excludeDependents: true,
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-1' }),
      // collectDependents() is skipped
    ]);
  });

  it('constrains results by filtered packages', () => {
    changedPackages.add('package-dag-2a');
    changedPackages.add('package-dag-3');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList.filter((pkg) => pkg.name !== 'package-dag-3');
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-2a' }),
      // despite having changed, package-dag-3 was ignored
    ]);
  });

  it('overrules dependents with filtered packages', () => {
    changedPackages.add('package-dag-1');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList.filter((pkg) => pkg.name !== 'package-dag-2a');
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-1' }),
      // despite having a changed dependency, package-dag-2a was ignored
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
    ]);
  });

  it('skips change detection when current revison is already released', () => {
    changedPackages.add('package-dag-1');

    (describeRefSync as Mock).mockReturnValueOnce({
      refCount: '0',
    });

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {});

    expect(updates).toEqual([]);
  });

  it('returns all nodes when no tag is found', () => {
    (hasTags as Mock).mockReturnValueOnce(false);

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {});

    expect(updates).toEqual(ALL_NODES);
  });

  it('returns all nodes with --force-publish', () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: true,
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it('returns all nodes with --force-publish *', () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: '*',
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it('always includes nodes targeted by --force-publish <pkg>', () => {
    changedPackages.add('package-dag-3');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: 'package-standalone',
    });

    expect(updates).toEqual([expect.objectContaining({ name: 'package-dag-3' }), expect.objectContaining({ name: 'package-standalone' })]);
  });

  it('always includes nodes targeted by --force-publish <pkg>,<pkg>', () => {
    changedPackages.add('package-dag-3');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: 'package-standalone,package-dag-2b',
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
      expect.objectContaining({ name: 'package-standalone' }),
    ]);
  });

  it('always includes nodes targeted by --force-publish <pkg> --force-publish <pkg>', () => {
    changedPackages.add('package-dag-3');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: ['package-standalone', 'package-dag-2b'],
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
      expect.objectContaining({ name: 'package-standalone' }),
    ]);
  });

  it('returns all prereleased nodes with --conventional-graduate', () => {
    const graph = buildGraph(toPrereleaseMapper());
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      conventionalCommits: true,
      conventionalGraduate: true,
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it('returns all prereleased nodes with --conventional-graduate *', () => {
    const graph = buildGraph(toPrereleaseMapper());
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      conventionalCommits: true,
      conventionalGraduate: '*',
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it('always includes prereleased nodes targeted by --conventional-graduate <pkg>', () => {
    changedPackages.add('package-dag-3');

    const graph = buildGraph(toPrereleaseMapper(['package-dag-3', 'package-standalone']));
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      conventionalCommits: true,
      conventionalGraduate: 'package-standalone',
    });

    expect(updates).toEqual([expect.objectContaining({ name: 'package-dag-3' }), expect.objectContaining({ name: 'package-standalone' })]);
  });

  it('always includes prereleased nodes targeted by --conventional-graduate <pkg>,<pkg>', () => {
    changedPackages.add('package-dag-3');

    const graph = buildGraph(toPrereleaseMapper(['package-dag-3', 'package-standalone', 'package-dag-2b']));
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: 'package-standalone,package-dag-2b',
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
      expect.objectContaining({ name: 'package-standalone' }),
    ]);
  });

  it('always includes prereleased nodes targeted by --conventional-graduate <pkg> --conventional-graduate <pkg>', () => {
    changedPackages.add('package-dag-3');

    const graph = buildGraph(toPrereleaseMapper(['package-dag-3', 'package-standalone', 'package-dag-2b']));
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      forcePublish: ['package-standalone', 'package-dag-2b'],
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
      expect.objectContaining({ name: 'package-standalone' }),
    ]);
  });

  it('uses revision range with --canary', () => {
    changedPackages.add('package-dag-2a');

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      canary: true,
    });

    expect(updates).toEqual([expect.objectContaining({ name: 'package-dag-2a' }), expect.objectContaining({ name: 'package-dag-3' })]);
    expect(makeDiffPredicate).toHaveBeenLastCalledWith('deadbeef^..deadbeef', execOpts, undefined, {
      independentSubpackages: undefined,
    });
  });

  it('uses revision provided by --since <ref>', () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      since: 'beefcafe',
    });

    expect(makeDiffPredicate).toHaveBeenLastCalledWith('beefcafe', execOpts, undefined, {
      independentSubpackages: undefined,
    });
  });

  it('does not exit early on tagged release when --since <ref> is passed', () => {
    changedPackages.add('package-dag-1');

    (describeRefSync as Mock).mockReturnValueOnce({
      refCount: '0',
    });

    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    const updates = collectUpdates(pkgs, graph, execOpts, {
      since: 'deadbeef',
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: 'package-dag-1' }),
      expect.objectContaining({ name: 'package-dag-2a' }),
      expect.objectContaining({ name: 'package-dag-2b' }),
      expect.objectContaining({ name: 'package-dag-3' }),
    ]);
  });

  it('ignores changes matched by --ignore-changes', () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      ignoreChanges: ['**/README.md'],
    });

    expect(makeDiffPredicate).toHaveBeenLastCalledWith('v1.0.0', execOpts, ['**/README.md'], {
      independentSubpackages: undefined,
    });
  });

  it('excludes packages when --independent-subpackages option is enabled', () => {
    globMock.mockReturnValueOnce(['packages/pkg-2/and-another-thing/package.json']);
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      independentSubpackages: true,
    });

    expect(makeDiffPredicate).toHaveBeenLastCalledWith('v1.0.0', execOpts, undefined, {
      independentSubpackages: true,
    });
  });

  it('use "describeTag" in independent mode', async () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      describeTag: '*custom-tag*',
      isIndependent: true,
      includeMergedTags: true,
    });
    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*custom-tag*' }, true, false);
  });

  it('no use "describeTag" in independent mode', async () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      isIndependent: true,
      includeMergedTags: true,
    });
    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, true, false);
  });

  it('use "describeTag" in non-independent mode', async () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      describeTag: '*custom-tag*',
      isIndependent: false,
      includeMergedTags: true,
    });
    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*custom-tag*' }, true, false);
  });

  it('no use "describeTag" in non-independent mode', async () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      isIndependent: false,
      includeMergedTags: true,
    });
    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '' }, true, false);
  });

  it('use "describeTag" with empty value in independent mode', async () => {
    const graph = buildGraph();
    const pkgs = graph.rawPackageList;
    const execOpts = { cwd: '/test' };

    collectUpdates(pkgs, graph, execOpts, {
      describeTag: '',
      isIndependent: true,
      includeMergedTags: true,
    });
    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, true, false);
  });
});
