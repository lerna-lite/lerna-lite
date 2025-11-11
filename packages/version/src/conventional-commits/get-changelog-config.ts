import npa from 'npm-package-arg';
import pify from 'pify';

import { ValidationError } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

import type { ChangelogConfig, ChangelogPresetConfig } from '../interfaces.js';

/** @deprecated this is a temporary workaround until `config?.conventionalChangelog`, `parserOpts` and `writerOpts` are officially removed */
function flattenConfigResult(config: any): ChangelogConfig {
  const flatConfig = config?.conventionalChangelog || config;
  flatConfig.parser = flatConfig.parserOpts || flatConfig.parser;
  flatConfig.writer = flatConfig.writerOpts || flatConfig.writer;

  return flatConfig;
}

export class GetChangelogConfig {
  static cfgCache = new Map<string, any>();

  static isFunction(config: ChangelogConfig) {
    return (
      Object.prototype.toString.call(config) === '[object Function]' ||
      Object.prototype.toString.call(config) === '[object AsyncFunction]'
    );
  }

  static async resolveConfigPromise(
    presetPackageName: string,
    presetConfig: ChangelogPresetConfig
  ): Promise<Omit<ChangelogConfig, 'conventionalChangelog'>> {
    log.verbose('getChangelogConfig', 'Attempting to resolve preset %j', presetPackageName);

    let config = await import(presetPackageName);

    // using import() with local script presets might load it as module default, if so load this default
    if (config?.default) {
      config = config.default;
    }

    log.info('getChangelogConfig', 'Successfully resolved preset %j', presetPackageName);

    if (this.isFunction(config)) {
      try {
        // try assuming config builder function first
        config = config(presetConfig);
      } catch (_) {
        // legacy presets export an errback function instead of Q.all()
        config = (pify(config) as Function)();
      }
    }

    return config;
  }

  /**
   * @param {ChangelogPresetConfig} [changelogPreset]
   * @param {string} [rootPath]
   */
  static async getChangelogConfig(
    changelogPreset: ChangelogPresetConfig = 'conventional-changelog-angular',
    rootPath?: string
  ): Promise<ChangelogConfig> {
    const presetName = typeof changelogPreset === 'string' ? changelogPreset : changelogPreset.name;
    const presetConfig = typeof changelogPreset === 'object' ? changelogPreset : ({} as ChangelogPresetConfig);
    const cacheKey = `${presetName}${presetConfig ? JSON.stringify(presetConfig) : ''}`;
    let config: ChangelogConfig | Promise<ChangelogConfig> = GetChangelogConfig.cfgCache.get(cacheKey);

    if (!config) {
      let presetPackageName = presetName as string;

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
        config = await this.resolveConfigPromise(presetPackageName, presetConfig);
        config = flattenConfigResult(config);

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
        config = await this.resolveConfigPromise(presetPackageName, presetConfig);
        config = flattenConfigResult(config);
        GetChangelogConfig.cfgCache.set(cacheKey, config);
      } catch (err: any) {
        log.warn('getChangelogConfig', err.message);

        throw new ValidationError(
          'EPRESET',
          `Unable to load conventional-changelog preset "${presetName}"${
            presetName !== presetPackageName ? ` (${presetPackageName})` : ''
          }`
        );
      }
    }

    return Promise.resolve(flattenConfigResult(config));
  }
}
