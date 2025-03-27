/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

import stringWidth from 'string-width';

function isPercent(num) {
  if (typeof num !== 'string') {
    return false;
  }
  return num.at(-1) === '%';
}

function percent(num) {
  return Number(num.slice(0, -1)) / 100;
}

export class TemplateItem {
  overallOutputLength: number;
  finished: boolean;
  type: any = null;
  value: any = null;
  length: any = null;
  maxLength: any = null;
  minLength: any = null;
  kerning: any = null;
  align = 'left';
  padLeft = 0;
  padRight = 0;
  index: any = null;
  first: any = null;
  last: any = null;

  constructor(values: any, outputLength: number) {
    this.overallOutputLength = outputLength;
    this.finished = false;
    this.type = null;
    this.value = null;
    this.length = null;
    this.maxLength = null;
    this.minLength = null;
    this.kerning = null;
    this.align = 'left';
    this.padLeft = 0;
    this.padRight = 0;
    this.index = null;
    this.first = null;
    this.last = null;
    if (typeof values === 'string') {
      this.value = values;
    } else {
      for (const prop in values) {
        this[prop] = values[prop];
      }
    }
    // Realize percents
    if (isPercent(this.length)) {
      this.length = Math.round(this.overallOutputLength * percent(this.length));
    }
    if (isPercent(this.minLength)) {
      this.minLength = Math.round(this.overallOutputLength * percent(this.minLength));
    }
    if (isPercent(this.maxLength)) {
      this.maxLength = Math.round(this.overallOutputLength * percent(this.maxLength));
    }
    return this;
  }

  getBaseLength() {
    let length = this.length;
    if (length == null && typeof this.value === 'string' && this.maxLength == null && this.minLength == null) {
      length = stringWidth(this.value);
    }
    return length;
  }

  getLength() {
    const length = this.getBaseLength();
    if (length == null) {
      return null;
    }
    return length + this.padLeft + this.padRight;
  }

  getMaxLength() {
    if (this.maxLength == null) {
      return null;
    }
    return this.maxLength + this.padLeft + this.padRight;
  }

  getMinLength() {
    if (this.minLength == null) {
      return null;
    }
    return this.minLength + this.padLeft + this.padRight;
  }
}
