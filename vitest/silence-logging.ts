import { log } from '@lerna-lite/npmlog';
import { afterAll, beforeAll, vi } from 'vitest';

// silence logs
log.level = 'silent';

// keep snapshots stable
log.disableColor();

// avoid corrupting test logging
log.disableProgress();

// never let anyone enable progress
// log.enableProgress = vi.fn();
log.enableProgress = vi.fn(() => {});

// Globally silence console.log and process.stdout.write for all tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});
afterAll(() => {
  vi.restoreAllMocks();
});
