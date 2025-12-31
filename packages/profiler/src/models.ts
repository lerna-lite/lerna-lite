import type { Logger } from '@lerna-lite/npmlog';

export interface ProfilerConfig {
  concurrency: number;
  log?: Logger;
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
