import { Package } from '@lerna-lite/core';
import npmlog from 'npmlog';

export interface FilterOptions {
  log: typeof npmlog;
  scope: string[];
  ignore: string[];
  private: boolean;
  since: string;
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

export interface RunScriptOption {
  args: any;
  npmClient: string;
  pkg: Package;
  reject?: boolean;
}
export interface ScriptStreamingOption extends RunScriptOption {
  prefix?: boolean;
}
