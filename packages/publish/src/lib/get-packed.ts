import fs from 'fs-extra';
import path from 'path';
import ssri from 'ssri';
import tar from 'tar';

import { Package } from '@lerna-lite/core';

export function getPacked(pkg: Package, tarFilePath: string) {
  const bundledWanted = new Set<string>(/* pkg.bundleDependencies || pkg.bundledDependencies || */[]);
  const bundled = new Set();
  const files: { path: string; size: string; mode: string; }[] = [];

  let totalEntries = 0;
  let totalEntrySize = 0;

  return tar
    .list({
      file: tarFilePath,
      onentry(entry) {
        totalEntries += 1;
        totalEntrySize += entry.size;

        const p = entry.path;

        /* istanbul ignore if */
        if (p.startsWith('package/node_modules/')) {
          const name: string = p.match(/^package\/node_modules\/((?:@[^/]+\/)?[^/]+)/)[1];

          if (bundledWanted.has(name)) {
            bundled.add(name);
          }
        } else {
          files.push({
            path: entry.path.replace(/^package\//, ''),
            size: entry.size,
            mode: entry.mode,
          });
        }
      },
      strip: 1,
    })
    .then(() =>
      Promise.all([
        fs.stat(tarFilePath),
        ssri.fromStream(fs.createReadStream(tarFilePath), {
          algorithms: ['sha1', 'sha512'],
        }),
      ])
    )
    .then(([{ size }, { sha1, sha512 }]) => {
      const shasum = sha1[0].hexDigest();

      return {
        id: `${pkg.name}@${pkg.version}`,
        name: pkg.name,
        version: pkg.version,
        size,
        unpackedSize: totalEntrySize,
        shasum,
        integrity: ssri.parse(sha512[0]),
        filename: path.basename(tarFilePath),
        files,
        entryCount: totalEntries,
        bundled: Array.from(bundled),
        tarFilePath,
      };
    });
}
