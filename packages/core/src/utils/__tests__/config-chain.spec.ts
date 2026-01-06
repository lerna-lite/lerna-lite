import { existsSync, readFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigChain } from '../config-chain.js';

vi.mock('node:fs');

describe('ConfigChain', () => {
  let cc: ConfigChain;

  beforeEach(() => {
    cc = new ConfigChain();
    vi.mocked(existsSync).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty list', () => {
      const chain = new ConfigChain();
      expect(chain.list).toEqual([]);
    });

    it('should initialize with base config', () => {
      const base = { foo: 'bar' };
      const chain = new ConfigChain(base);
      expect(chain.list).toEqual([base]);
      expect(chain.get('foo')).toBe('bar');
    });
  });

  describe('add', () => {
    it('should add configuration to the list', () => {
      cc.add({ foo: 'bar' }, 'test');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should add multiple configurations', () => {
      cc.add({ foo: 'bar' }, 'first');
      cc.add({ baz: 'qux' }, 'second');
      expect(cc.get('foo')).toBe('bar');
      expect(cc.get('baz')).toBe('qux');
    });

    it('should store source information', () => {
      cc.add({ foo: 'bar' }, 'test');
      expect(cc.get('foo', 'test')).toBe('bar');
    });

    it('should return this for chaining', () => {
      const result = cc.add({ foo: 'bar' }, 'test');
      expect(result).toBe(cc);
    });

    it('should replace marker placeholder with data (like addFile pattern)', () => {
      const marker = { __source__: 'test-marker' };
      // First push the marker as a placeholder (like addFile does)
      cc.list.push(marker as any);
      cc.sources['test-marker'] = {};
      // Then add data which should replace the marker
      cc.add({ foo: 'bar' }, marker);
      expect(cc.get('foo')).toBe('bar');
      // Marker should be replaced in list, not present anymore
      expect(cc.list.indexOf(marker as any)).toBe(-1);
      expect(cc.list.some((item) => item.foo === 'bar')).toBe(true);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent keys', () => {
      expect(cc.get('nonexistent')).toBeUndefined();
    });

    it('should get value with __underscore prefix (like original library)', () => {
      cc.add({ __sample: 'for fun only' }, 'forFun');
      expect(cc.get('__sample', 'forFun')).toBe('for fun only');
    });

    it('should prioritize CLI config over base defaults', () => {
      cc.add({ registry: 'https://registry.npmjs.org/' }, 'defaults'); // base at index 0
      cc.add({ registry: 'http://localhost:4873/' }, 'cli'); // CLI at index 1
      expect(cc.get('registry')).toBe('http://localhost:4873/');
    });

    it('should prioritize CLI over environment variables', () => {
      cc.add({ foo: 'base' }, 'defaults');
      cc.add({ foo: 'cli-value' }, 'cli');
      cc.add({ foo: 'env-value' }, 'env');
      expect(cc.get('foo')).toBe('cli-value');
    });

    it('should fall back to base when key not in CLI', () => {
      cc.add({ foo: 'base-value', bar: 'base-bar' }, 'defaults');
      cc.add({ foo: 'cli-value' }, 'cli');
      expect(cc.get('foo')).toBe('cli-value');
      expect(cc.get('bar')).toBe('base-bar');
    });

    it('should support getting value from specific source', () => {
      cc.add({ foo: 'value1' }, 'source1');
      cc.add({ foo: 'value2' }, 'source2');
      expect(cc.get('foo', 'source1')).toBe('value1');
      expect(cc.get('foo', 'source2')).toBe('value2');
    });

    it('should return undefined when source does not exist', () => {
      cc.add({ foo: 'bar' }, 'test');
      expect(cc.get('foo', 'nonexistent')).toBeUndefined();
    });

    it('should handle complex priority order', () => {
      cc.add({ key: 'base' }, 'defaults'); // index 0
      cc.add({ key: 'cli' }, 'cli'); // index 1
      cc.addEnv('test'); // index 2
      cc.add({ key: 'project' }, 'project'); // index 3
      cc.add({ key: 'user' }, 'user'); // index 4
      cc.add({ key: 'global' }, 'global'); // index 5

      // CLI should win
      expect(cc.get('key')).toBe('cli');
    });

    it('should search in correct order when CLI is empty', () => {
      cc.add({ key: 'base' }, 'defaults'); // index 0
      cc.add({}, 'cli'); // index 1 - empty
      cc.add({ key: 'env' }, 'env'); // index 2
      cc.add({ key: 'project' }, 'project'); // index 3

      // Should skip empty CLI and use env
      expect(cc.get('key')).toBe('env');
    });
  });

  describe('set', () => {
    it('should set value in specified source', () => {
      cc.add({ foo: 'bar' }, 'test');
      cc.set('foo', 'updated', 'test');
      expect(cc.get('foo', 'test')).toBe('updated');
    });

    it('should set value in CLI source by default', () => {
      cc.add({}, 'defaults');
      cc.add({}, 'cli');
      cc.set('foo', 'bar', 'cli');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should throw error if source does not exist', () => {
      expect(() => cc.set('foo', 'bar', 'newsource')).toThrow('not found newsource');
    });
  });

  describe('del', () => {
    it('should delete value from specified source', () => {
      cc.add({ foo: 'bar', baz: 'qux' }, 'test');
      cc.del('foo', 'test');
      expect(cc.get('foo', 'test')).toBeUndefined();
      expect(cc.get('baz', 'test')).toBe('qux');
    });

    it('should throw error if source does not exist', () => {
      expect(() => cc.del('foo', 'newsource')).toThrow('not found newsource');
    });

    it('should delete from all layers when no source specified', () => {
      cc.add({ foo: 'bar1', shared: 'value1' }, 'layer1');
      cc.add({ foo: 'bar2', shared: 'value2' }, 'layer2');
      cc.add({ foo: 'bar3', shared: 'value3' }, 'layer3');

      cc.del('foo');

      // foo should be deleted from all layers
      expect(cc.get('foo')).toBeUndefined();
      // shared should still exist (gets first non-deleted value based on priority)
      expect(cc.get('shared')).toBeDefined();
    });

    it('should handle deleting auth tokens (like Conf uses it)', () => {
      cc.add({ '//registry.npmjs.org/:_password': 'secret', '//registry.npmjs.org/:username': 'user' }, 'test');
      cc.del('//registry.npmjs.org/:_password', 'test');
      expect(cc.get('//registry.npmjs.org/:_password', 'test')).toBeUndefined();
      expect(cc.get('//registry.npmjs.org/:username', 'test')).toBe('user');
    });

    it('should return this for chaining', () => {
      cc.add({ foo: 'bar' }, 'test');
      const result = cc.del('foo', 'test');
      expect(result).toBe(cc);
    });
  });

  describe('snapshot', () => {
    it('should return empty object for empty config', () => {
      expect(cc.snapshot).toEqual({});
    });

    it('should merge all configurations correctly', () => {
      cc.add({ a: '1', b: '2' }, 'base');
      cc.add({ b: '3', c: '4' }, 'other');
      const snap = cc.snapshot;
      expect(snap.a).toBe('1');
      expect(snap.c).toBe('4');
    });

    it('should prioritize CLI in snapshot', () => {
      cc.add({ registry: 'base' }, 'defaults');
      cc.add({ registry: 'cli' }, 'cli');
      cc.add({ registry: 'env' }, 'env');
      expect(cc.snapshot.registry).toBe('cli');
    });

    it('should apply configs in correct order: base < global < user < project < env < CLI', () => {
      cc.add({ key: 'base' }, 'defaults');
      cc.add({ key: 'cli' }, 'cli');
      cc.add({ key: 'env' }, 'env');
      cc.add({ key: 'project' }, 'project');
      cc.add({ key: 'user' }, 'user');
      cc.add({ key: 'global' }, 'global');

      // CLI should be final value in snapshot
      expect(cc.snapshot.key).toBe('cli');
    });

    it('should merge multiple keys from different sources', () => {
      cc.add({ a: '1', b: '2' }, 'base');
      cc.add({ c: '3' }, 'cli');
      cc.add({ d: '4' }, 'env');

      const snap = cc.snapshot;
      expect(snap.a).toBe('1');
      expect(snap.b).toBe('2');
      expect(snap.c).toBe('3');
      expect(snap.d).toBe('4');
    });

    it('should not include __source__ marker in snapshot', () => {
      cc.add({ foo: 'bar' }, 'test');
      const snap = cc.snapshot;
      expect(snap.__source__).toBeUndefined();
      expect(snap.foo).toBe('bar'); // Regular data comes through
    });
  });

  describe('addEnv', () => {
    it('should add environment variables with prefix (like original cc.env)', () => {
      const env = {
        npm_config_registry: 'http://example.com',
        npm_config_foo_bar: 'value',
        OTHER_VAR: 'ignored',
      };

      cc.addEnv('npm_config_', env);
      expect(cc.get('registry')).toBe('http://example.com');
      expect(cc.get('foo_bar')).toBe('value'); // Note: underscores are NOT converted
      expect(cc.get('OTHER_VAR')).toBeUndefined();
    });

    it('should strip prefix from env var names', () => {
      const env = {
        npm_config_user_agent: 'test-agent',
      };

      cc.addEnv('npm_config_', env);
      expect(cc.get('user_agent')).toBe('test-agent'); // underscores remain
    });

    it('should match original library behavior from env.js test', () => {
      // Test case from original: cc.env('test_', { test_hello: true, ignore_this: 4, ignore_test_this_too: [] })
      const env = {
        test_hello: 'true',
        ignore_this: '4',
        ignore_test_this_too: '[]',
      };

      cc.addEnv('test_', env);
      expect(cc.get('hello')).toBe('true');
      expect(cc.get('ignore_this')).toBeUndefined();
    });

    it('should return this for chaining', () => {
      const result = cc.addEnv('test_', {});
      expect(result).toBe(cc);
    });
  });

  describe('addFile', () => {
    it('should add empty config if file does not exist (like ignore-unfound-file.js)', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      // Original test: cc(__dirname, 'non_existing_file') should not throw
      expect(() => cc.addFile('/path/to/nonexistent', 'ini', 'test')).not.toThrow();
      expect(cc.sources['test']).toBeDefined();
    });

    it('should parse INI file and add to config', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('registry=http://localhost:4873/\nfoo=bar');

      cc.addFile('/path/to/.npmrc', 'ini', 'project');
      expect(cc.get('registry')).toBe('http://localhost:4873/');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should parse JSON file', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('{"blaz":"json","json":true}');

      cc.addFile('/tmp/test.json', 'json', 'jsonfile');
      expect(cc.get('blaz')).toBe('json');
      expect(cc.get('json')).toBe(true);
    });

    it('should auto-detect JSON vs INI', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('{"test":true}');

      cc.addFile('/tmp/test', undefined, 'auto');
      expect(cc.get('test')).toBe(true);
    });

    it('should parse as INI when type is explicitly ini', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('test=value\nfoo=bar');

      cc.addFile('/tmp/test', 'ini', 'inifile');
      expect(cc.get('test')).toBe('value');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should fall back to INI when JSON parse fails during auto-detect', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('not-json=but-ini');

      cc.addFile('/tmp/test', undefined, 'auto');
      expect(cc.get('not-json')).toBe('but-ini');
    });

    it('should ignore INI section headers', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(`
[section]
key=value
foo=bar
`);

      cc.addFile('/path/to/.npmrc', 'ini', 'test');
      // Section headers are treated as comments/ignored
      // Keys are added at root level
      expect(cc.get('key')).toBe('value');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should handle comments and empty lines', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(`
# This is a comment
registry=http://localhost:4873/

; Another comment
foo=bar
`);

      cc.addFile('/path/to/.npmrc', 'ini', 'test');
      expect(cc.get('registry')).toBe('http://localhost:4873/');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should handle authentication tokens', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(`
//localhost:4873/:_auth=dGVzdDp0ZXN0
//localhost:4873/:always-auth=true
`);

      cc.addFile('/path/to/.npmrc', 'ini', 'test');
      expect(cc.get('//localhost:4873/:_auth')).toBe('dGVzdDp0ZXN0');
      expect(cc.get('//localhost:4873/:always-auth')).toBe(true); // Parsed as boolean
    });

    it('should handle quoted values', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(`
foo="quoted value"
bar='single quoted'
`);

      cc.addFile('/path/to/.npmrc', 'ini', 'test');
      expect(cc.get('foo')).toBe('quoted value');
      expect(cc.get('bar')).toBe('single quoted');
    });

    it('should trim whitespace from values', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('foo = bar ');

      cc.addFile('/path/to/.npmrc', 'ini', 'test');
      expect(cc.get('foo')).toBe('bar');
    });

    it('should handle nested objects (like original save.js test)', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('{"foo":{"bar":"baz"},"bloo":"jaus"}');

      cc.addFile('/tmp/test.json', 'json', 'test');
      expect(cc.get('foo')).toEqual({ bar: 'baz' });
      expect(cc.get('bloo')).toBe('jaus');
    });

    it('should return this for chaining', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const result = cc.addFile('/path/to/file', 'ini', 'test');
      expect(result).toBe(cc);
    });
  });

  describe('push', () => {
    it('should push config to end of list', () => {
      cc.add({ a: '1' }, 'first');
      const initialLength = cc.list.length;
      cc.push({ b: '2' });
      expect(cc.list.length).toBe(initialLength + 1);
      expect(cc.list[cc.list.length - 1]).toEqual({ b: '2' });
    });
  });

  describe('list property', () => {
    it('should expose internal list', () => {
      cc.add({ foo: 'bar' }, 'test');
      expect(cc.list.length).toBeGreaterThan(0);
    });

    it('should maintain list order', () => {
      cc.add({ a: '1' }, 'first');
      cc.add({ b: '2' }, 'second');
      cc.add({ c: '3' }, 'third');
      expect(cc.list.length).toBe(3);
    });
  });

  describe('sources property', () => {
    it('should track source information', () => {
      cc.add({ foo: 'bar' }, 'test-source');
      expect(cc.sources['test-source']).toBeDefined();
      expect(cc.sources['test-source'].data).toEqual({ foo: 'bar' });
    });

    it('should store multiple sources', () => {
      cc.add({ a: '1' }, 'source1');
      cc.add({ b: '2' }, 'source2');
      expect(Object.keys(cc.sources)).toContain('source1');
      expect(Object.keys(cc.sources)).toContain('source2');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      cc.add({ foo: null }, 'test');
      expect(cc.get('foo')).toBeNull();
    });

    it('should handle numeric values', () => {
      cc.add({ port: 8080 }, 'test');
      expect(cc.get('port')).toBe(8080);
    });

    it('should handle boolean values', () => {
      cc.add({ enabled: true, disabled: false }, 'test');
      expect(cc.get('enabled')).toBe(true);
      expect(cc.get('disabled')).toBe(false);
    });

    it('should handle nested objects', () => {
      cc.add({ parent: { child: 'value' } }, 'test');
      expect(cc.get('parent')).toEqual({ child: 'value' });
    });

    it('should handle empty string values', () => {
      cc.add({ empty: '' }, 'test');
      expect(cc.get('empty')).toBe('');
    });

    it('should not mutate original input data', () => {
      const original = { foo: 'bar', baz: 'qux' };
      const copy = { ...original };
      cc.add(original, 'test');
      expect(original).toEqual(copy);
    });
  });
});
