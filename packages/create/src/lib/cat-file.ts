import { writeFileSync } from 'node:fs';
import path from 'path';

/**
 * @param {string} baseDir
 * @param {string} fileName
 * @param {string} content
 * @param {string | import('fs-extra').WriteFileOptions} [opts]
 */
export function catFile(baseDir, fileName, content, opts: any = 'utf8') {
  return writeFileSync(path.join(baseDir, fileName), `${content}\n`, opts);
}
