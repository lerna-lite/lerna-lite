import { mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pathJoin, relative } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import normalizeNewline from 'normalize-newline';
import normalizePath from 'normalize-path';
import { v4 as uuidv4 } from 'uuid';

import { Project } from '../packages/core/dist/project/project.js';

/**
 * Update lerna config inside a test case.
 *
 * @param {String} testDir where target lerna.json exists
 * @param {Object} updates mixed into existing JSON via Object.assign
 */
export function updateLernaConfig(testDir, updates) {
  const project = new Project(testDir);

  Object.assign(project.config, updates);

  return project.serializeConfig();
}

export function multiLineTrimRight(str) {
  return normalizeNewline(str)
    .split('\n')
    .map((line) => line.trimRight())
    .join('\n');
}

export function normalizeRelativeDir(testDir, filePath) {
  return normalizePath(relative(testDir, filePath));
}

export function stripAnsi(s: string, strip = true) {
  return strip ? stripVTControlCharacters(s) : s;
}

/**
 * Create a temporary directory using UUID as a unique name.
 * A prefix can be provided to help identify the directory.
 * @param {String} [prefix]
 * @returns
 */
export function temporaryDirectory(prefix?: string): string {
  try {
    const tempDirPath = pathJoin(realpathSync(tmpdir()), `${prefix || ''}${uuidv4()}`);
    mkdirSync(tempDirPath, { recursive: true });
    return tempDirPath;
  } catch (error) {
    throw new Error(`Failed to create temporary directory: ${error.message}`);
  }
}

export * from './cli.js';
export * from './fixtures.js';
export * from './git/index.js';
export * from './logging-output.js';
export * from './npm/index.js';
export * from './pkg-matchers.js';
