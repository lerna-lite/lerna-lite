import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { Conf } from '../conf.js';
import * as defaults from '../defaults.js';

describe('conf', () => {
  describe('loadPrefix()', () => {
    let cli: any;

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

    it('should use findPrefix when cli does not have prefix property', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'cli');
      conf.addEnv();

      const localPrefix = conf.loadPrefix();
      expect(localPrefix).toBeDefined();
      expect(typeof localPrefix).toBe('string');
    });

    it('should get globalPrefix when global flag is set', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({ global: true }, 'cli');
      conf.set('prefix', '/test/path', 'cli');
      conf.addEnv();
      conf.loadPrefix();

      // Access globalPrefix getter which calls pathResolve(this.get('prefix'))
      const globalPrefix = conf.globalPrefix;
      expect(globalPrefix).toBeDefined();
      expect(typeof globalPrefix).toBe('string');
    });
  });

  describe('loadCAFile()', () => {
    it('should load CA certificates from file', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'cli');
      const tempDir = mkdtempSync(join(tmpdir(), 'conf-test-'));
      const caFile = join(tempDir, 'ca.crt');

      const certContent = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKHHCgVZU3KgMA0GCSqGSIb3DQEBBAUAMA0xCzAJBgNVBAYTAlVT
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKHHCgVZU3KhMA0GCSqGSIb3DQEBBAUAMA0xCzAJBgNVBAYTAlVT
-----END CERTIFICATE-----`;

      writeFileSync(caFile, certContent, 'utf8');
      conf.loadCAFile(caFile);

      const ca = conf.get('ca');
      expect(ca).toBeInstanceOf(Array);
      expect(ca.length).toBe(2);
    });

    it('should return early if no file provided', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'cli');
      conf.loadCAFile('');
      expect(conf.get('ca')).toBeUndefined();
    });

    it('should return silently if file does not exist', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'cli');
      conf.loadCAFile('/nonexistent/path/ca.crt');
      expect(conf.get('ca')).toBeUndefined();
    });

    it('should throw error if file read fails with non-ENOENT error', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'cli');
      const tempDir = mkdtempSync(join(tmpdir(), 'conf-test-'));

      // Use a directory path which will cause an EISDIR error when trying to read as file
      expect(() => conf.loadCAFile(tempDir)).toThrow('EISDIR');
    });
  });

  describe('loadUser()', () => {
    it('should return early if global flag is set', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({ global: true }, 'cli');
      conf.loadUser();
      expect(conf.root.user).toBeUndefined();
    });

    it('should set user from SUDO_UID environment variable', () => {
      const conf = new Conf(Object.assign({}, defaults));
      const originalSudoUid = process.env.SUDO_UID;
      process.env.SUDO_UID = '1000';

      conf.loadUser();
      expect(conf.root.user).toBe(1000);

      if (originalSudoUid !== undefined) {
        process.env.SUDO_UID = originalSudoUid;
      } else {
        delete process.env.SUDO_UID;
      }
    });

    it('should set user from file stats when SUDO_UID not set', () => {
      const conf = new Conf(Object.assign({}, defaults));
      const originalSudoUid = process.env.SUDO_UID;
      delete process.env.SUDO_UID;

      // Create a temporary directory to get valid stats
      const tempDir = mkdtempSync(join(tmpdir(), 'conf-user-test-'));
      conf.add({}, 'cli');
      conf.set('prefix', tempDir, 'cli');

      conf.loadUser();

      // On Windows, uid might be 0 or undefined, but it should complete without error
      expect(conf.root.user).toBeDefined();

      if (originalSudoUid !== undefined) {
        process.env.SUDO_UID = originalSudoUid;
      }
    });

    it('should return silently when prefix does not exist', () => {
      const conf = new Conf(Object.assign({}, defaults));
      const originalSudoUid = process.env.SUDO_UID;
      delete process.env.SUDO_UID;

      conf.add({}, 'cli');
      conf.set('prefix', '/nonexistent/path', 'cli');

      conf.loadUser();
      expect(conf.root.user).toBeUndefined();

      if (originalSudoUid !== undefined) {
        process.env.SUDO_UID = originalSudoUid;
      }
    });
  });

  describe('getCredentialsByURI()', () => {
    it('should return credentials for a given URI with token', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.set('//registry.example.com/:_authToken', 'test-token', 'user');

      const creds = conf.getCredentialsByURI('https://registry.example.com/');
      expect(creds.token).toBe('test-token');
    });

    it('should return credentials with username and password', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      const encoded = Buffer.from('mypassword', 'utf8').toString('base64');
      conf.set('//registry.example.com/:username', 'myuser', 'user');
      conf.set('//registry.example.com/:_password', encoded, 'user');

      const creds = conf.getCredentialsByURI('https://registry.example.com/');
      expect(creds.username).toBe('myuser');
      expect(creds.password).toBe('mypassword');
      expect(creds.auth).toBeDefined();
    });

    it('should handle always-auth flag from nerfed URI', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.set('//registry.example.com/:always-auth', true, 'user');

      const creds = conf.getCredentialsByURI('https://registry.example.com/');
      expect(creds.alwaysAuth).toBe(true);
    });

    it('should fallback to global always-auth', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.set('always-auth', true, 'user');

      const creds = conf.getCredentialsByURI('https://registry.example.com/');
      expect(creds.alwaysAuth).toBe(true);
    });

    it('should handle email from nerfed URI', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.set('//registry.example.com/:email', 'test@example.com', 'user');

      const creds = conf.getCredentialsByURI('https://registry.example.com/');
      expect(creds.email).toBe('test@example.com');
    });

    it('should fallback to global email', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.set('email', 'global@example.com', 'user');

      const creds = conf.getCredentialsByURI('https://registry.example.com/');
      expect(creds.email).toBe('global@example.com');
    });

    it('should parse old-style _auth for default registry', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      const auth = Buffer.from('myuser:mypassword').toString('base64');
      conf.set('_auth', auth, 'user');

      const creds = conf.getCredentialsByURI('https://registry.npmjs.org/');
      expect(creds.username).toBe('myuser');
      expect(creds.password).toBe('mypassword');
    });

    it('should throw error if URI is not provided', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      expect(() => conf.getCredentialsByURI('')).toThrow('registry URL is required');
    });
  });

  describe('setCredentialsByURI()', () => {
    it('should set token credentials', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.setCredentialsByURI('https://registry.example.com/', { token: 'my-token' });

      expect(conf.get('//registry.example.com/:_authToken')).toBe('my-token');
    });

    it('should set username/password credentials', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.setCredentialsByURI('https://registry.example.com/', {
        username: 'myuser',
        password: 'mypassword',
        email: 'test@example.com',
      });

      expect(conf.get('//registry.example.com/:username')).toBe('myuser');
      expect(conf.get('//registry.example.com/:email')).toBe('test@example.com');
      const password = Buffer.from(conf.get('//registry.example.com/:_password'), 'base64').toString('utf8');
      expect(password).toBe('mypassword');
    });

    it('should set always-auth when provided', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.setCredentialsByURI('https://registry.example.com/', {
        username: 'myuser',
        password: 'mypassword',
        email: 'test@example.com',
        alwaysAuth: true,
      });

      expect(conf.get('//registry.example.com/:always-auth')).toBe(true);
    });

    it('should delete always-auth when not provided', () => {
      const conf = new Conf(Object.assign({}, defaults));
      conf.add({}, 'user');
      conf.set('registry', 'https://registry.npmjs.org/', 'user');
      conf.set('//registry.example.com/:always-auth', true, 'user');
      conf.setCredentialsByURI('https://registry.example.com/', {
        username: 'myuser',
        password: 'mypassword',
        email: 'test@example.com',
      });

      expect(conf.get('//registry.example.com/:always-auth')).toBeUndefined();
    });

    it('should throw error if URI is not provided', () => {
      const conf = new Conf(Object.assign({}, defaults));
      expect(() => conf.setCredentialsByURI('', { token: 'test' })).toThrow('registry URL is required');
    });

    it('should throw error if credentials are not provided', () => {
      const conf = new Conf(Object.assign({}, defaults));
      expect(() => conf.setCredentialsByURI('https://registry.example.com/', null)).toThrow('credentials are required');
    });

    it('should throw error if no credentials to set', () => {
      const conf = new Conf(Object.assign({}, defaults));
      expect(() => conf.setCredentialsByURI('https://registry.example.com/', {})).toThrow('No credentials to set.');
    });

    it('should throw error if username missing with password', () => {
      const conf = new Conf(Object.assign({}, defaults));
      expect(() =>
        conf.setCredentialsByURI('https://registry.example.com/', {
          password: 'mypassword',
          email: 'test@example.com',
        })
      ).toThrow('must include username');
    });

    it('should throw error if password missing with username', () => {
      const conf = new Conf(Object.assign({}, defaults));
      expect(() =>
        conf.setCredentialsByURI('https://registry.example.com/', {
          username: 'myuser',
          email: 'test@example.com',
        })
      ).toThrow('must include password');
    });

    it('should throw error if email missing with username and password', () => {
      const conf = new Conf(Object.assign({}, defaults));
      expect(() =>
        conf.setCredentialsByURI('https://registry.example.com/', {
          username: 'myuser',
          password: 'mypassword',
        })
      ).toThrow('must include email address');
    });
  });
});
