import path from 'path';
import packlist from 'npm-packlist';
import log from 'npmlog';
import tar from 'tar';
import tempWrite from 'temp-write';

import { Package, PackConfig, runLifecycle } from '@lerna-lite/core';
import { getPacked } from './get-packed';

/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param {Package|string} _pkg Package instance or path to manifest
 * @param {string} dir to pack
 * @param {PackConfig} options
 */
export function packDirectory(_pkg: Package, dir: string, options: PackConfig) {
  const pkg = Package.lazy(_pkg, dir);
  const opts = {
    // @ts-ignore
    log,
    ...options,
  };

  opts.log.verbose('pack-directory', path.relative('.', pkg.contents));

  let chain: Promise<any> = Promise.resolve();

  if (opts.ignorePrepublish !== true) {
    chain = chain.then(() => runLifecycle(pkg, 'prepublish', opts));
  }

  chain = chain.then(() => runLifecycle(pkg, 'prepare', opts));

  if (opts.lernaCommand === 'publish') {
    chain = chain.then(() => pkg.refresh());
    chain = chain.then(() => runLifecycle(pkg, 'prepublishOnly', opts));
    chain = chain.then(() => pkg.refresh());
  }

  chain = chain.then(() => runLifecycle(pkg, 'prepack', opts));
  chain = chain.then(() => pkg.refresh());
  chain = chain.then(() => packlist({ path: pkg.contents }));
  chain = chain.then((files) =>
    tar.create(
      {
        cwd: pkg.contents,
        prefix: 'package/',
        portable: true,
        // Provide a specific date in the 1980s for the benefit of zip,
        // which is confounded by files dated at the Unix epoch 0.
        mtime: new Date('1985-10-26T08:15:00.000Z'),
        gzip: true,
      },
      // NOTE: node-tar does some Magic Stuff depending on prefixes for files
      //       specifically with @ signs, so we just neutralize that one
      //       and any such future 'features' by prepending `./`
      files.map((f) => `./${f}`)
    )
  );
  chain = chain.then((stream) => tempWrite(stream, getTarballName(pkg)));
  chain = chain.then((tarFilePath) =>
    getPacked(pkg, tarFilePath).then((packed) =>
      Promise.resolve()
        .then(() => runLifecycle(pkg, 'postpack', opts))
        .then(() => packed)
    )
  );

  return chain;
}

function getTarballName(pkg) {
  const name =
    pkg.name[0] === '@'
      // scoped packages get special treatment
      ? pkg.name.substr(1).replace(/\//g, '-')
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}
