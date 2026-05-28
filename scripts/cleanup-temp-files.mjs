import { realpathSync, rmSync, statSync, globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pathJoin } from 'node:path';

export function removeSync(path) {
  rmSync(path, { recursive: true, force: true });
}

const tempDirPath = realpathSync(tmpdir());
const normalizedLernaPath = pathJoin(tempDirPath, 'lerna-*').replace(/\\/g, '/');
console.log('cleanup Lerna temp folders from', normalizedLernaPath);
const deleteFolders = globSync('lerna-*', { cwd: tempDirPath, absolute: true });
const directoryFolders = deleteFolders.filter((folder) => {
  try {
    return statSync(folder).isDirectory();
  } catch {
    return false;
  }
});

console.log(`Found ${directoryFolders.length} temp folders to cleanup.`);
directoryFolders.forEach((folder) => removeSync(folder));
