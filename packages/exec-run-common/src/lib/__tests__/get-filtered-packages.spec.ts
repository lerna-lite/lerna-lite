let mockNotice = jest.fn();
jest.mock('npmlog', () => ({
  ...jest.requireActual('npmlog') as any,
  notice: mockNotice,
}));

jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core') as any, // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
  collectUpdates: jest.requireActual("../../../../core/src/__mocks__/collect-updates").collectUpdates,
  PackageGraph: jest.requireActual("../../../../core/src/package-graph").PackageGraph,
  getPackages: jest.requireActual("../../../../core/src/project").getPackages,
}));

import path from 'path';
import yargs from 'yargs/yargs';

// mocked modules
const { collectUpdates } = require("@lerna-lite/core");

// helpers
// const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../command"));
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../.."));

import { Project, PackageGraph } from '@lerna-lite/core';

const { getFilteredPackages } = require("../get-filtered-packages");
const { filterOptions } = require("../../../../cli/src/filter-options");

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
  cwd = await initFixture("filtering");
});

test.each`
  flag
  ${"--scope"}
  ${"--ignore"}
`("$flag requires an argument", async ({ flag }) => {
  // swallow stderr during yargs execution
  jest.spyOn(console, "error").mockImplementation(() => { });

  expect(() => parseOptions(flag)).toThrow("Not enough arguments");
});

test.each`
  argv                                                      | matched
  ${["--scope", "package-3"]}                               | ${[3]}
  ${["--scope", "package-@(1|2)"]}                          | ${[1, 2]}
  ${["--scope", "package-{3,4}"]}                           | ${[3, 4]}
  ${["--ignore", "package-3"]}                              | ${[1, 2, 4, 5]}
  ${["--ignore", "package-@(2|3|4)"]}                       | ${[1, 5]}
  ${["--ignore", "package-{1,2,5}"]}                        | ${[3, 4]}
  ${["--scope", "package-1", "--scope", "*-2"]}             | ${[1, 2]}
  ${["--scope", "package-@(1|2)", "--ignore", "package-2"]} | ${[1]}
  ${["--ignore", "package-{1,2}", "--ignore", "package-3"]} | ${[4, 5]}
`("filters $argv", async ({ argv, matched }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions(...argv);
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);
  expect(result.map((node) => node.name)).toEqual(matched.map((n) => `package-${n}`));
});

test.each`
  argv
  ${["--scope", "not-a-package"]}
  ${["--ignore", "package-*"]}
  ${["--scope", "package-@(1|2)", "--ignore", "package-{1,2}"]}
`("errors $argv", async ({ argv }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions(...argv);
  options.log = { notice: mockNotice };

  await expect(getFilteredPackages(packageGraph, execOpts, options)).rejects.toThrow(
    "No packages remain after filtering"
  );
});

test.each`
  argv
  ${["--scope", "not-a-package", "--continue-if-no-match"]}
  ${["--ignore", "package-*", "--continue-if-no-match"]}
  ${["--scope", "package-@(1|2)", "--ignore", "package-{1,2}", "--continue-if-no-match"]}
`("no errors and no packages $argv", async ({ argv }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions(...argv);
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);
  expect(result).toHaveLength(0);
});

test("--since returns all packages if no tag is found", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(5);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    expect.any(Array),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: "" })
  );
});

test("--since returns packages updated since the last tag", async () => {
  collectUpdates.setUpdated(cwd, "package-2", "package-3");

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(["package-2", "package-3"]);
});

test("--since <ref> should return packages updated since <ref>", async () => {
  collectUpdates.setUpdated(cwd, "package-1", "package-2", "package-3");

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since", "deadbeef");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(["package-1", "package-2", "package-3"]);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    expect.any(Array),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: "deadbeef" })
  );
});

test("--scope package-{2,3,4} --since main", async () => {
  collectUpdates.setUpdated(cwd, "package-4", "package-1");

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-{2,3,4}", "--since", "main");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(["package-4"]);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    // filter-packages before collect-updates
    [2, 3, 4].map((n) => packageGraph.get(`package-${n}`).pkg),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: "main" })
  );
});

test("--exclude-dependents", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since", "foo", "--exclude-dependents");
  options.log = { notice: mockNotice };

  await getFilteredPackages(packageGraph, execOpts, options);

  expect(collectUpdates).toHaveBeenLastCalledWith(
    expect.any(Array),
    packageGraph,
    execOpts,
    expect.objectContaining({ excludeDependents: true })
  );
});

test("--exclude-dependents conflicts with --include-dependents", async () => {
  expect(() => parseOptions("--exclude-dependents", "--include-dependents")).toThrow(
    /(exclude|include)-dependents/
  );
});

test("--include-dependents", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-1", "--include-dependents");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(["package-1", "package-2", "package-5", "package-3"]);
  expect(collectUpdates).not.toHaveBeenCalled();
});

test("--no-private", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-1", "package-5", "--no-private");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(["package-1"]); // pkg-5 is private and excluded
  expect(collectUpdates).not.toHaveBeenCalled();
});

test("--include-dependencies", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-3", "--include-dependencies");
  options.log = { notice: mockNotice };

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(["package-3", "package-2", "package-1"]);
  expect(collectUpdates).not.toHaveBeenCalled();
});
