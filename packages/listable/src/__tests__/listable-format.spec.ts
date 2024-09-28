import { beforeAll, describe, expect, test, vi } from 'vitest';
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  QueryGraph: (await vi.importActual<any>('../../../core/src/utils/query-graph')).QueryGraph,
}));

import { temporaryDirectory } from 'tempy';
import Tacks from 'tacks';
import { Project } from '@lerna-lite/core';
import { loggingOutput } from '@lerna-test/helpers/logging-output.js';

import { listable } from '../index.js';

const { File, Dir } = Tacks;

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// normalize temp directory paths in snapshots
import serializeTempdir from '@lerna-test/helpers/serializers/serialize-tempdir.js';
import serializeWindowsPaths from '@lerna-test/helpers/serializers/serialize-windows-paths.js';
expect.addSnapshotSerializer(serializeWindowsPaths);
expect.addSnapshotSerializer(serializeTempdir);

describe('listable.format()', () => {
  let packages;

  const formatWithOptions = (opts) => listable.format(packages, Object.assign({ _: ['ls'] }, opts));

  const fixture = new Tacks(
    Dir({
      'lerna.json': File({
        version: 'independent',
        packages: ['pkgs/*'],
      }),
      'package.json': File({
        name: 'listable-format-test',
      }),
      pkgs: Dir({
        'pkg-1': Dir({
          'package.json': File({
            name: 'pkg-1',
            version: '1.0.0',
            dependencies: { 'pkg-2': 'file:../pkg-2' },
          }),
        }),
        'pkg-2': Dir({
          'package.json': File({
            name: 'pkg-2',
            // version: '2.0.0',
            devDependencies: { 'pkg-3': 'file:../pkg-3' },
          }),
        }),
        'pkg-3': Dir({
          'package.json': File({
            name: 'pkg-3',
            version: '3.0.0',
            dependencies: { 'pkg-2': 'file:../pkg-2' },
            private: true,
          }),
        }),
      }),
    })
  );

  beforeAll(async () => {
    const cwd = temporaryDirectory();

    fixture.create(cwd);
    process.chdir(cwd);

    packages = await Project.getPackages(cwd);
  });

  describe('renders', () => {
    test('all output', () => {
      const { count, text } = formatWithOptions({ all: true });

      expect(count).toBe(3);
      expect(text).toMatchInlineSnapshot(`
pkg-1
pkg-2
pkg-3 (PRIVATE)
`);
    });

    test('long output', () => {
      const { count, text } = formatWithOptions({ long: true });

      expect(count).toBe(2);
      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
`);
    });

    test('all long output', () => {
      const { text } = formatWithOptions({ long: true, all: true });

      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
pkg-3  v3.0.0 pkgs/pkg-3 (PRIVATE)
`);
    });

    test('JSON output', () => {
      const { text } = formatWithOptions({ json: true });

      expect(text).toMatchInlineSnapshot(`
[
  {
    "name": "pkg-1",
    "version": "1.0.0",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-1"
  },
  {
    "name": "pkg-2",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-2"
  }
]
`);
    });

    test('all JSON output', () => {
      const { text } = formatWithOptions({ json: true, all: true });

      expect(text).toMatchInlineSnapshot(`
[
  {
    "name": "pkg-1",
    "version": "1.0.0",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-1"
  },
  {
    "name": "pkg-2",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-2"
  },
  {
    "name": "pkg-3",
    "version": "3.0.0",
    "private": true,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-3"
  }
]
`);
    });

    test('NDJSON output', () => {
      const { text } = formatWithOptions({ ndjson: true, all: true });

      expect(text).toMatchInlineSnapshot(`
{"name":"pkg-1","version":"1.0.0","private":false,"location":"__TEST_ROOTDIR__/pkgs/pkg-1"}
{"name":"pkg-2","private":false,"location":"__TEST_ROOTDIR__/pkgs/pkg-2"}
{"name":"pkg-3","version":"3.0.0","private":true,"location":"__TEST_ROOTDIR__/pkgs/pkg-3"}
`);
    });

    test('graph output', () => {
      const { text } = formatWithOptions({ graph: true });

      expect(text).toMatchInlineSnapshot(`
        {
          "pkg-1": [
            "pkg-2"
          ],
          "pkg-2": []
        }
      `);
    });

    test('all graph output', () => {
      const { text } = formatWithOptions({ graph: true, all: true });

      expect(text).toMatchInlineSnapshot(`
        {
          "pkg-1": [
            "pkg-2"
          ],
          "pkg-2": [
            "pkg-3"
          ],
          "pkg-3": [
            "pkg-2"
          ]
        }
      `);
    });

    test('parseable output', () => {
      const { text } = formatWithOptions({ parseable: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1
__TEST_ROOTDIR__/pkgs/pkg-2
`);
    });

    test('all parseable output', () => {
      const { text } = formatWithOptions({ parseable: true, all: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1
__TEST_ROOTDIR__/pkgs/pkg-2
__TEST_ROOTDIR__/pkgs/pkg-3
`);
    });

    test('long parseable output', () => {
      const { text } = formatWithOptions({ parseable: true, long: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1:pkg-1:1.0.0
__TEST_ROOTDIR__/pkgs/pkg-2:pkg-2:MISSING
`);
    });

    test('all long parseable output', () => {
      const { text } = formatWithOptions({ parseable: true, all: true, long: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1:pkg-1:1.0.0
__TEST_ROOTDIR__/pkgs/pkg-2:pkg-2:MISSING
__TEST_ROOTDIR__/pkgs/pkg-3:pkg-3:3.0.0:PRIVATE
`);
    });
  });

  describe('aliases', () => {
    test('la => ls -la', () => {
      const { text } = formatWithOptions({ _: ['la'] });

      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
pkg-3  v3.0.0 pkgs/pkg-3 (PRIVATE)
`);
    });

    test('ll => ls -l', () => {
      const { text } = formatWithOptions({ _: ['ll'] });

      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
`);
    });
  });

  describe('toposort', () => {
    test('output', () => {
      const { text } = formatWithOptions({ toposort: true });

      expect(text).toMatchInlineSnapshot(`
pkg-2
pkg-1
`);
    });

    test('cycles', () => {
      const { text } = formatWithOptions({ toposort: true, all: true });

      expect(loggingOutput('warn')).toContainEqual(expect.stringContaining('pkg-2 -> pkg-3 -> pkg-2'));
      expect(text).toMatchInlineSnapshot(`
pkg-2
pkg-3 (PRIVATE)
pkg-1
`);
    });
  });
});
