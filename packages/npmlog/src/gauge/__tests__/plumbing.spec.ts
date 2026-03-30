import { stripVTControlCharacters } from 'node:util';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { isColorSupported } from '../is-color-supported.js';
import { Plumbing } from '../plumbing.js';

function normalizeAnsi(str: string) {
  if (isColorSupported()) {
    return str;
  }
  return stripVTControlCharacters(str);
}

vi.mock('../render-template.js', () => ({
  default: (width: string, template: any, values: { x: any }) => {
    if (values.x) {
      // oxlint-disable-next-line no-self-assign
      values.x = values.x;
    } // pull in from parent object for stringify
    return 'w:' + width + ', t:' + JSON.stringify(template) + ', v:' + JSON.stringify(values);
  },
}));

const template = [{ type: 'name' }];
const theme = {};
const plumbing = new Plumbing(theme, template, 10);

describe('Plumbing static methods', () => {
  let originalForceColor: string | undefined;

  beforeAll(() => {
    // Force color output for all tests in this file
    originalForceColor = process.env.FORCE_COLOR;
    process.env.FORCE_COLOR = '1';
  });

  afterAll(() => {
    // Restore FORCE_COLOR to its original value
    if (originalForceColor === undefined) {
      delete process.env.FORCE_COLOR;
    } else {
      process.env.FORCE_COLOR = originalForceColor;
    }
  });
  it('showCursor', () => {
    const expected = '\x1b[?25h';
    expect(plumbing.showCursor()).toBe(expected);
  });

  it('hideCursor', () => {
    const expected = '\x1b[?25l';
    expect(plumbing.hideCursor()).toBe(expected);
  });

  it('hide', () => {
    const expected = '\x1b[0G\x1b[2K';
    expect(plumbing.hide()).toBe(expected);
  });

  it('show', () => {
    const output = plumbing.show({ name: 'test' });
    const result = normalizeAnsi('w:10, t:[{"type":"name"}], v:{"name":"test"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G');
    expect(output).toEqual(result);
  });

  it('width', () => {
    const defaultWidth = new Plumbing(theme, template);
    const output = defaultWidth.show({ name: 'test' });
    const result = normalizeAnsi('w:80, t:[{"type":"name"}], v:{"name":"test"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G');
    expect(output).toEqual(result);
  });

  it('setTheme', () => {
    plumbing.setTheme({ x: 'abc' });
    const output = plumbing.show({ name: 'test' });
    const result = normalizeAnsi('w:10, t:[{"type":"name"}], v:{"name":"test","x":"abc"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G');
    expect(output).toEqual(result);
  });

  it('setTemplate', () => {
    plumbing.setTemplate([{ type: 'name' }, { type: 'x' }]);
    const output = plumbing.show({ name: 'test' });
    const result = normalizeAnsi('w:10, t:[{"type":"name"},{"type":"x"}], v:{"name":"test","x":"abc"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G');
    expect(output).toEqual(result);
  });

  it('setWidth', () => {
    plumbing.setWidth(20);
    const output = plumbing.show({ name: 'test' });
    const result = normalizeAnsi('w:20, t:[{"type":"name"},{"type":"x"}], v:{"name":"test","x":"abc"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G');
    expect(output).toEqual(result);
  });
});
