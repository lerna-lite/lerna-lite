import { glob } from 'glob';
import { join } from 'node:path';
import { removeSync } from 'fs-extra/esm';
import tempDir from 'temp-dir';
import normalizePath from 'normalize-path';

glob(normalizePath(join(tempDir, '/lerna-*'))).then((deleteFolders) => {
  // delete silently all files/folders that startsWith "lerna-"
  console.log(`Found ${deleteFolders.length} temp folders to cleanup.`);
  (deleteFolders || []).forEach((folder) => removeSync(folder));
});
