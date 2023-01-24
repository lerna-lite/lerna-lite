import npmlog from 'npmlog';

export interface FilterOptions {
  log: typeof npmlog;
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
