import { Logger } from '@lerna-lite/npmlog';

export interface FilterOptions {
  log: Logger;
  scope: string[];
  ignore: string[];
  private: boolean;
  since: string;
  isIndependent: boolean;
  continueIfNoMatch: boolean;
  excludeDependents: boolean;
  includeDependents: boolean;
  includeDependencies: boolean;
  includeMergedTags: boolean;
}
