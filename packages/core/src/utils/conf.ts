import assert from 'node:assert';
import { readFileSync, statSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

// @ts-ignore
import { ConfigChain } from 'config-chain';

import { envReplace } from './env-replace.js';
import { findPrefix } from './find-prefix.js';
import { toNerfDart } from './nerf-dart.js';
import { parseField } from './parse-field.js';

export class Conf extends ConfigChain {
  _await: any;
  addString: any;
  del: any;
  get: any;
  set: any;
  globalPrefix = '';
  localPrefix = '';
  root: any;
  sources: any;
  push: any;
  list: any;

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L208-L222
  constructor(base: any) {
    super(base);
    this.root = base;
  }

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L332-L342
  add(data: any, marker: any) {
    for (const x of Object.keys(data)) {
      // https://github.com/npm/npm/commit/f0e998d
      const newKey = envReplace(x);
      const newField = parseField(data[x], newKey);

      delete data[x];
      data[newKey] = newField;
    }

    return super.add(data, marker);
  }

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L312-L325
  addFile(file: string, name: string = file) {
    const marker = { __source__: name };

    this.sources[name] = { path: file, type: 'ini' };
    this.push(marker);
    this._await();

    try {
      const contents = readFileSync(file, 'utf8');
      this.addString(contents, file, 'ini', marker);
    } catch (err: any) {
      this.add({}, marker);
    }

    return this;
  }

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L344-L360
  addEnv(env: { [key: string]: string | undefined } = process.env) {
    const conf = {};

    Object.keys(env)
      .filter((x) => /^npm_config_/i.test(x))
      .forEach((x) => {
        if (!env[x]) {
          return;
        }

        // leave first char untouched, even if it is a '_'
        // convert all other '_' to '-'
        const p = x
          .toLowerCase()
          .replace(/^npm_config_/, '')
          .replace(/(?!^)_/g, '-');

        conf[p] = env[x];
      });

    return super.addEnv('', conf, 'env');
  }

  // https://github.com/npm/npm/blob/latest/lib/config/load-prefix.js
  loadPrefix() {
    const cli = this.list[0];

    Object.defineProperty(this, 'prefix', {
      enumerable: true,
      set: (prefix) => {
        const g = this.get('global');
        this[g ? 'globalPrefix' : 'localPrefix'] = prefix;
      },
      get: () => {
        const g = this.get('global');
        return g ? this.globalPrefix : this.localPrefix;
      },
    });

    Object.defineProperty(this, 'globalPrefix', {
      enumerable: true,
      set: (prefix) => {
        this.set('prefix', prefix);
      },
      get: () => pathResolve(this.get('prefix')),
    });

    let p;

    Object.defineProperty(this, 'localPrefix', {
      enumerable: true,
      set: (prefix) => {
        p = prefix;
      },
      get: () => p,
    });

    if (Object.prototype.hasOwnProperty.call(cli, 'prefix')) {
      p = pathResolve(cli.prefix);
    } else {
      p = findPrefix(process.cwd());
    }

    return p;
  }

  // https://github.com/npm/npm/blob/latest/lib/config/load-cafile.js
  loadCAFile(file: string) {
    if (!file) {
      return;
    }

    try {
      const contents = readFileSync(file, 'utf8');
      const delim = '-----END CERTIFICATE-----';
      const output = contents
        .split(delim)
        .filter((x) => Boolean(x.trim()))
        .map((x) => x.trimLeft() + delim);

      this.set('ca', output);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return;
      }

      throw err;
    }
  }

  // https://github.com/npm/npm/blob/latest/lib/config/set-user.js
  loadUser() {
    const defConf = this.root;

    if (this.get('global')) {
      return;
    }

    if (process.env.SUDO_UID) {
      defConf.user = Number(process.env.SUDO_UID);
      return;
    }

    const prefix = pathResolve(this.get('prefix'));

    try {
      const stats = statSync(prefix);
      defConf.user = stats.uid;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return;
      }

      throw err;
    }
  }

  // https://github.com/npm/npm/blob/24ec9f2/lib/config/get-credentials-by-uri.js
  getCredentialsByURI(uri: string) {
    assert(uri && typeof uri === 'string', 'registry URL is required');

    const nerfed = toNerfDart(uri);
    const defnerf = toNerfDart(this.get('registry'));

    // hidden class micro-optimization
    const c: any = {
      scope: nerfed,
      token: undefined,
      password: undefined,
      username: undefined,
      email: undefined,
      auth: undefined,
      alwaysAuth: undefined,
    };

    // used to override scope matching for tokens as well as legacy auth
    if (this.get(`${nerfed}:always-auth`) !== undefined) {
      const val = this.get(`${nerfed}:always-auth`);

      c.alwaysAuth = val === 'false' ? false : !!val;
    } else if (this.get('always-auth') !== undefined) {
      c.alwaysAuth = this.get('always-auth');
    }

    if (this.get(`${nerfed}:_authToken`)) {
      c.token = this.get(`${nerfed}:_authToken`);

      // the bearer token is enough, don't confuse things
      return c;
    }

    // Handle the old-style _auth=<base64> style for the default registry, if set.
    let authDef = this.get('_auth');
    let userDef = this.get('username');
    let passDef = this.get('_password');

    if (authDef && !(userDef && passDef)) {
      authDef = Buffer.from(authDef, 'base64').toString();
      authDef = authDef.split(':');
      userDef = authDef.shift();
      passDef = authDef.join(':');
    }

    if (this.get(`${nerfed}:_password`)) {
      c.password = Buffer.from(this.get(`${nerfed}:_password`), 'base64').toString('utf8');
    } else if (nerfed === defnerf && passDef) {
      c.password = passDef;
    }

    if (this.get(`${nerfed}:username`)) {
      c.username = this.get(`${nerfed}:username`);
    } else if (nerfed === defnerf && userDef) {
      c.username = userDef;
    }

    if (this.get(`${nerfed}:email`)) {
      c.email = this.get(`${nerfed}:email`);
    } else if (this.get('email')) {
      c.email = this.get('email');
    }

    if (c.username && c.password) {
      c.auth = Buffer.from(`${c.username}:${c.password}`).toString('base64');
    }

    return c;
  }

  // https://github.com/npm/npm/blob/24ec9f2/lib/config/set-credentials-by-uri.js
  setCredentialsByURI(uri, c) {
    assert(uri && typeof uri === 'string', 'registry URL is required');
    assert(c && typeof c === 'object', 'credentials are required');

    const nerfed = toNerfDart(uri);

    if (c.token) {
      this.set(`${nerfed}:_authToken`, c.token, 'user');
      this.del(`${nerfed}:_password`, 'user');
      this.del(`${nerfed}:username`, 'user');
      this.del(`${nerfed}:email`, 'user');
      this.del(`${nerfed}:always-auth`, 'user');
    } else if (c.username || c.password || c.email) {
      assert(c.username, 'must include username');
      assert(c.password, 'must include password');
      assert(c.email, 'must include email address');

      this.del(`${nerfed}:_authToken`, 'user');

      const encoded = Buffer.from(c.password, 'utf8').toString('base64');

      this.set(`${nerfed}:_password`, encoded, 'user');
      this.set(`${nerfed}:username`, c.username, 'user');
      this.set(`${nerfed}:email`, c.email, 'user');

      if (c.alwaysAuth !== undefined) {
        this.set(`${nerfed}:always-auth`, c.alwaysAuth, 'user');
      } else {
        this.del(`${nerfed}:always-auth`, 'user');
      }
    } else {
      throw new Error('No credentials to set.');
    }
  }
}
