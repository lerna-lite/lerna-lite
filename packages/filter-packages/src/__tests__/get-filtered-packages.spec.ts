const mockNotice = vi.fn();
vi.mock('npmlog', async () => ({
  ...(await vi.importActual<any>('npmlog')),
  notice: mockNotice,
}));

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  PackageGraph: (await vi.importActual<any>('../../../core/src/package-graph')).PackageGraph,
  getPackages: (await vi.importActual<any>('../../../core/src/project')).getPackages,
}));

import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs/yargs';

// mocked modules
import { collectUpdates } from '@lerna-lite/core';

// helpers
import { initFixtureFactory } from '@lerna-test/helpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const initFixture = initFixtureFactory(path.resolve(__dirname, '../'));

import { Project, PackageGraph } from '@lerna-lite/core';

import { getFilteredPackages } from '../get-filtered-packages';
import { filterOptions } from '../../../cli/src/filter-options';

async function buildGraph(cwd) {
  const packages = await Project.getPackages(cwd);
  return new PackageGraph(packages);
}

function parseOptions(...args) {
  return filterOptions(yargs().exitProcess(false).showHelpOnFail(false)).parse(args);
}

// working dir is never mutated
let cwd;

beforeAll(async () => {
  cwd = await initFixture('filtering');
});

test.each`
  flag
  ${'--scope'}
  ${'--ignore'}
`('$flag requires an argument', async ({ flag }) => {
  // swallow stderr during yargs execution
  vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => parseOptions(flag)).toThrow('Not enough arguments');
});

test.each`
  argv                                                      | matched
  ${['--scope', 'package-3']}                               | ${[3]}
  ${['--scope', 'package-@(1|2)']}                          | ${[1, 2]}
  ${['--scope', 'package-{3,4}']}                           | ${[3, 4]}
  ${['--ignore', 'package-3']}                              | ${[1, 2, 4, 5]}
  ${['--ignore', 'package-@(2|3|4)']}                       | ${[1, 5]}
  ${['--ignore', 'package-{1,2,5}']}                        | ${[3, 4]}
  ${['--scope', 'package-1', '--scope', '*-2']}             | ${[1, 2]}
  ${['--scope', 'package-@(1|2)', '--ignore', 'package-2']} | ${[1]}
  ${['--ignore', 'package-{1,2}', '--ignore', 'package-3']} | ${[4, 5]}
`('filters $argv', async ({ argv, matched }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions(...argv);
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);
  expect(result.map((node) => node.name)).toEqual(matched.map((n) => `package-${n}`));
});

test.each`
  argv
  ${['--scope', 'not-a-package']}
  ${['--ignore', 'package-*']}
  ${['--scope', 'package-@(1|2)', '--ignore', 'package-{1,2}']}
`('errors $argv', async ({ argv }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions(...argv);
  options.log = { notice: mockNotice };

  await expect(getFilteredPackages(packageGraph, execOpts, options)).rejects.toThrow('No packages remain after filtering');
});

test.each`
  argv
  ${['--scope', 'not-a-package', '--continue-if-no-match']}
  ${['--ignore', 'package-*', '--continue-if-no-match']}
  ${['--scope', 'package-@(1|2)', '--ignore', 'package-{1,2}', '--continue-if-no-match']}
`('no errors and no packages $argv', async ({ argv }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions(...argv);
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);
  expect(result).toHaveLength(0);
});

test('--since returns all packages if no tag is found', async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--since');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(5);
  expect(collectUpdates).toHaveBeenLastCalledWith(expect.any(Array), packageGraph, execOpts, expect.objectContaining({ since: '' }));
});

test('--include-merged-tags returns all packages if no tag is found', async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--since', '--include-merged-tags');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(5);
  expect(collectUpdates).toHaveBeenLastCalledWith(expect.any(Array), packageGraph, execOpts, expect.objectContaining({ since: '' }));
  expect(mockNotice).toHaveBeenCalledWith('filter', 'including merged tags');
});

test('--since returns packages updated since the last tag', async () => {
  (collectUpdates as any).setUpdated(cwd, 'package-2', 'package-3');

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--since');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(['package-2', 'package-3']);
});

test('--since <ref> should return packages updated since <ref>', async () => {
  (collectUpdates as any).setUpdated(cwd, 'package-1', 'package-2', 'package-3');

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--since', 'deadbeef');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(['package-1', 'package-2', 'package-3']);
  expect(collectUpdates).toHaveBeenLastCalledWith(expect.any(Array), packageGraph, execOpts, expect.objectContaining({ since: 'deadbeef' }));
});

test('--scope package-{2,3,4} --since main', async () => {
  (collectUpdates as any).setUpdated(cwd, 'package-4', 'package-1');

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--scope', 'package-{2,3,4}', '--since', 'main');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(['package-4']);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    // filter-packages before collect-updates
    [2, 3, 4].map((n) => packageGraph.get(`package-${n}`)!.pkg),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: 'main' })
  );
});

test('--exclude-dependents', async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--since', 'foo', '--exclude-dependents');
  options.log = { notice: mockNotice };

  await getFilteredPackages(packageGraph, execOpts, options);

  expect(collectUpdates).toHaveBeenLastCalledWith(expect.any(Array), packageGraph, execOpts, expect.objectContaining({ excludeDependents: true }));
});

test('--exclude-dependents conflicts with --include-dependents', async () => {
  expect(() => parseOptions('--exclude-dependents', '--include-dependents')).toThrow(/(exclude|include)-dependents/);
});

test('--include-dependents', async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--scope', 'package-1', '--include-dependents');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(['package-1', 'package-2', 'package-5', 'package-3']);
  expect(collectUpdates).not.toHaveBeenCalled();
});

test('--no-private', async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--scope', 'package-1', 'package-5', '--no-private');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(['package-1']); // pkg-5 is private and excluded
  expect(collectUpdates).not.toHaveBeenCalled();
});

test('--include-dependencies', async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options: any = parseOptions('--scope', 'package-3', '--include-dependencies');
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(['package-3', 'package-2', 'package-1']);
  expect(collectUpdates).not.toHaveBeenCalled();
});
