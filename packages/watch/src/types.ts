import { Package } from '@lerna-lite/core';

export type ChokidarEventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

export interface ChangesStructure {
  [pkgName: string]: {
    pkg: Package;
    events: {
      [eventType in ChokidarEventType]: Set<string>;
    };
  };
}
