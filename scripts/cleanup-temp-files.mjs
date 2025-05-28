import { removeSync } from 'fs-extra/esm';
import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pathJoin } from 'node:path';
import normalizePath from 'normalize-path';
import { glob } from 'tinyglobby';

const tempDirPath = realpathSync(tmpdir());
const normalizedLernaPath = normalizePath(pathJoin(tempDirPath, 'lerna-*'));
console.log('cleanup Lerna temp folders from', normalizedLernaPath);
glob(normalizedLernaPath, { absolute: true, cwd: tempDirPath, onlyDirectories: true })
  .then((deleteFolders) => {
    // silently delete all files/folders that startsWith "lerna-"
    console.log(`Found ${deleteFolders.length} temp folders to cleanup.`);
    deleteFolders.forEach((folder) => removeSync(folder));
  })
  .catch((error) => {
    console.error('Error occurred while cleaning up temp folders:', error);
  });
