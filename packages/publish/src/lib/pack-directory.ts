import { relative } from 'node:path';

import type { ArboristLoadOption, LifecycleConfig, PackConfig } from '@lerna-lite/core';
import { Package, runLifecycle } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { tempWrite } from '@lerna-lite/version';
import Arborist from '@npmcli/arborist';
import packlist from 'npm-packlist';
import { create } from 'tar';

import { getPacked } from './get-packed.js';

/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param {Package|string} _pkg Package instance or path to manifest
 * @param {string} dir to pack
 * @param {PackConfig} options
 */
export async function packDirectory(_pkg: Package, dir: string, options: PackConfig, arboristOptions?: ArboristLoadOption) {
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
  const tree = await arborist.loadActual({ ...arboristOptions });
  const files: string[] = await packlist(tree);
  const stream = create(
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
  const packed = await getPacked(pkg, tarFilePath);

  await runLifecycle(pkg, 'postpack', opts);

  return packed;
}

function getTarballName(pkg: Package) {
  const name =
    pkg.name[0] === '@'
      ? // scoped packages get special treatment
        pkg.name.substring(1).replace(/\//g, '-')
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}