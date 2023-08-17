import { afterEach, vi } from 'vitest';
import { dirname } from 'node:path';
import normalizePath from 'normalize-path';

const { loadJsonFile: actualLoadJsonFile, loadJsonFileSync: loadJsonFileSyncActual } =
  await vi.importActual<any>('load-json-file');

const asyncRegistry = new Map();
const syncRegistry = new Map();

function incrementCalled(registry, manifestLocation) {
  // tempy creates dirnames that are 32 characters long, but we want a readable key
  const subPath = (manifestLocation || '').split(/[0-9a-f]{32}/).pop();
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

// export { asyncRegistry as registry, mockLoadJsonFile as loadJsonFile, mockLoadJsonFileSync as loadJsonFileSync };
// export {
//   registry: asyncRegistry,
//   loadJsonFile: mockLoadJsonFile,
//   loadJsonFileSync: mockLoadJsonFileSync,
// };
// export {
//   // registry: asyncRegistry,
//   loadJsonFile: mockLoadJsonFile,
//   loadJsonFileSync: mockLoadJsonFileSync,
// }

// module.exports.loadJsonFile = mockLoadJsonFile;
// module.exports.registry = asyncRegistry;
// module.exports.loadJsonFileSync = mockLoadJsonFileSync;
// module.exports.loadJsonFileSync.registry = syncRegistry;

// mockLoadJsonFile.registry = asyncRegistry;
// mockLoadJsonFile.sync = mockLoadJsonFileSync;
// mockLoadJsonFile.sync.registry = syncRegistry;
// export default mockLoadJsonFile;
