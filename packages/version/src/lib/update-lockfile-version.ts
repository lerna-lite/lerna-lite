import path from 'path';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';

export function updateLockfileVersion(pkg: { location: string; version: string; }): Promise<string> {
  const lockfilePath = path.join(pkg.location, 'package-lock.json');

  let chain: Promise<any> = Promise.resolve();

  chain = chain.then(() => loadJsonFile(lockfilePath).catch(() => { }));
  chain = chain.then((obj: any) => {
    if (obj) {
      obj.version = pkg.version;

      return writeJsonFile(lockfilePath, obj, {
        detectIndent: true,
        indent: 2,
      }).then(() => lockfilePath);
    }
  });

  return chain as unknown as Promise<string>;
}
