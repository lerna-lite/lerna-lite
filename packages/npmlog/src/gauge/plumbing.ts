/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import validate from 'aproba';
import consoleControl from 'console-control-strings';

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
    return consoleControl.hideCursor();
  }

  showCursor() {
    return consoleControl.showCursor();
  }

  hide() {
    return consoleControl.gotoSOL() + consoleControl.eraseLine();
  }

  show(status) {
    const values: any = Object.create(this.theme);
    for (const key in status) {
      values[key] = status[key];
    }

    return (
      renderTemplate(this.width, this.template, values).trim() +
      consoleControl.color('reset') +
      consoleControl.eraseLine() +
      consoleControl.gotoSOL()
    );
  }
}
