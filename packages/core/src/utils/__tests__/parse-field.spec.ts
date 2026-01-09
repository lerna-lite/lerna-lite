import { describe, expect, it } from 'vitest';

import { parseField } from '../parse-field.js';

describe('parseField()', () => {
  it('should throw when failing to parse property from the JSON input', () => {
    const input = { name: 'test', version: '^1.0.0' };
    const inputJson = JSON.stringify(input);

    expect(() => parseField(`'${inputJson}'`, 'version')).toThrow(`Failed parsing JSON config key version: '${inputJson}'`);
  });

  it('should return True when input field is true', () => {
    const input = true;
    const output = parseField(input, 'version');

    expect(output).toBeTruthy();
  });

  it("should return True when input field is 'true'", () => {
    const input = 'true';
    const output = parseField(input, 'version');

    expect(output).toBeTruthy();
  });

  it('should return False when input field is false', () => {
    const input = false;
    const output = parseField(input, 'version');

    expect(output).toBeFalsy();
  });

  it("should return False when input field is 'false'", () => {
    const input = 'false';
    const output = parseField(input, 'version');

    expect(output).toBeFalsy();
  });

  it("should return Null when input field is 'null'", () => {
    const input = 'null';
    const output = parseField(input, 'version');

    expect(output).toBeNull();
  });

  it("should return Undefined when input field is 'undefined'", () => {
    const input = 'undefined';
    const output = parseField(input, 'version');

    expect(output).toBeUndefined();
  });

  it('should return number when key is found to be a Number in types.ts filed', () => {
    const input = '123';
    const output = parseField(input, 'searchlimit');

    expect(output).toBe(123);
  });

  it('should return true for empty string when field is boolean and not string type', () => {
    const input = '';
    const output = parseField(input, 'optional'); // optional is defined as Boolean in types

    expect(output).toBe(true);
  });

  it('should resolve home directory path on Windows when field starts with ~\\ and HOME is set', () => {
    const originalPlatform = process.platform;
    const originalHome = process.env.HOME;

    try {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });
      process.env.HOME = 'C:\\Users\\TestUser';

      const input = '~\\Documents\\config';
      const output = parseField(input, 'prefix'); // prefix is a path type

      expect(output).toContain('Documents');
      expect(output).toContain('config');
    } finally {
      // Restore original values
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
      if (originalHome !== undefined) {
        process.env.HOME = originalHome;
      } else {
        delete process.env.HOME;
      }
    }
  });
});
