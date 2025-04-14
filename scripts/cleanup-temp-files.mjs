import { removeSync } from 'fs-extra/esm';
import { join as pathJoin } from 'node:path';
import normalizePath from 'normalize-path';
import tempDir from 'temp-dir';
import { glob } from 'tinyglobby';

console.log('cleanup Lerna temp folders from', normalizePath(pathJoin(tempDir, '/lerna-*')));
glob(normalizePath(pathJoin(tempDir, '/lerna-*')), { absolute: true, cwd: tempDir, onlyDirectories: true })
  .then((deleteFolders) => {
    // silently delete all files/folders that startsWith "lerna-"
    console.log(`Found ${deleteFolders.length} temp folders to cleanup.`);
    deleteFolders.forEach((folder) => removeSync(folder));
  })
  .catch((error) => {
    console.error('Error occurred while cleaning up temp folders:', error);
  });
