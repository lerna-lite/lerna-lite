import { dirname } from 'node:path';
import normalizePath from 'normalize-path';
import { afterEach, vi } from 'vitest';

const { loadJsonFile: actualLoadJsonFile, loadJsonFileSync: loadJsonFileSyncActual } =
  await vi.importActual<any>('load-json-file');

const asyncRegistry = new Map();
const syncRegistry = new Map();

function incrementCalled(registry, manifestLocation) {
  // `temporaryDirectory()` creates dirnames with a UUID that are 36 characters long, but we want a readable key
  const subPath = (manifestLocation || '').split(/(lerna-)?[0-9a-f-]{36}/).pop();
  const key = normalizePath(dirname(subPath));

  // keyed off directory subpath, _not_ pkg.name (we don't know it yet)
  registry.set(key, (registry.get(key) || 0) + 1);
}

// by default, act like a spy that counts number of times each location was loaded
export const loadJsonFile: any = vi.fn((manifestLocation) => {
  incrementCalled(asyncRegistry, manifestLocation);

  return actualLoadJsonFile(manifestLocation);
});

export const loadJsonFileSync = vi.fn((manifestLocation) => {
  incrementCalled(syncRegistry, manifestLocation);

  return loadJsonFileSyncActual(manifestLocation);
});

(loadJsonFile as any).registry = asyncRegistry;
(loadJsonFileSync as any).registry = syncRegistry;

// keep test data isolated
afterEach(() => {
  asyncRegistry.clear();
  syncRegistry.clear();
});
