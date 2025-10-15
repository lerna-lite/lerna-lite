import { EOL } from 'node:os';
import { join } from 'node:path';
import { log } from '@lerna-lite/npmlog';
import writeFileAtomic from 'write-file-atomic';

export function writeLogFile(cwd: string) {
  let logOutput = '';

  log.record.forEach((m) => {
    let pref: string | string[] = [m.id, m.level];
    if (m.prefix) {
      pref.push(m.prefix);
    }
    pref = pref.join(' ');

    m.message
      .trim()
      .split(/\r?\n/)
      .map((line) => `${pref} ${line}`.trim())
      .forEach((line) => {
        logOutput += line + EOL;
      });
  });

  // this must be synchronous because it is called before process exit
  writeFileAtomic.sync(join(cwd, 'lerna-debug.log'), logOutput);

  // truncate log after writing
  log.record.length = 0;
}
