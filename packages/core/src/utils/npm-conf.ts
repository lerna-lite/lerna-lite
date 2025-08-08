import { resolve as pathResolve } from 'node:path';

import { Conf } from '../utils/conf.js';
import { Defaults } from './defaults.js';
import { toNerfDart } from './nerf-dart.js';

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L101-L200
function npmConf(opts: any) {
  const conf = new Conf(Object.assign({}, new Defaults().defaults));

  // prevent keys with undefined values from obscuring defaults
  // prettier-ignore
  const cleanOpts = opts
    ? Object.keys(opts).reduce((acc, key) => {
        if (opts[key] !== undefined) {
          acc[key] = opts[key];
        }
        return acc;
      }, {})
    : {};

  conf.add(cleanOpts, 'cli');
  conf.addEnv();
  conf.loadPrefix();

  const projectConf = pathResolve(conf.localPrefix, '.npmrc');
  const userConf = conf.get('userconfig');

  /* v8 ignore else */
  if (!conf.get('global') && projectConf !== userConf) {
    conf.addFile(projectConf, 'project');
  } else {
    conf.add({}, 'project');
  }

  conf.addFile(conf.get('userconfig'), 'user');

  if (conf.get('prefix')) {
    const etc = pathResolve(conf.get('prefix'), 'etc');
    conf.root.globalconfig = pathResolve(etc, 'npmrc');
    conf.root.globalignorefile = pathResolve(etc, 'npmignore');
  }

  conf.addFile(conf.get('globalconfig'), 'global');
  conf.loadUser();

  const caFile = conf.get('cafile');

  /* v8 ignore next if */
  if (caFile) {
    conf.loadCAFile(caFile);
  }

  return conf;
}

export { Conf, npmConf, toNerfDart };
