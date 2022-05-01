import fs from 'fs-extra';
import npmlog from 'npmlog';
// @ts-ignore
import upath from 'upath';

import { ProfilerConfig, TraceEvent } from '../models';

const hrtimeToMicroseconds = (hrtime: any) => {
  return (hrtime[0] * 1e9 + hrtime[1]) / 1000;
};

const range = (len: number) => {
  return Array(len)
    // @ts-ignore
    .fill()
    .map((_, idx) => idx);
};

const getTimeBasedFilename = () => {
  const now = new Date(); // 2011-10-05T14:48:00.000Z
  const datetime = now.toISOString().split('.')[0]; // 2011-10-05T14:48:00
  const datetimeNormalized = datetime.replace(/-|:/g, ''); // 20111005T144800
  return `Lerna-Profile-${datetimeNormalized}.json`;
};

/**
 * A profiler to trace execution times across multiple concurrent calls.
 */
export class Profiler {
  events: TraceEvent[] = [];
  logger: typeof npmlog;
  outputPath: string;
  threads: number[];

  /**
   * @param {ProfilerConfig} options
   */
  constructor({ concurrency, log = npmlog, outputDirectory }: ProfilerConfig) {
    this.events = [];
    this.logger = log;
    this.outputPath = upath.join(upath.resolve(outputDirectory || '.'), getTimeBasedFilename());
    this.threads = range(concurrency);
  }

  run(fn: () => void, name: string) {
    let startTime: any;
    let threadId!: number;

    return Promise.resolve()
      .then(() => {
        startTime = process.hrtime();
        threadId = this.threads.shift() as number;
      })
      .then(() => fn())
      .then((value) => {
        const duration = process.hrtime(startTime);

        // Trace Event Format documentation:
        // https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
        const event = {
          name,
          ph: 'X',
          ts: hrtimeToMicroseconds(startTime),
          pid: 1,
          tid: threadId,
          dur: hrtimeToMicroseconds(duration),
        } as TraceEvent;

        this.events.push(event);

        this.threads.unshift(threadId);
        this.threads.sort();

        return value;
      });
  }

  output() {
    return fs
      .outputJson(this.outputPath, this.events)
      .then(() => this.logger.info('profiler', `Performance profile saved to ${this.outputPath}`));
  }
}
