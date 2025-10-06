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
    // Note: tinyrainbow doesn't have direct console control methods
    // You might need to use process.stdout.write or a separate library for cursor control
    return '\x1B[?25l';
  }

  showCursor() {
    // Corresponding show cursor ANSI escape code
    return '\x1B[?25h';
  }

  hide() {
    // Go to start of line and erase line
    return '\x1B[G\x1B[K';
  }

  show(status) {
    const values: any = Object.create(this.theme);
    for (const key in status) {
      values[key] = status[key];
    }

    return (
      renderTemplate(this.width, this.template, values).trim() +
      c.reset() +
      '\x1B[K' + // Erase line (equivalent to consoleControl.eraseLine())
      '\x1B[G' // Go to start of line (equivalent to consoleControl.gotoSOL())
    );
  }
}
