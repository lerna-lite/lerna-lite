import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  copy,
  copySync,
  ensureDir,
  ensureDirSync,
  move,
  moveSync,
  outputFile,
  outputFileSync,
  outputJson,
  outputJsonSync,
  readJson,
  readJsonSync,
  remove,
  removeSync,
  writeJson,
  writeJsonSync,
  pathExists,
  pathExistsSync,
} from '../fs-utils.js';

const TEST_DIR_PREFIX = join(tmpdir(), 'fs-utils-test-');

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(TEST_DIR_PREFIX);
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('fs-utils', () => {
  it('outputFileSync and readFileSync', () => {
    const file = join(testDir, 'a.txt');
    outputFileSync(file, 'hello');
    expect(readFileSync(file, 'utf8')).toBe('hello');
  });

  it('outputFile and readFileSync', async () => {
    const file = join(testDir, 'b.txt');
    await outputFile(file, 'world');
    expect(readFileSync(file, 'utf8')).toBe('world');
  });

  it('outputJsonSync and readJsonSync', () => {
    const file = join(testDir, 'c.json');
    outputJsonSync(file, { foo: 1 });
    expect(readJsonSync(file)).toEqual({ foo: 1 });
  });

  it('outputJson and readJson', async () => {
    const file = join(testDir, 'd.json');
    await outputJson(file, { bar: 2 });
    expect(await readJson(file)).toEqual({ bar: 2 });
  });

  it('removeSync removes file', () => {
    const file = join(testDir, 'e.txt');
    outputFileSync(file, 'bye');
    removeSync(file);
    expect(existsSync(file)).toBe(false);
  });

  it('remove removes file', async () => {
    const file = join(testDir, 'f.txt');
    await outputFile(file, 'bye');
    await remove(file);
    expect(existsSync(file)).toBe(false);
  });

  it('ensureDirSync creates dir', () => {
    const dir = join(testDir, 'g');
    ensureDirSync(dir);
    expect(existsSync(dir)).toBe(true);
  });

  it('ensureDir creates dir', async () => {
    const dir = join(testDir, 'h');
    await ensureDir(dir);
    expect(existsSync(dir)).toBe(true);
  });

  it('moveSync moves file', () => {
    const src = join(testDir, 'i.txt');
    const dest = join(testDir, 'j.txt');
    outputFileSync(src, 'move');
    moveSync(src, dest);
    expect(existsSync(src)).toBe(false);
    expect(readFileSync(dest, 'utf8')).toBe('move');
  });

  it('move moves file', async () => {
    const src = join(testDir, 'k.txt');
    const dest = join(testDir, 'l.txt');
    await outputFile(src, 'move');
    await move(src, dest);
    expect(existsSync(src)).toBe(false);
    expect(readFileSync(dest, 'utf8')).toBe('move');
  });

  it('copySync copies file', () => {
    const src = join(testDir, 'm.txt');
    const dest = join(testDir, 'n.txt');
    outputFileSync(src, 'copy');
    copySync(src, dest);
    expect(readFileSync(dest, 'utf8')).toBe('copy');
  });

  it('copy copies file', async () => {
    const src = join(testDir, 'o.txt');
    const dest = join(testDir, 'p.txt');
    await outputFile(src, 'copy');
    await copy(src, dest);
    expect(readFileSync(dest, 'utf8')).toBe('copy');
  });

  it('pathExistsSync and pathExists', async () => {
    const file = join(testDir, 'q.txt');
    outputFileSync(file, 'exists');
    expect(pathExistsSync(file)).toBe(true);
    expect(await pathExists(file)).toBe(true);
    removeSync(file);
    expect(pathExistsSync(file)).toBe(false);
    expect(await pathExists(file)).toBe(false);
  });

  it('readJsonSync with throws: false', () => {
    const file = join(testDir, 'notfound.json');
    expect(readJsonSync(file, { throws: false })).toBeUndefined();
  });

  it('writeJsonSync and writeJson', async () => {
    const file1 = join(testDir, 'r.json');
    const file2 = join(testDir, 's.json');
    writeJsonSync(file1, { a: 1 });
    await writeJson(file2, { b: 2 });
    expect(readJsonSync(file1)).toEqual({ a: 1 });
    expect(await readJson(file2)).toEqual({ b: 2 });
  });
});
