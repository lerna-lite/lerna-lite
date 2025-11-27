/**
 * Adapted from https://github.com/npm/npmlog/blob/756bd05d01e7e4841fba25204d6b85dfcffeba3c/test/basic.js
 */
import { Stream, Writable } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';
import c from 'tinyrainbow';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import themes from '../gauge/themes.js';
import { log, Logger } from '../npmlog.js';

function normalizeAnsi(str: string) {
  if (c.isColorSupported) {
    return str;
  }
  return stripVTControlCharacters(str);
}

const result: any[] = [];
const logEvents: any[] = [];
const logInfoEvents: any[] = [];
const logPrefixEvents: any[] = [];

const resultExpect = [
  '\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[7msill\x1b[27m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35msilly prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[36mverb\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mverbose prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[32minfo\x1b[39m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35minfo prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[32mtiming\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mtiming prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[32mhttp\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mhttp prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[36mnotice\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mnotice prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[43m\x1b[30mWARN\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mwarn prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[31mERR!\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35merror prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[32minfo\x1b[39m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35minfo prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[32mtiming\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mtiming prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[32mhttp\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mhttp prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[36mnotice\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mnotice prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[43m\x1b[30mWARN\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35mwarn prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[31mERR!\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35merror prefix\x1b[39m\x1b[0m\x1b[0m x = {"foo":{"bar":"baz"}}\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[31mERR!\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35m404\x1b[39m\x1b[0m\x1b[0m This is a longer\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[31mERR!\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35m404\x1b[39m\x1b[0m\x1b[0m message, with some details\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[31mERR!\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35m404\x1b[39m\x1b[0m\x1b[0m and maybe a stack.\n',
  '\x1b[0m\x1b[0m\x1b[40m\x1b[37mnpm\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[40m\x1b[31mERR!\x1b[39m\x1b[49m\x1b[0m\x1b[0m \x1b[0m\x1b[0m\x1b[35m404\x1b[39m\x1b[0m\x1b[0m \n',
  '\x1b[0m\x1b[0m',
];

