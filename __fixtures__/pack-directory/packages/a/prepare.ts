import { createReadStream, createWriteStream, mkdirSync } from 'node:fs';
import { dirname, resolve as pathResolve } from 'node:path';

const sourceIndex = pathResolve('./src/index.js');
const targetIndex = pathResolve('./dist/index.js');

mkdirSync(dirname(targetIndex));

const reader = createReadStream(sourceIndex);
const writer = createWriteStream(targetIndex);

// fs.copyFileSync is node >=8.5.0
reader.pipe(writer);
