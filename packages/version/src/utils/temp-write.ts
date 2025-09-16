/**
 * All credit to https://github.com/sindresorhus/temp-write/blob/199851974c8af0618e2f1a77023384823f2ae948/index.js
 *
 * Embedded here into lerna directly because we cannot yet migrate to ESM only, and we needed to bump outdated deps.
 */

import { createWriteStream, mkdirSync, realpathSync, writeFile, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Readable } from 'node:stream';
import { promisify } from 'node:util';

import { isStream } from 'is-stream';
import { v4 as uuidv4 } from 'uuid';

const writeFileP = promisify(writeFile);
const tempfileSync = (filePath?: string) => join(realpathSync(tmpdir()), `lerna-${uuidv4()}`, filePath || '');

const writeStream = async (filePath: string, fileContent: Readable) =>
  new Promise((resolve, reject) => {
    const writable = createWriteStream(filePath);

    fileContent
      .on('error', (error) => {
        // Be careful to reject before writable.end(), otherwise the writable's
        // 'finish' event will fire first and we will resolve the promise
        // before we reject it.
        reject(error);
        fileContent.unpipe(writable);
        writable.end();
      })
      .pipe(writable)
      .on('error', reject)
      .on('finish', resolve as () => void);
  });

export async function tempWrite(fileContent: any, filePath?: string) {
  const tempPath = tempfileSync(filePath);
  const write = isStream(fileContent) ? writeStream : writeFileP;

  await mkdir(dirname(tempPath), { recursive: true });
  await write(tempPath, fileContent as DataView & Readable);

  return tempPath;
}

tempWrite.sync = (fileContent: (DataView & Readable) | string, filePath?: string) => {
  const tempPath = tempfileSync(filePath);

  mkdirSync(dirname(tempPath), { recursive: true });
  writeFileSync(tempPath, fileContent);

  return tempPath;
};
