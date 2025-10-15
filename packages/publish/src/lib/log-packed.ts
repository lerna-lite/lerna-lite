import type { Package } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import byteSize from 'byte-size';
import columnify from 'columnify';
import hasUnicode from 'has-unicode';
import c from 'tinyrainbow';
import type { Tarball } from '../interfaces.js';

export function logPacked(pkg: Package & { packed: Tarball }, dryRun = false) {
  const tarball = pkg.packed;
  log.notice('', dryRun ? c.bgMagenta('[dry-run]') : '');
  log.notice('', `${hasUnicode() ? '📦 ' : 'package:'} ${tarball.name}@${tarball.version}`);

  if (tarball.files && tarball.files.length) {
    log.notice('=== Tarball Contents ===', '');
    log.notice(
      '',
      columnify(
        tarball.files.map((f) => {
          const bytes = byteSize(f.size);
          return {
            path: f.path,
            size: `${bytes.value}${bytes.unit}`,
          };
        }),
        {
          include: ['size', 'path'],
          showHeaders: false,
        }
      )
    );
  }

  if (tarball.bundled && tarball.bundled.length) {
    log.notice('=== Bundled Dependencies ===', '');
    tarball.bundled.forEach((name) => log.notice('', name));
  }

  log.notice('=== Tarball Details ===', '');
  log.notice(
    '',
    columnify(
      [
        { name: 'name:', value: tarball.name },
        { name: 'version:', value: tarball.version },
        tarball.filename && { name: 'filename:', value: tarball.filename },
        tarball.size && { name: 'package size:', value: byteSize(tarball.size) },
        tarball.unpackedSize && { name: 'unpacked size:', value: byteSize(tarball.unpackedSize) },
        tarball.shasum && { name: 'shasum:', value: tarball.shasum },
        tarball.integrity && { name: 'integrity:', value: elideIntegrity(tarball.integrity) },
        tarball.bundled?.length && { name: 'bundled deps:', value: tarball.bundled.length },
        tarball.bundled?.length && { name: 'bundled files:', value: tarball.entryCount - tarball.files.length },
        tarball.bundled?.length && { name: 'own files:', value: tarball.files.length },
        tarball.entryCount && { name: 'total files:', value: tarball.entryCount },
      ].filter((x) => x),
      {
        include: ['name', 'value'],
        showHeaders: false,
      }
    )
  );

  // in dry-run mode, show tarball temp location and dependencies, devDependencies and/or peerDependencies
  if (dryRun) {
    log.notice('', `--- ${c.bgMagenta('DRY-RUN')} details ---`);
    log.notice('', `temp location: ${tarball.tarFilePath}`);
    log.notice('', `package name: ${pkg.name}`);
    if (pkg.dependencies) {
      log.notice('dependencies:', '');
      log.notice('', columnify(pkg.dependencies, { columnSplitter: ' | ', showHeaders: false }));
    }
    if (pkg.devDependencies) {
      log.notice('devDependencies:', '');
      log.notice('', columnify(pkg.devDependencies, { columnSplitter: ' | ', showHeaders: false }));
    }
    if (pkg.peerDependencies) {
      log.notice('peerDependencies:', '');
      log.notice('', columnify(pkg.peerDependencies, { columnSplitter: ' | ', showHeaders: false }));
    }
  }

  // an empty line
  log.notice('', '');
}

function elideIntegrity(integrity: any) {
  const str = integrity.toString();

  return `${str.substr(0, 20)}[...]${str.substr(80)}`;
}
