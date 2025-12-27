import { describe, expect, it } from 'vitest';

import error, { Internal, MissingTemplateValue } from '../error.js';

describe('User', () => {
  it('isa Error', () => {
    const msg = 'example';
    const user: any = error.User(msg);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe('EGAUGE');
    expect(user.message).toBe(msg);
  });
});

describe('MissingTemplateValue', () => {
  it('isa Error from default export', () => {
    const item = { type: 'abc' };
    const values = { abc: 'def', ghi: 'jkl' };
    const user = error.MissingTemplateValue(item, values);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe('EGAUGE');
    expect(user.message).toMatch(new RegExp(item.type));
    expect(user.template).toEqual(item);
    expect(user.values).toEqual(values);
  });

  it('isa Error', () => {
    const item = { type: 'abc' };
    const values = { abc: 'def', ghi: 'jkl' };
    const user = MissingTemplateValue(item, values);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe('EGAUGE');
    expect(user.message).toMatch(new RegExp(item.type));
    expect(user.template).toEqual(item);
    expect(user.values).toEqual(values);
  });
});

describe('Internal', () => {
  it('isa Error from default export', () => {
    const msg = 'example';
    const user = error.Internal(msg);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe('EGAUGEINTERNAL');
    expect(user.message).toBe(msg);
  });

  it('isa Error', () => {
    const msg = 'example';
    const user = Internal(msg);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe('EGAUGEINTERNAL');
    expect(user.message).toBe(msg);
  });
});