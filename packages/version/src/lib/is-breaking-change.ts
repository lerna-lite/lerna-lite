import semver from 'semver';

export function isBreakingChange(currentVersion: string, nextVersion: string): boolean {
  if (!nextVersion || typeof nextVersion !== 'string') {
    return false;
  }

  // ensure nextVersion is a valid semver string; if not, treat as non-breaking
  const validNext = semver.valid(nextVersion);
  if (!validNext) {
    return false;
  }

  const releaseType = semver.diff(currentVersion, validNext);
  let breaking;

  if (releaseType === 'major') {
    // self-evidently
    breaking = true;
  } else if (releaseType === 'minor') {
    // 0.1.9 => 0.2.0 is breaking
    breaking = semver.lt(currentVersion, '1.0.0');
  } else if (releaseType === 'patch') {
    // 0.0.1 => 0.0.2 is breaking(?)
    breaking = semver.lt(currentVersion, '0.1.0');
  } else {
    // versions are equal, or any prerelease
    breaking = false;
  }

  return breaking;
}
