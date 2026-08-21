import { afterEach, describe, expect, it } from 'vitest';

import { applyExtends } from '../lib/apply-extends.js';

describe('applyExtends', () => {
  afterEach(() => {
    delete (Object.prototype as any).polluted;
    delete (Object as any).polluted;
    delete (Object.prototype.toString as any).polluted;
  });

  it('merges ordinary nested configuration', () => {
    const result = applyExtends({ command: { version: { yes: true } } }, process.cwd());

    expect(result).toEqual({ command: { version: { yes: true } } });
  });

  it('stores __proto__ as an ordinary own property without polluting Object.prototype', () => {
    const input = JSON.parse('{"__proto__":{"polluted":true}}');

    const result = applyExtends(input, process.cwd());

    expect((Object.prototype as any).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({ polluted: true });
  });

  it('stores constructor as an ordinary own property without modifying Object', () => {
    const input = JSON.parse('{"constructor":{"polluted":true}}');

    const result = applyExtends(input, process.cwd());

    expect((Object as any).polluted).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(result, 'constructor')?.value).toEqual({ polluted: true });
  });

  it('stores toString as an ordinary own property without modifying the built-in function', () => {
    const input = JSON.parse('{"toString":{"polluted":true}}');

    const result = applyExtends(input, process.cwd());

    expect((Object.prototype.toString as any).polluted).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(result, 'toString')?.value).toEqual({ polluted: true });
  });
});
