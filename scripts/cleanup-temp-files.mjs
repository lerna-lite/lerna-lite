import glob from 'glob';
import path from 'path';
import fs from 'fs';
import tempDir from 'temp-dir';

glob(path.join(tempDir, '/lerna-*'), (error, deleteFolders) => {
  // delete silently all files/folders that startsWith "lerna-"
  console.log(`Found ${deleteFolders.length} temp files/folders to cleanup.`);
  (deleteFolders || []).forEach((folder) => fs.rmdir(folder, { recursive: true }, () => {}));
});
