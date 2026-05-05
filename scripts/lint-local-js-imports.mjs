import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

// temp script to check for missing ".js" extensions in relative local imports
// related oxlint issue: https://github.com/oxc-project/oxc/issues/19431

const roots = ['frameworks', 'frameworks-plugins', 'packages'];
const excludedFolders = ['frameworks/angular-slickgrid'];
const allowedExtPattern = /\.(js|json|mjs|vue)$/;
const fromPattern = /from\s+['\"](\.\.?\/[^'\"]+)['\"]/g;

function color(text, format) {
  return process.stdout.isTTY ? styleText(format, text) : text;
}

function normalizeSlashes(value) {
  return value.replaceAll('\\', '/');
}

function isExcluded(fullPath) {
  const normalized = normalizeSlashes(fullPath);
  return excludedFolders.some((excludedPath) => normalized === excludedPath || normalized.startsWith(`${excludedPath}/`));
}

/** @param {string} dir */
function walk(dir, acc) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (isExcluded(fullPath)) {
        continue;
      }
      if (entry.name === 'node_modules' || entry.name === 'generated-parser' || entry.name === 'dist') {
        continue;
      }
      walk(fullPath, acc);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      acc.push(fullPath);
    }
  }
}

const files = [];
for (const root of roots) {
  walk(root, files);
}

const scopedFiles = files.filter((filePath) => {
  if (filePath.startsWith(`packages${path.sep}`)) {
    return filePath.includes(`${path.sep}src${path.sep}`);
  }
  return true;
});

const errors = [];
for (const filePath of scopedFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    fromPattern.lastIndex = 0;

    for (let match = fromPattern.exec(line); match !== null; match = fromPattern.exec(line)) {
      const importPath = match[1];
      if (!allowedExtPattern.test(importPath)) {
        errors.push({
          filePath,
          lineNumber: i + 1,
          line: line.trim(),
        });
      }
    }
  }
}

if (errors.length > 0) {
  console.error(color(`Found ${errors.length} relative imports missing a file extension (.js, .json, .mjs, or .vue).`, ['red', 'bold']));
  console.error(color('Add the appropriate extension to the import path in the following lines:', 'yellow'));
  console.error('');

  for (const error of errors) {
    console.error(`${color('', 'red')}${color(`${error.filePath}:${error.lineNumber}`, 'cyan')}`);
    console.error(` - ${color(`${error.line}`, 'red')}`);
    console.error('');
  }

  console.error('');
  console.error(color(`Total violations: ${errors.length}`, ['red', 'bold']));
  process.exit(1);
}

console.log(color('All relative imports have file extensions.', 'green'));
