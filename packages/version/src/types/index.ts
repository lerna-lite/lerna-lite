// eslint-disable-next-line import/no-unresolved
import { PackageLock, LockDependency } from '@npm/types';
import { Lockfile as PnpmLockfile } from '@pnpm/lockfile-types';

export type NpmLockfile = PackageLock & { packages: { [moduleName: string]: LockDependency } };

export type NpmLockfileInformation = {
  json: NpmLockfile;
  path: string;
  version: number;
  packageManager: 'npm';
};

export type PnpmLockfileInformation = {
  json: PnpmLockfile;
  path: string;
  version: number;
  packageManager: 'pnpm';
};

export type LockfileInformation = NpmLockfileInformation | PnpmLockfileInformation;
