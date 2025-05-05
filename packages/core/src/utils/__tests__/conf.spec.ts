import { beforeEach, describe, expect, it } from 'vitest';

import { Conf } from '../conf.js';
import * as defaults from '../defaults.js';

describe('conf', () => {
  describe('loadPrefix()', () => {
    let cli;

    beforeEach(() => {
      const conf = new Conf(Object.assign({}, defaults));
      cli = conf.add({}, 'cli');
      conf.addEnv();
      conf.loadPrefix();
    });

    it('should be able to call GETTER/SETTER from object prefix property', () => {
      cli.prefix = 'v';
      expect(cli.prefix).toBe('v');
    });

    it('should be able to call GETTER/SETTER from object globalPrefix property', () => {
      cli.prefix = 'v';
      cli.globalPrefix = 'v';
      expect(cli.prefix).toBe('v');
    });

    it('should be able to call GETTER/SETTER from object localPrefix property', () => {
      cli.prefix = 'v';
      cli.localPrefix = 'v';
      expect(cli.prefix).toBe('v');
    });
  });
});
