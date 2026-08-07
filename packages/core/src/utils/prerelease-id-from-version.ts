import { getPrerelease } from 'verkit';

/**
 * @param {string} version
 * @returns {string|undefined}
 */
export function prereleaseIdFromVersion(version: string): string | undefined {
  return ((getPrerelease(version) || []) as string[]).shift();
}
