import { expect, test, vi } from 'vitest';

import { Package } from '../../../package.js';
// helpers
import buildGraph from '../__helpers__/build-graph.js';
// file under test
import { collectPackages } from '../lib/collect-packages.js';

const toNamesList = (collection: any[]) => Array.from(collection as Package[]).map((pkg) => pkg.name);

test('returns all packages', () => {
  const graph = buildGraph();
  const result = collectPackages(graph);

  expect(toNamesList(result)).toMatchInlineSnapshot(`
    [
      "package-cycle-1",
      "package-cycle-2",
      "package-cycle-extraneous-1",
      "package-cycle-extraneous-2",
      "package-dag-1",
      "package-dag-2a",
      "package-dag-2b",
      "package-dag-3",
      "package-standalone",
    ]
  `);
});

test('filters packages through isCandidate, passing node and name', () => {
  const graph = buildGraph();
  const packagesToInclude = ['package-cycle-1'];
  const isCandidate = (node, name) => {
    return packagesToInclude.includes(node.name) && node.name === name;
  };
  const result = collectPackages(graph, { isCandidate });

  expect(toNamesList(result)).toMatchInlineSnapshot(`
    [
      "package-cycle-1",
      "package-cycle-2",
      "package-cycle-extraneous-1",
      "package-cycle-extraneous-2",
    ]
  `);
});

test('calls onInclude with included package name', () => {
  const graph = buildGraph();
  const packagesToInclude = ['package-standalone'];
  const isCandidate = (_node, name) => packagesToInclude.includes(name);
  const onInclude = vi.fn();
  collectPackages(graph, { isCandidate, onInclude });

  expect(onInclude).toHaveBeenCalledWith(packagesToInclude[0]);
});
