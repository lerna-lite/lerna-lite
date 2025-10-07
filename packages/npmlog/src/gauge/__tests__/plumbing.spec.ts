import stripAnsi from 'strip-ansi';
import c from 'tinyrainbow';
import { describe, expect, it, vi } from 'vitest';

import { Plumbing } from '../plumbing.js';

function normalizeAnsi(str: string) {
  if (c.isColorSupported) {
    return str;
  }
  return stripAnsi(str);
}

vi.mock('../render-template.js', () => ({
  default: (width: string, template: any, values: { x: any }) => {
    if (values.x) {
      // eslint-disable-next-line no-self-assign
      values.x = values.x;
    } // pull in from parent object for stringify
    return 'w:' + width + ', t:' + JSON.stringify(template) + ', v:' + JSON.stringify(values);
  },
}));

// Mock console control codes
vi.mock('../plumbing.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../plumbing.js')>();
  return {
    ...actual,
    Plumbing: class extends actual.Plumbing {
      hideCursor() {
        return 'HIDE';
      }

      showCursor() {
        return 'SHOW';
      }

      hide() {
        return 'CRERASE';
      }
    },
  };
});

const template = [{ type: 'name' }];
const theme = {};
const plumbing = new Plumbing(theme, template, 10);

describe('Plumbing static methods', () => {
  it('showCursor', () => {
    expect(plumbing.showCursor()).toBe('SHOW');
  });

  it('hideCursor', () => {
    expect(plumbing.hideCursor()).toBe('HIDE');
  });

  it('hide', () => {
    expect(plumbing.hide()).toBe('CRERASE');
  });

  it('show', () => {
    const output = plumbing.show({ name: 'test' });
    expect(output).toBe(normalizeAnsi('w:10, t:[{"type":"name"}], v:{"name":"test"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G'));
  });

  it('width', () => {
    const defaultWidth = new Plumbing(theme, template);
    const output = defaultWidth.show({ name: 'test' });
    expect(output).toBe(normalizeAnsi('w:80, t:[{"type":"name"}], v:{"name":"test"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G'));
  });

  it('setTheme', () => {
    plumbing.setTheme({ x: 'abc' });
    const output = plumbing.show({ name: 'test' });
    expect(output).toBe(normalizeAnsi('w:10, t:[{"type":"name"}], v:{"name":"test","x":"abc"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G'));
  });

  it('setTemplate', () => {
    plumbing.setTemplate([{ type: 'name' }, { type: 'x' }]);
    const output = plumbing.show({ name: 'test' });
    expect(output).toBe(normalizeAnsi('w:10, t:[{"type":"name"},{"type":"x"}], v:{"name":"test","x":"abc"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G'));
  });

  it('setWidth', () => {
    plumbing.setWidth(20);
    const output = plumbing.show({ name: 'test' });
    expect(output).toBe(normalizeAnsi('w:20, t:[{"type":"name"},{"type":"x"}], v:{"name":"test","x":"abc"}\x1b[0m\x1b[0m\x1b[2K\x1b[0G'));
  });
});
