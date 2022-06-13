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

export interface ProfilerConfig {
  concurrency: number;
  log?: typeof npmlog;
  outputDirectory?: string;
}

export interface TraceEvent {
  name: string;
  ph: string;
  ts: number;
  pid: number;
  tid: number;
  dur: number;
}
