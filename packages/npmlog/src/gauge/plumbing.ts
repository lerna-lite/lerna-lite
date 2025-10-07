/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import validate from 'aproba';
import c from 'tinyrainbow';

import renderTemplate from './render-template.js';

export class Plumbing {
  showing: boolean;
  template: any;
  theme: any;
  width: number;

  constructor(theme: any, template: any, width?: number) {
    if (!width) {
      width = 80;
    }
    validate('OAN', [theme, template, width]);
    this.showing = false;
    this.theme = theme;
    this.width = width;
    this.template = template;
  }
  setTheme(theme) {
    validate('O', [theme]);
    this.theme = theme;
  }

  setTemplate(template) {
    validate('A', [template]);
    this.template = template;
  }

  setWidth(width) {
    validate('N', [width]);
    this.width = width;
  }

  hideCursor() {
    // ANSI: Hide cursor
    return '\x1b[?25l';
  }

  showCursor() {
    // ANSI: Show cursor
    return '\x1b[?25h';
  }

  hide() {
    // ANSI: Move to SOL and erase line
    return '\x1b[0G\x1b[2K';
  }

  show(status) {
    const values: any = Object.create(this.theme);
    for (const key in status) {
      values[key] = status[key];
    }

    let out = renderTemplate(this.width, this.template, values).trim() + c.reset('');
    if (c.isColorSupported) {
      out += '\x1b[2K' + '\x1b[0G';
    }
    return out;
  }
}
