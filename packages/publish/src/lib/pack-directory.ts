import { LifecycleConfig, Package, PackConfig, runLifecycle } from '@lerna-lite/core';
import { tempWrite } from '@lerna-lite/version';
import Arborist from '@npmcli/arborist';
import packlist from 'npm-packlist';
import log from 'npmlog';
import { relative } from 'node:path';
import { Readable } from 'node:stream';
import tar from 'tar';

import { getPacked } from './get-packed.js';
import { Tarball } from '../models/index.js';

/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param {Package|string} _pkg Package instance or path to manifest
 * @param {string} dir to pack
 * @param {PackConfig} options
 */
export async function packDirectory(_pkg: Package, dir: string, options: PackConfig) {
  const pkg = Package.lazy(_pkg, dir);
  const opts: LifecycleConfig = {
    // @ts-ignore
    log,
    ...options,
  };

  opts.log.verbose('pack-directory', relative('.', pkg.contents));

  if (opts.ignorePrepublish !== true) {
    await runLifecycle(pkg, 'prepublish', opts);
  }

  await runLifecycle(pkg, 'prepare', opts);

  if (opts.lernaCommand === 'publish') {
    opts.stdio = 'inherit';
    await pkg.refresh();
    await runLifecycle(pkg, 'prepublishOnly', opts);
    await pkg.refresh();
  }

  await runLifecycle(pkg, 'prepack', opts);
  await pkg.refresh();

  const arborist = new Arborist({ path: pkg.contents });
  const tree = await arborist.loadActual();
  const files: string[] = await packlist(tree);
  const stream: DataView & Readable = tar.create(
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
  );

  const tarFilePath = await tempWrite(stream, getTarballName(pkg));

  return getPacked(pkg, tarFilePath).then((packed: Tarball) =>
    Promise.resolve()
      .then(() => runLifecycle(pkg, 'postpack', opts))
      .then(() => packed)
  );
}

function getTarballName(pkg: Package) {
  const name =
    pkg.name[0] === '@'
      ? // scoped packages get special treatment
        pkg.name.substring(1).replace(/\//g, '-')
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}
