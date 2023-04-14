import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

writeFileSync(resolve('index.js'), "export default 'C';");
