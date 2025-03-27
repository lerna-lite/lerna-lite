import type { JsonValue, RawManifest } from '@lerna-lite/core';
import { isEmpty } from '@lerna-lite/core';

// manifest fields that may make sense to overwrite
const PUBLISH_CONFIG_WHITELIST = new Set([
  'bin',
  'browser',
  'cpu',
  'esnext',
  'es2015',
  'exports',
  'imports',
  'libc',
  'main',
  'module',
  'os',
  'type',
  'types',
  'typings',
  'typesVersions',
  'umd:main',
  'unpkg',
]);

/**
 * It is possible to override some fields in the manifest before the package is published, we will use the same code as pnpm
 * @see https://github.com/pnpm/pnpm/blob/main/packages/exportable-manifest/src/overridePublishConfig.ts
 */
export function overridePublishConfig(manifest: RawManifest) {
  const publishConfig = manifest?.publishConfig as { [dep: string]: JsonValue };

  if (publishConfig) {
    Object.entries(publishConfig)
      .filter(([key]) => PUBLISH_CONFIG_WHITELIST.has(key))
      .forEach(([key, value]) => {
        manifest[key] = value;
        delete publishConfig[key];
      });

    if (isEmpty(publishConfig)) {
      delete manifest.publishConfig;
    }
  }
}
