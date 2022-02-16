import log from 'npmlog';
import pify from 'pify';
import npa from 'npm-package-arg';

import { ValidationError } from '../validation-error';

export class GetChangelogConfig {
  static cfgCache = new Map<string, any>();

  static isFunction(config) {
    return Object.prototype.toString.call(config) === '[object Function]';
  }

  static resolveConfigPromise(presetPackageName: string, presetConfig: any) {
    log.verbose('getChangelogConfig', 'Attempting to resolve preset %j', presetPackageName);

    let config = require(presetPackageName);

    log.info('getChangelogConfig', 'Successfully resolved preset %j', presetPackageName);

    if (this.isFunction(config)) {
      try {
        // try assuming config builder function first
        config = config(presetConfig);
      } catch (_) {
        // legacy presets export an errback function instead of Q.all()
        config = pify(config)();
      }
    }

    return config;
  }

  /**
   * @param {import('..').ChangelogPresetConfig} [changelogPreset]
   * @param {string} [rootPath]
   */
  static getChangelogConfig(changelogPreset: string | { name: string; } = 'conventional-changelog-angular', rootPath?: string) {
    const presetName = typeof changelogPreset === 'string' ? changelogPreset : changelogPreset.name;
    const presetConfig = typeof changelogPreset === 'object' ? changelogPreset : {};

    const cacheKey = `${presetName}${presetConfig ? JSON.stringify(presetConfig) : ''}`;

    let config = GetChangelogConfig.cfgCache.get(cacheKey);

    if (!config) {
      let presetPackageName = presetName;

      // https://github.com/npm/npm-package-arg#result-object
      const parsed: any = npa(presetPackageName, rootPath);

      log.verbose('getChangelogConfig', 'using preset %j', presetPackageName);
      log.silly('npa', parsed);

      if (parsed.type === 'directory') {
        if (parsed.raw[0] === '@') {
          // npa parses scoped subpath reference as a directory
          parsed.name = parsed.raw;
          parsed.scope = parsed.raw.substring(0, parsed.raw.indexOf('/'));
          // un-scoped subpath shorthand handled in first catch block
        } else {
          presetPackageName = parsed.fetchSpec;
        }
      } else if (parsed.type === 'git' && parsed.hosted && parsed.hosted.default === 'shortcut') {
        // probably a shorthand subpath, e.g. 'foo/bar'
        parsed.name = parsed.raw;
      }

      // Maybe it doesn't need an implicit 'conventional-changelog-' prefix?
      try {
        config = this.resolveConfigPromise(presetPackageName, presetConfig);

        GetChangelogConfig.cfgCache.set(cacheKey, config);

        // early exit, yay
        return Promise.resolve(config);
      } catch (err: any) {
        log.verbose('getChangelogConfig', err.message);
        log.info('getChangelogConfig', 'Auto-prefixing conventional-changelog preset %j', presetName);

        // probably a deep shorthand subpath :P
        parsed.name = parsed.raw;
      }

      if (parsed.name.indexOf('conventional-changelog-') < 0) {
        // implicit 'conventional-changelog-' prefix
        const parts = parsed.name.split('/');
        const start = parsed.scope ? 1 : 0;

        //        foo =>        conventional-changelog-foo
        // @scope/foo => @scope/conventional-changelog-foo
        parts.splice(start, 1, `conventional-changelog-${parts[start]}`);

        // _technically_ supports 'foo/lib/bar.js', but that's gross
        presetPackageName = parts.join('/');
      }

      try {
        config = this.resolveConfigPromise(presetPackageName, presetConfig);
        GetChangelogConfig.cfgCache.set(cacheKey, config);
      } catch (err: any) {
        log.warn('getChangelogConfig', err.message);

        throw new ValidationError(
          'EPRESET',
          `Unable to load conventional-changelog preset "${presetName}"${presetName !== presetPackageName ? ` (${presetPackageName})` : ''
          }`
        );
      }
    }

    // the core presets are bloody Q.all() spreads
    return Promise.resolve(config);
  }
}
