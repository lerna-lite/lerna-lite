import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Get or create the E2E root directory
 * In CI, use a temporary directory. Locally, use /tmp/lerna-lite-e2e for easier debugging
 */
export async function getE2eRoot(): Promise<string> {
  const isCI = process.env.CI === 'true';
  const E2E_ROOT = isCI ? join(tmpdir(), `lerna-lite-e2e-${Date.now()}`) : join(tmpdir(), 'lerna-lite-e2e');

  await mkdir(E2E_ROOT, { recursive: true });
  return E2E_ROOT;
}

/**
 * Normalize environment-specific paths in command output
 */
export function normalizeEnvironment(str: string): string {
  return (
    str
      // Normalize windows backslashes
      .replace(/\\\\/g, '/')
      // Remove absolute paths
      .replace(/([A-Z]:)?[\\/].*?[\\/]lerna-lite-e2e[\\/]/gi, '')
      // Normalize package versions for snapshots
      .replace(/lerna-lite@\\d+\\.\\d+\\.\\d+/g, 'lerna-lite@X.X.X')
      // Normalize timestamps
      .replace(/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z/g, 'TIMESTAMP')
      // Normalize duration
      .replace(/\\d+(\\.\\d+)?(ms|s)/g, 'XXms')
  );
}

/**
 * Normalize command output for consistent snapshots
 */
export function normalizeCommandOutput(str: string): string {
  return (
    normalizeEnvironment(str)
      // Normalize package names with numbers to package-X
      .replace(/package-\\d+/g, 'package-X')
      // Normalize test package names
      .replace(/test-\\d+/g, 'test-X')
      // Remove ANSI color codes
      // eslint-disable-next-line no-control-regex
      .replace(/\u001b\[\d+m/g, '')
  );
}

/**
 * Normalize commit SHAs for snapshots
 */
export function normalizeCommitSHAs(str: string): string {
  return str.replace(/[0-9a-f]{7,40}/gi, 'SHA');
}

/**
 * Trim leading and trailing whitespace from each line
 */
export function trimEnds(str: string): string {
  return str
    .split('\\n')
    .map((line) => line.trim())
    .join('\\n')
    .trim();
}
