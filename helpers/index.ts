import normalizeNewline from 'normalize-newline';
import normalizePath from 'normalize-path';
import path from 'path';

import { Project } from '../packages/core/src/project';

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
  return normalizePath(path.relative(testDir, filePath));
}

export * from './git';
export * from './fixtures';
export * from './npm';
export * from './cli';
export * from './fixtures';
export * from './logging-output';
export * from './pkg-matchers';
