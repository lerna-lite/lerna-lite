import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as pathResolve } from 'node:path';

const distDir = pathResolve('dist');
const pkg = JSON.parse(readFileSync(pathResolve('package.json'), 'utf8'));

delete pkg.private;
delete pkg.scripts;
delete pkg.publishConfig;

pkg.description = 'big important things to do';
pkg.main = 'prepacked.js';

mkdirSync(distDir);
writeFileSync(join(distDir, 'package.json'), JSON.stringify(pkg, null, 2));
writeFileSync(join(distDir, 'prepacked.js'), "export default 'B';");
