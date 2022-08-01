import fs from 'fs';
import path from 'path';

fs.writeFileSync(path.resolve('index.js'), "module.exports = 'C';");
