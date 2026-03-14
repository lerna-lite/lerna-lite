import { afterEach, describe, expect, it } from 'vitest';

import byteSize from '../byte-size.js';

describe('byteSize', () => {
  afterEach(() => {
    byteSize.defaultOptions({});
  });

  describe('metric', () => {
    it('10 bytes', () => {
      const result = byteSize(10);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('B');
    });

    it('1000 bytes', () => {
      const result = byteSize(1000);
      expect(result.value).toBe('1');
      expect(result.unit).toBe('kB');
    });

    it('-1000 bytes', () => {
      const result = byteSize(-1000);
      expect(result.value).toBe('-1');
      expect(result.unit).toBe('kB');
    });

    it('10000 bytes', () => {
      const result = byteSize(10000);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('kB');
    });

    it('megabytes', () => {
      const result = byteSize(34560000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('MB');
    });

    it('gigabytes', () => {
      const result = byteSize(34560000000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('GB');
    });

    it('terabytes', () => {
      const result = byteSize(34560000000000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('TB');
    });

    it('petabytes', () => {
      const result = byteSize(34560000000000000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('PB');
    });

    it('exabytes', () => {
      const result = byteSize(34560000000000000000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('EB');
    });

    it('zettabytes', () => {
      const result = byteSize(34560000000000000000000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('ZB');
    });

    it('yottabytes', () => {
      const result = byteSize(34560000000000000000000000);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('YB');
    });

    it('overflow', () => {
      const result = byteSize(34560000000000000000000000000);
      expect(result.value).toBe('3.456e+28');
      expect(result.unit).toBe('');
    });

    it('negative overflow', () => {
      const result = byteSize(-34560000000000000000000000000);
      expect(result.value).toBe('-3.456e+28');
      expect(result.unit).toBe('');
    });
  });

  describe('metric_octet', () => {
    const opts = { units: 'metric_octet' as const };

    it('10 bytes', () => {
      const result = byteSize(10, opts);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('o');
    });

    it('1000 bytes', () => {
      const result = byteSize(1000, opts);
      expect(result.value).toBe('1');
      expect(result.unit).toBe('ko');
    });

    it('-1000 bytes', () => {
      const result = byteSize(-1000, opts);
      expect(result.value).toBe('-1');
      expect(result.unit).toBe('ko');
    });

    it('10000 bytes', () => {
      const result = byteSize(10000, opts);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('ko');
    });

    it('megaoctets', () => {
      const result = byteSize(34560000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('Mo');
    });

    it('gigaoctets', () => {
      const result = byteSize(34560000000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('Go');
    });

    it('teraoctets', () => {
      const result = byteSize(34560000000000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('To');
    });

    it('petaoctets', () => {
      const result = byteSize(34560000000000000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('Po');
    });

    it('exaoctets', () => {
      const result = byteSize(34560000000000000000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('Eo');
    });

    it('zettaoctets', () => {
      const result = byteSize(34560000000000000000000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('Zo');
    });

    it('yottaoctets', () => {
      const result = byteSize(34560000000000000000000000, opts);
      expect(result.value).toBe('34.6');
      expect(result.unit).toBe('Yo');
    });

    it('overflow', () => {
      const result = byteSize(34560000000000000000000000000, opts);
      expect(result.value).toBe('3.456e+28');
      expect(result.unit).toBe('');
    });

    it('negative overflow', () => {
      const result = byteSize(-34560000000000000000000000000, opts);
      expect(result.value).toBe('-3.456e+28');
      expect(result.unit).toBe('');
    });
  });

  describe('iec', () => {
    const opts = { units: 'iec' as const };

    it('10 bytes', () => {
      const result = byteSize(10, opts);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('B');
    });

    it('1000 bytes', () => {
      const result = byteSize(1000, opts);
      expect(result.value).toBe('1,000');
      expect(result.unit).toBe('B');
    });

    it('-1000 bytes', () => {
      const result = byteSize(-1000, opts);
      expect(result.value).toBe('-1,000');
      expect(result.unit).toBe('B');
    });

    it('10000 bytes', () => {
      const result = byteSize(10000, opts);
      expect(result.value).toBe('9.8');
      expect(result.unit).toBe('KiB');
    });

    it('mebibytes', () => {
      const result = byteSize(34560000, opts);
      expect(result.value).toBe('33');
      expect(result.unit).toBe('MiB');
    });

    it('gibibytes', () => {
      const result = byteSize(34560000000, opts);
      expect(result.value).toBe('32.2');
      expect(result.unit).toBe('GiB');
    });

    it('tebibytes', () => {
      const result = byteSize(34560000000000, opts);
      expect(result.value).toBe('31.4');
      expect(result.unit).toBe('TiB');
    });

    it('pebibytes', () => {
      const result = byteSize(34560000000000000, opts);
      expect(result.value).toBe('30.7');
      expect(result.unit).toBe('PiB');
    });

    it('exbibytes', () => {
      const result = byteSize(34560000000000000000, opts);
      expect(result.value).toBe('30');
      expect(result.unit).toBe('EiB');
    });

    it('zebibytes', () => {
      const result = byteSize(34560000000000000000000, opts);
      expect(result.value).toBe('29.3');
      expect(result.unit).toBe('ZiB');
    });

    it('yobibytes', () => {
      const result = byteSize(34560000000000000000000000, opts);
      expect(result.value).toBe('28.6');
      expect(result.unit).toBe('YiB');
    });

    it('overflow', () => {
      const result = byteSize(34560000000000000000000000000, opts);
      expect(result.value).toBe('3.456e+28');
      expect(result.unit).toBe('');
    });

    it('negative overflow', () => {
      const result = byteSize(-34560000000000000000000000000, opts);
      expect(result.value).toBe('-3.456e+28');
      expect(result.unit).toBe('');
    });
  });

  describe('iec_octet', () => {
    const opts = { units: 'iec_octet' as const };

    it('10 bytes', () => {
      const result = byteSize(10, opts);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('o');
    });

    it('1000 bytes', () => {
      const result = byteSize(1000, opts);
      expect(result.value).toBe('1,000');
      expect(result.unit).toBe('o');
    });

    it('-1000 bytes', () => {
      const result = byteSize(-1000, opts);
      expect(result.value).toBe('-1,000');
      expect(result.unit).toBe('o');
    });

    it('10000 bytes', () => {
      const result = byteSize(10000, opts);
      expect(result.value).toBe('9.8');
      expect(result.unit).toBe('Kio');
    });

    it('mebioctets', () => {
      const result = byteSize(34560000, opts);
      expect(result.value).toBe('33');
      expect(result.unit).toBe('Mio');
    });

    it('gibioctets', () => {
      const result = byteSize(34560000000, opts);
      expect(result.value).toBe('32.2');
      expect(result.unit).toBe('Gio');
    });

    it('tebioctets', () => {
      const result = byteSize(34560000000000, opts);
      expect(result.value).toBe('31.4');
      expect(result.unit).toBe('Tio');
    });

    it('pebioctets', () => {
      const result = byteSize(34560000000000000, opts);
      expect(result.value).toBe('30.7');
      expect(result.unit).toBe('Pio');
    });

    it('exbioctets', () => {
      const result = byteSize(34560000000000000000, opts);
      expect(result.value).toBe('30');
      expect(result.unit).toBe('Eio');
    });

    it('zebioctets', () => {
      const result = byteSize(34560000000000000000000, opts);
      expect(result.value).toBe('29.3');
      expect(result.unit).toBe('Zio');
    });

    it('yobioctets', () => {
      const result = byteSize(34560000000000000000000000, opts);
      expect(result.value).toBe('28.6');
      expect(result.unit).toBe('Yio');
    });

    it('overflow', () => {
      const result = byteSize(34560000000000000000000000000, opts);
      expect(result.value).toBe('3.456e+28');
      expect(result.unit).toBe('');
    });

    it('negative overflow', () => {
      const result = byteSize(-34560000000000000000000000000, opts);
      expect(result.value).toBe('-3.456e+28');
      expect(result.unit).toBe('');
    });
  });

  describe('precision', () => {
    it('10 bytes default precision', () => {
      const result = byteSize(10);
      expect(result.value).toBe('10');
      expect(result.unit).toBe('B');
    });

    it('10 bytes precision 0', () => {
      const result = byteSize(10, { precision: 0 });
      expect(result.value).toBe('10');
      expect(result.unit).toBe('B');
    });

    it('10 bytes precision 1', () => {
      const result = byteSize(10, { precision: 1 });
      expect(result.value).toBe('10');
      expect(result.unit).toBe('B');
    });

    it('1500 bytes precision 0', () => {
      const result = byteSize(1500, { precision: 0 });
      expect(result.value).toBe('2');
      expect(result.unit).toBe('kB');
    });

    it('1500 bytes precision 2', () => {
      const result = byteSize(1500, { precision: 2 });
      expect(result.value).toBe('1.5');
      expect(result.unit).toBe('kB');
    });

    it('-1500 bytes precision 2', () => {
      const result = byteSize(-1500, { precision: 2 });
      expect(result.value).toBe('-1.5');
      expect(result.unit).toBe('kB');
    });

    it('1500000 bytes precision 5', () => {
      const result = byteSize(1500000, { precision: 5 });
      expect(result.value).toBe('1.5');
      expect(result.unit).toBe('MB');
    });
  });

  describe('toString', () => {
    it('1000 bytes', () => {
      expect(byteSize(1000).toString()).toBe('1 kB');
    });

    it('-1000 bytes', () => {
      expect(byteSize(-1000).toString()).toBe('-1 kB');
    });
  });

  describe('custom units', () => {
    const customUnits = {
      simple: [
        { from: 0, to: 1e3, unit: '', long: '' },
        { from: 1e3, to: 1e6, unit: 'K', long: 'thousand' },
        { from: 1e6, to: 1e9, unit: 'Mn', long: 'million' },
        { from: 1e9, to: 1e12, unit: 'Bn', long: 'billion' },
      ],
    };

    it('100 with custom units', () => {
      const result = byteSize(100, { units: 'simple', customUnits });
      expect(result.value).toBe('100');
      expect(result.unit).toBe('');
    });

    it('10000 with custom units', () => {
      const result = byteSize(10000, { units: 'simple', customUnits });
      expect(result.value).toBe('10');
      expect(result.unit).toBe('K');
    });

    it('100 with custom units but default metric', () => {
      const result = byteSize(100, { customUnits });
      expect(result.value).toBe('100');
      expect(result.unit).toBe('B');
    });
  });

  describe('invalid units', () => {
    it('throws on invalid units', () => {
      expect(() => byteSize(1000, { units: 'invalid' })).toThrow(/invalid units/i);
    });
  });

  describe('toStringFn', () => {
    it('custom toString function', () => {
      const result = byteSize(1000, {
        toStringFn() {
          return 'test';
        },
      });
      expect(result.toString()).toBe('test');
    });
  });

  describe('defaultOptions', () => {
    it('sets default options', () => {
      byteSize.defaultOptions({ units: 'iec' });
      const result = byteSize(10000);
      expect(result.value).toBe('9.8');
      expect(result.unit).toBe('KiB');
    });

    it('per-call options override defaults', () => {
      byteSize.defaultOptions({ units: 'iec' });
      const result = byteSize(10000, { units: 'metric' });
      expect(result.value).toBe('10');
      expect(result.unit).toBe('kB');
    });
  });

  describe('locale', () => {
    it('1000 bytes with de-DE locale', () => {
      const result = byteSize(1000, { locale: 'de-DE' });
      expect(result.value).toBe('1');
      expect(result.unit).toBe('kB');
    });

    it('1500 bytes with de-DE locale and precision 2', () => {
      const result = byteSize(1500, { locale: 'de-DE', precision: 2 });
      expect(result.value).toBe('1,5');
      expect(result.unit).toBe('kB');
    });
  });

  describe('small numbers', () => {
    it('15.123456789 with precision 3', () => {
      const result = byteSize(15.123456789, { precision: 3 });
      expect(result.value).toBe('15.123');
      expect(result.unit).toBe('B');
    });
  });
});
