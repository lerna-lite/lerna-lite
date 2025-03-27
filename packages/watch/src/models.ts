import { Package } from '@lerna-lite/core';

export interface ChangesStructure {
  [pkgName: string]: {
    pkg: Package;
    changeFiles: Set<string>;
    timestamp: number;
  };
}
