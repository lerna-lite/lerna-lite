import normalizeNewline from 'normalize-newline';
import normalizePath from 'normalize-path';
import { relative } from 'node:path';

import { Project } from '../packages/core/src/project/index.js';

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

export * from './git/index.js';
export * from './fixtures.js';
export * from './npm/index.js';
export * from './cli.js';
export * from './logging-output.js';
export * from './pkg-matchers.js';
