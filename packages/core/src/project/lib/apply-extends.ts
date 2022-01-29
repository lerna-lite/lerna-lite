import path from 'path';
import resolveFrom from 'resolve-from';

import { shallowExtend } from './shallow-extend';
import { ValidationError } from '../../validation-error';

/**
 * @param {{ [key: string]: unknown }} config
 * @param {string} cwd
 * @param {Set<string>} seen
 */
export function applyExtends(config, cwd, seen = new Set()) {
  let defaultConfig = {};

  if ('extends' in config) {
    let pathToDefault;

    try {
      pathToDefault = resolveFrom(cwd, config.extends);
    } catch (err: any) {
      throw new ValidationError('ERESOLVED', 'Config .extends must be locally-resolvable', err);
    }

    if (seen.has(pathToDefault)) {
      throw new ValidationError('ECIRCULAR', 'Config .extends cannot be circular', seen as any);
    }

    seen.add(pathToDefault);

    defaultConfig = require(pathToDefault);
    delete config.extends; // eslint-disable-line no-param-reassign

    // deprecateConfig(defaultConfig, pathToDefault);

    defaultConfig = applyExtends(defaultConfig, path.dirname(pathToDefault), seen);
  }

  return shallowExtend(config, defaultConfig);
}
