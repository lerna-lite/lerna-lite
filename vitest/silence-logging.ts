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

// Aggressively silence all output at the process level
process.stdout.write = (() => true) as any;
process.stderr.write = (() => true) as any;

// Globally silence console.log and process.stdout.write for all tests
beforeAll(async () => {
  // Silence npmlog
  log.level = 'silent';
  log.disableColor();
  log.disableProgress();
  log.enableProgress = vi.fn(() => {});

  // Silence console and process output
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(() => {
  vi.restoreAllMocks();
});
