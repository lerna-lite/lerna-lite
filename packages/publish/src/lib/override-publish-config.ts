import { isEmpty, JsonValue, RawManifest } from '@lerna-lite/core';

// manifest fields that may make sense to overwrite
const PUBLISH_CONFIG_WHITELIST = new Set([
  'bin',
  'type',
  'imports',
  'main',
  'module',
  'typings',
  'types',
  'exports',
  'browser',
  'esnext',
  'es2015',
  'unpkg',
  'umd:main',
  'os',
  'cpu',
  'libc',
  'typesVersions',
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
