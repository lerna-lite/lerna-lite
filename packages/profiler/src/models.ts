import npmlog from 'npmlog';

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
