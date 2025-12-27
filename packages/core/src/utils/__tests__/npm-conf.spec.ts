import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as npmConfModule from '../npm-conf.js';
import { Conf, npmConf, toNerfDart } from '../npm-conf.js';

describe('@lerna/npm-conf', () => {
  beforeEach(() => {
    // Prevent Conf from loading real npm config files during tests
    vi.spyOn(Conf.prototype, 'addFile').mockReturnValue({} as any);
    vi.spyOn(Conf.prototype, 'addEnv').mockReturnValue({} as any);
    vi.spyOn(Conf.prototype, 'loadCAFile').mockReturnValue(undefined);
  });

  it('exports default factory', () => {
    expect(npmConfModule).toBeDefined();
    expect(Conf).toBeDefined();
    expect(typeof npmConfModule.npmConf).toBe('function');
  });

  it('exports named Conf', () => {
    const { Conf } = npmConfModule;
    expect(Conf).toBeDefined();
    expect(typeof Conf).toBe('function');
  });

  it('exports named toNerfDart', () => {
    const { toNerfDart: toNerfDartMod } = npmConfModule;
    expect(toNerfDart).toBeDefined();
    expect(toNerfDartMod).toBeDefined();
    expect(typeof toNerfDart).toBe('function');
    expect(toNerfDart('https://npm.example.com')).toBe('//npm.example.com/');
    expect(toNerfDart('https://npm.example.com/some-api/npm-virtual/')).toBe('//npm.example.com/some-api/npm-virtual/');
  });

  it('defaults cli parameter to empty object', () => {
    const conf = npmConfModule.npmConf(null);

    expect(conf.sources.cli.data).toEqual({});
  });

  it('overwrites default with cli key', () => {
    const conf = npmConf({ registry: 'https://npm.example.com' });

    expect(conf.get('registry')).toBe('https://npm.example.com');
  });

  it('does not overwrite default with undefined cli key', () => {
    const conf = npmConf({ registry: undefined });

    expect(conf.get('registry')).toBe('https://registry.npmjs.org/');
  });
});