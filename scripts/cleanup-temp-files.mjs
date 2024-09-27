import { globby } from 'globby';
import { join as pathJoin } from 'node:path';
import { removeSync } from 'fs-extra/esm';
import tempDir from 'temp-dir';
import normalizePath from 'normalize-path';

globby(normalizePath(pathJoin(tempDir, '/lerna-*')), { onlyDirectories: true })
  .then((deleteFolders) => {
    // silently delete all files/folders that startsWith "lerna-"
    console.log(`Found ${deleteFolders.length} temp folders to cleanup.`);
    (deleteFolders || []).forEach((folder) => removeSync(folder));
  })
  .catch((error) => {
    console.error('Error occurred while cleaning up temp folders:', error);
  });
