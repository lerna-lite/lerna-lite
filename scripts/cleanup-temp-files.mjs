import { realpathSync, rmSync, statSync, globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pathJoin } from 'node:path';

export function removeSync(path) {
  rmSync(path, { recursive: true, force: true });
}

const tempDirPath = realpathSync(tmpdir());
console.log('cleanup Lerna temp folders from', pathJoin(tempDirPath, 'lerna-*'));
const deleteFolders = globSync('lerna-*', { cwd: tempDirPath }).map((f) => pathJoin(tempDirPath, f));
const directoryFolders = deleteFolders.filter((folder) => {
  try {
    return statSync(folder).isDirectory();
  } catch {
    return false;
  }
});

console.log(`Found ${directoryFolders.length} temp folders to cleanup.`);
directoryFolders.forEach((folder) => removeSync(folder));
