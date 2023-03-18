import { glob } from 'glob';
import path from 'path';
import fs from 'fs-extra';
import tempDir from 'temp-dir';
import normalizePath from 'normalize-path';

glob(normalizePath(path.join(tempDir, '/lerna-*'))).then((deleteFolders) => {
  // delete silently all files/folders that startsWith "lerna-"
  console.log(`Found ${deleteFolders.length} temp folders to cleanup.`);
  (deleteFolders || []).forEach((folder) => fs.removeSync(folder));
});
