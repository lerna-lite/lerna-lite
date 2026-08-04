import { difference, isLess } from 'verkit';

export function isBreakingChange(currentVersion: string, nextVersion: string): boolean {
  const releaseType = difference(currentVersion, nextVersion);
  let breaking;

  if (releaseType === 'major') {
    // self-evidently
    breaking = true;
  } else if (releaseType === 'minor') {
    // 0.1.9 => 0.2.0 is breaking
    breaking = isLess(currentVersion, '1.0.0');
  } else if (releaseType === 'patch') {
    // 0.0.1 => 0.0.2 is breaking(?)
    breaking = isLess(currentVersion, '0.1.0');
  } else {
    // versions are equal, or any prerelease
    breaking = false;
  }

  return breaking;
}