const logPrefixEventsExpect = [
  {
    id: 2,
    level: 'info',
    prefix: 'info prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 11,
    level: 'info',
    prefix: 'info prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 20,
    level: 'info',
    prefix: 'info prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
];

// should be the same.
const logInfoEventsExpect = logPrefixEventsExpect;

const logEventsExpect = [
  {
    id: 0,
    level: 'silly',
    prefix: 'silly prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 1,
    level: 'verbose',
    prefix: 'verbose prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 2,
    level: 'info',
    prefix: 'info prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 3,
    level: 'timing',
    prefix: 'timing prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 4,
    level: 'http',
    prefix: 'http prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 5,
    level: 'notice',
    prefix: 'notice prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 6,
    level: 'warn',
    prefix: 'warn prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 7,
    level: 'error',
    prefix: 'error prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 8,
    level: 'silent',
    prefix: 'silent prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 9,
    level: 'silly',
    prefix: 'silly prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 10,
    level: 'verbose',
    prefix: 'verbose prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 11,
    level: 'info',
    prefix: 'info prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 12,
    level: 'timing',
    prefix: 'timing prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 13,
    level: 'http',
    prefix: 'http prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 14,
    level: 'notice',
    prefix: 'notice prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 15,
    level: 'warn',
    prefix: 'warn prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 16,
    level: 'error',
    prefix: 'error prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 17,
    level: 'silent',
    prefix: 'silent prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 18,
    level: 'silly',
    prefix: 'silly prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 19,
    level: 'verbose',
    prefix: 'verbose prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 20,
    level: 'info',
    prefix: 'info prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 21,
    level: 'timing',
    prefix: 'timing prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 22,
    level: 'http',
    prefix: 'http prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 23,
    level: 'notice',
    prefix: 'notice prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 24,
    level: 'warn',
    prefix: 'warn prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 25,
    level: 'error',
    prefix: 'error prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 26,
    level: 'silent',
    prefix: 'silent prefix',
    message: 'x = {"foo":{"bar":"baz"}}',
    messageRaw: ['x = %j', { foo: { bar: 'baz' } }],
  },
  {
    id: 27,
    level: 'error',
    prefix: '404',
    message: 'This is a longer\nmessage, with some details\nand maybe a stack.\n',
    messageRaw: ['This is a longer\nmessage, with some details\nand maybe a stack.\n'],
  },
];

const s: any = new Stream();
s.write = function (m: any) {
  result.push(m);
};

s.writable = true;
s.isTTY = true;
s.end = function () {};

log.stream = s;

log.heading = 'npm';

describe('Basic Tests', () => {
  test('Basic log test', () => {
    expect(log.stream).toBe(s);

    log.on('log', logEvents.push.bind(logEvents));
    log.on('log.info', logInfoEvents.push.bind(logInfoEvents));
    log.on('info prefix', logPrefixEvents.push.bind(logPrefixEvents));

    log.level = 'silly';
    log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.verbose('verbose prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.info('info prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.timing('timing prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.http('http prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.notice('notice prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.warn('warn prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.error('error prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.silent('silent prefix', 'x = %j', { foo: { bar: 'baz' } });

    log.level = 'silent';
    log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.verbose('verbose prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.info('info prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.timing('timing prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.http('http prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.notice('notice prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.warn('warn prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.error('error prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.silent('silent prefix', 'x = %j', { foo: { bar: 'baz' } });

    log.level = 'info';
    log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.verbose('verbose prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.info('info prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.timing('timing prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.http('http prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.notice('notice prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.warn('warn prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.error('error prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.silent('silent prefix', 'x = %j', { foo: { bar: 'baz' } });
    log.error('404', 'This is a longer\n' + 'message, with some details\n' + 'and maybe a stack.\n');

    expect(result.join('').trim()).toBe(
      resultExpect
        .map((r) => normalizeAnsi(r))
        .join('')
        .trim()
    );
    expect(log.record).toEqual(logEventsExpect);
    expect(logEvents).toEqual(logEventsExpect);
    expect(logInfoEvents).toEqual(logInfoEventsExpect);
    expect(logPrefixEvents).toEqual(logPrefixEventsExpect);
  });

  describe('Util Functions', () => {
    let log: Logger;

    beforeEach(() => {
      log = new Logger();
    });

    afterEach(() => {
      log.resume();
      log.gauge.enable();
    });

    test('enableColor', () => {
      log.enableColor();
      expect(log.useColor()).toBe(true);
      expect(log.gauge._theme).toHaveProperty('hasColor', true);
      log.disableColor();
    });

    test('disableColor', () => {
      log.disableColor();
      expect(log.useColor()).toBe(false);
      expect(log.gauge._theme).toHaveProperty('hasColor', false);
    });

    test('enableUnicode', () => {
      log.enableUnicode();
      expect(log.gauge._theme).toHaveProperty('hasUnicode', true);
      log.disableUnicode();
    });

    test('disableUnicode', () => {
      log.disableUnicode();
      expect(log.gauge._theme).toHaveProperty('hasUnicode', false);
    });

    test('themes', () => {
      const _themes = log.gauge._themes;
      const newThemes = themes.newThemeSet();
      log.setGaugeThemeset(newThemes);
      expect(log.gauge._themes).toEqual(newThemes);
      log.setGaugeThemeset(_themes);
    });

    test('template', () => {
      const _template = log.gauge._gauge.template;
      const template = [{ type: 'progressbar', length: 100 }];
      log.setGaugeTemplate(template);
      expect(log.gauge._gauge.template).toEqual(template);
      log.gauge._gauge.template = _template;
    });

    test('disableProgress and expect gauge/progress to be enabled', () => {
      log.disableProgress();
      expect(log.gauge.isEnabled()).toBe(false);
      expect(log.progressEnabled).toBe(false);

      log.enableProgress();

      expect(log.gauge.isEnabled()).toBe(true);
      expect(log.progressEnabled).toBe(true);

      log.disableProgress();
    });

    test('enableProgress while paused', () => {
      log.disableProgress();
      log.pause();
      log.enableProgress();
      expect(log.gauge.isEnabled()).toBe(false);
    });

    test('disableProgress and expect gauge/progress to be disabled', () => {
      log.enableProgress();
      expect(log.gauge.isEnabled()).toBe(true);
      expect(log.progressEnabled).toBe(true);

      log.disableProgress();

      expect(log.gauge.isEnabled()).toBe(false);
      expect(log.progressEnabled).toBe(false);
    });

    test('clearProgress and expect gauge to be hidden', () => {
      const spy = vi.spyOn(log.gauge, 'hide');

      log.enableProgress();
      expect(log.gauge.isEnabled()).toBe(true);
      expect(log.progressEnabled).toBe(true);

      log.clearProgress();
      expect(spy).toHaveBeenCalled();
    });

    test('pause while progressEnabled', () => {
      const spy = vi.spyOn(log.gauge, 'disable');

      log.enableProgress();
      log.pause();

      expect(log.gauge.isEnabled()).toBe(false);
      expect(spy).toHaveBeenCalled();

      log.resume();
    });

    test('resume while progressEnabled', () => {
      const spy = vi.spyOn(log.gauge, 'enable');

      log.enableProgress();
      log.pause();
      log.resume();

      expect(spy).toHaveBeenCalled();
    });

    test('showProgress and expect gauge to show progress', () => {
      const spy = vi.spyOn(log.gauge, 'show');

      log.enableProgress();
      expect(log.gauge.isEnabled()).toBe(true);
      expect(log.progressEnabled).toBe(true);
      log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });

      log.showProgress();
      expect(spy).toHaveBeenCalled();
    });

    test('_buffer while paused', () => {
      log.pause();
      log.log('verbose', 'test', 'test log');
      expect((log as any)._buffer.length).toBe(1);
      log.resume();
      expect((log as any)._buffer.length).toBe(0);
    });
  });

  describe('log.log', () => {
    test('emits error on bad loglevel', () =>
      new Promise((done: any) => {
        log.once('error', (err: { message: any }) => {
          expect(err.message).toMatch(/Undefined log level: "asdf"/);
          done();
        });
        log.log('asdf', 'bad loglevel');
      }));

    test('resolves stack traces to a plain string', () =>
      new Promise((done: any) => {
        log.once('log', (m: { message: any }) => {
          expect(m.message).toMatch('Error: with a stack trace');
          done();
        });
        const err = new Error('with a stack trace');
        log.log('verbose', 'oops', err);
      }));

    test('max record size', () => {
      const mrs = log.maxRecordSize;
      log.maxRecordSize = 3;
      log.log('verbose', 'test', 'log 1');
      log.log('verbose', 'test', 'log 2');
      log.log('verbose', 'test', 'log 3');
      log.log('verbose', 'test', 'log 4');
      expect(log.record.length).toBe(3);
      log.maxRecordSize = mrs;
    });
  });

  describe('write with no stream', () => {
    const gauge = log.gauge;

    afterAll(() => {
      log.gauge = gauge;
      log.stream = s;
    });

    test('should not throw', () => {
      log.gauge = null as any;
      log.stream = null;
      expect(() => log.write('message')).not.toThrow();
    });
  });

  describe('emitLog to nonexistant level', () => {
    afterEach(() => {
      log.stream = s;
    });

    test('should not throw', () => {
      const badStream = new Writable();
      badStream.on('data', () => {
        throw new Error('should not have gotten data!');
      });
      expect(() => log.emitLog({ prefix: 'test', level: 'asdf' })).not.toThrow();
    });
  });

  describe('_format with nonexistant stream', () => {
    const gauge = log.gauge;

    afterAll(() => {
      log.gauge = gauge;
      log.stream = s;
    });

    test('should return undefined', () => {
      log.gauge = null as any;
      log.stream = null;
      expect(log._format('message')).toBeUndefined();
    });
  });

  describe('_format', () => {
    afterAll(() => {
      log.disableColor();
    });

    test('nonexistant stream', () => {
      const gauge = log.gauge;

      log.gauge = null as any;
      log.stream = null;
      expect(log._format('message')).toBeUndefined();

      // Restore the original gauge and stream
      log.gauge = gauge;
      log.stream = s;
    });

    test('no style', () => {
      const o = log._format('test message');
      expect(o).toBe(normalizeAnsi('test message\x1b[0m\x1b[0m')); // text + reset
    });

    test('fg', () => {
      log.enableColor();
      const o = log._format('test message', { bg: 'blue' });
      expect(o).toMatch(normalizeAnsi('\u001b[44mtest message\u001b[49m\u001b[0m'));
    });

    test('bg', () => {
      log.enableColor();
      const o = log._format('test message', { bg: 'white' });
      expect(o).toMatch(normalizeAnsi('\u001b[47mtest message\u001b[49m\u001b[0m'));
    });

    test('bold', () => {
      log.enableColor();
      const o = log._format('test message', { bold: true });
      expect(o).toMatch(normalizeAnsi('\u001b[1mtest message\u001b[22m\u001b[0m'));
    });

    test('underline', () => {
      log.enableColor();
      const o = log._format('test message', { underline: true });
      expect(o).toMatch(normalizeAnsi('\u001b[4mtest message\u001b[24m\u001b[0m'));
    });

    test('inverse', () => {
      log.enableColor();
      const o = log._format('test message', { inverse: true });
      expect(o).toMatch(normalizeAnsi('\u001b[7mtest message\u001b[27m\u001b[0m'));
    });
  });
});
