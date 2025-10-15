import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { readJsonSync } from 'fs-extra/esm';
import { ValidationError } from '../../validation-error.js';
import { shallowExtend } from './shallow-extend.js';

/**
 * @param {{ [key: string]: unknown }} config
 * @param {string} cwd
 * @param {Set<string>} seen
 */
export function applyExtends(config: { [key: string]: any }, cwd: string, seen = new Set<string>()) {
  let defaultConfig = {};

  if ('extends' in config) {
    let pathToDefault;

    try {
      // resolve-from resolves modules relative to a given directory; emulate using createRequire
      const requireFrom = createRequire(cwd + '/');
      pathToDefault = requireFrom.resolve(config.extends);
    } catch (err: any) {
      throw new ValidationError('ERESOLVED', 'Config .extends must be locally-resolvable', err);
    }

    if (seen.has(pathToDefault)) {
      throw new ValidationError('ECIRCULAR', 'Config .extends cannot be circular', seen as any);
    }

    seen.add(pathToDefault);

    defaultConfig = readJsonSync(pathToDefault, { throws: false });
    delete config.extends;

    // deprecateConfig(defaultConfig, pathToDefault);

    defaultConfig = applyExtends(defaultConfig, dirname(pathToDefault), seen);
  }

  return shallowExtend(config, defaultConfig);
}
