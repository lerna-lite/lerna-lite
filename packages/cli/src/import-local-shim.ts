import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function importLocal(filename: string): unknown {
  const require = createRequire(import.meta.url);
  const normalizedFilename = filename.startsWith('file://') ? fileURLToPath(filename) : filename;
  const cwd = process.cwd();
  const localPath = path.join(cwd, 'node_modules', '.bin', path.basename(normalizedFilename));
  if (existsSync(localPath)) {
    return require(localPath);
  }
  return undefined;
}
