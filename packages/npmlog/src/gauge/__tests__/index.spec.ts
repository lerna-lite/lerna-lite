import { EventEmitter } from 'node:events';
import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { Gauge } from '../index.js';

class Sink extends Writable {
  isTTY: boolean = false;
  columns: number = 80;

  constructor() {
    super({});
  }

  // `_write` just acknowledges the chunk
  _write(_data: any, _enc: any, cb: () => void): void {
    cb();
  }
}

const results: any = new EventEmitter();
function MockPlumbing(theme: any, template: any, columns: any) {
  results.theme = theme;
  results.template = template;
  results.columns = columns;
  results.emit('new', theme, template, columns);
}
MockPlumbing.prototype = {};

function RecordCall(name: string) {
  return function () {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.prototype.slice.call(arguments);
    results.emit('called', [name, args]);
    results.emit('called:' + name, args);
    return '';
  };
}

['setTheme', 'setTemplate', 'setWidth', 'hide', 'show', 'hideCursor', 'showCursor'].forEach(function (fn) {
  MockPlumbing.prototype[fn] = RecordCall(fn);
});

describe('defaults', () => {
  it('default properties', () => {
    let gauge = new Gauge(process.stdout);
    expect(gauge._disabled).toBe(!process.stdout.isTTY);
    expect(gauge._updateInterval).toBe(50);
    if (process.stdout.isTTY) {
      expect(gauge._tty).toBe(process.stdout);
      gauge.disable();
      gauge = new Gauge(process.stderr);
      expect(gauge._tty).toBe(process.stdout);
    }
    gauge.disable();

    gauge = new (Gauge as any)(new Sink() as any);
    expect(gauge._tty).toBeUndefined();
    gauge.disable();
  });
});

describe('construct', () => {
  it('constructs with provided options', () => {
    const output = new Sink();
    output.isTTY = true;
    output.columns = 16;
    const gauge = new Gauge(output, {
      Plumbing: MockPlumbing,
      theme: ['THEME'],
      template: ['TEMPLATE'],
      enabled: false,
      updateInterval: 0,
      fixedFramerate: false,
    });
    expect(gauge).toBeTruthy();
    expect(results.columns).toBe(15);
    expect(results.theme).toEqual(['THEME']);
    expect(results.template).toEqual(['TEMPLATE']);
    expect(gauge.isEnabled()).toBe(false);
  });
});

describe('show & pulse: fixedframerate', () => {
  it('should show and pulse with fixed framerate', () =>
    new Promise((done: any) => {
      const testtimeout = setTimeout(() => {
        done();
      }, 1000);

      const output = new Sink();
      output.isTTY = true;
      output.columns = 16;
      const gauge = new Gauge(output, {
        Plumbing: MockPlumbing,
        updateInterval: 10,
        fixedFramerate: true,
      });
      gauge.show('NAME', 0.1);
      results.once('called:show', checkBasicShow);
      function checkBasicShow(args: any) {
        expect(args).toEqual([{ spun: 0, section: 'NAME', subsection: '', completed: 0.1 }]);

        gauge.show('S');
        gauge.pulse();
        results.once('called:show', checkPulse);
      }
      function checkPulse(args: any) {
        expect(args).toEqual([{ spun: 1, section: 'S', subsection: '', completed: 0.1 }]);

        gauge.pulse('P');
        results.once('called:show', checkPulseWithArg);
      }
      function checkPulseWithArg(args: any) {
        expect(args).toEqual([{ spun: 2, section: 'S', subsection: 'P', completed: 0.1 }]);

        gauge.disable();
        clearTimeout(testtimeout);
        done();
      }
    }));
});

describe('window resizing', () => {
  it('should handle window resizing', () =>
    new Promise((done: any) => {
      const testtimeout = setTimeout(() => {
        done();
      }, 1000);
      const output = new Sink();
      output.isTTY = true;
      output.columns = 32;

      const gauge = new Gauge(output, {
        Plumbing: MockPlumbing,
        updateInterval: 0,
        fixedFramerate: true,
      });
      gauge.show('NAME', 0.1);

      results.once('called:show', function (args: any) {
        expect(args).toEqual([{ section: 'NAME', subsection: '', completed: 0.1, spun: 0 }]);

        results.once('called:setWidth', lookForResize);

        output.columns = 16;
        output.emit('resize');
        gauge.show('NAME', 0.5);
      });

      function lookForResize(args: any) {
        expect(args).toEqual([15]);
        results.once('called:show', lookForShow);
      }
      function lookForShow(args: any) {
        expect(args).toEqual([{ section: 'NAME', subsection: '', completed: 0.5, spun: 0 }]);
        gauge.disable();
        clearTimeout(testtimeout);
        done();
      }
    }));
});

function collectResults(time: number | undefined, cb: { (got: any): void; (got: any): void; (arg0: any[]): void }) {
  const collected: any[] = [];
  function collect(called: any) {
    collected.push(called);
  }
  results.on('called', collect);
  setTimeout(() => {
    results.removeListener('called', collect);
    cb(collected);
  }, time);
}

describe('hideCursor:true', () => {
  it('should hide cursor when enabled', () =>
    new Promise((done: any) => {
      const output = new Sink();
      output.isTTY = true;
      output.columns = 16;
      const gauge = new Gauge(output, {
        Plumbing: MockPlumbing,
        theme: ['THEME'],
        template: ['TEMPLATE'],
        enabled: true,
        updateInterval: 90,
        fixedFramerate: true,
        hideCursor: true,
      });
      collectResults(100, andCursorHidden);
      gauge.show('NAME', 0.5);
      expect(gauge.isEnabled()).toBe(true);
      function andCursorHidden(got: any) {
        const expected = [
          ['hideCursor', []],
          ['show', [{ spun: 0, section: 'NAME', subsection: '', completed: 0.5 }]],
        ];
        expect(got).toEqual(expected);
        gauge.disable();
        done();
      }
    }));
});

describe('hideCursor:false', () => {
  it('should not hide cursor when disabled', () =>
    new Promise((done: any) => {
      const output = new Sink();
      output.isTTY = true;
      output.columns = 16;
      const gauge = new Gauge(output, {
        Plumbing: MockPlumbing,
        theme: ['THEME'],
        template: ['TEMPLATE'],
        enabled: true,
        updateInterval: 90,
        fixedFramerate: true,
        hideCursor: false,
      });
      collectResults(100, andCursorHidden);
      gauge.show('NAME', 0.5);
      function andCursorHidden(got: any) {
        const expected = [['show', [{ spun: 0, section: 'NAME', subsection: '', completed: 0.5 }]]];
        expect(got).toEqual(expected);
        gauge.disable();
        done();
      }
    }));
});
