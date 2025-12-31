import { describe, expect, it, test } from 'vitest';

import { addPrefixTransformer } from '../log-prefix-transformer.js';

describe('addPrefixTransformer', () => {
  const newLineSeparator = '\n';

  it('should add a prefix to each line of output', () =>
    new Promise((done: any) => {
      const prefix = 'PREFIX';
      const transformer = addPrefixTransformer({ tag: prefix });

      const input = 'line1\nline2\nline3';
      const expectedOutput = `PREFIX line1${newLineSeparator}PREFIX line2${newLineSeparator}PREFIX line3${newLineSeparator}`;

      const chunks: string[] = [];
      transformer.on('data', (chunk: Buffer) => {
        chunks.push(chunk.toString());
      });

      transformer.on('end', () => {
        expect(chunks.join('')).toBe(expectedOutput);
        done();
      });

      transformer.write(input);
      transformer.end();
    }));

  it('should handle empty input', () =>
    new Promise((done: any) => {
      const transformer = addPrefixTransformer({ tag: 'PREFIX' });

      const chunks: string[] = [];
      transformer.on('data', (chunk: Buffer) => {
        chunks.push(chunk.toString());
      });

      transformer.on('end', () => {
        expect(chunks.join('')).toBe('');
        done();
      });

      transformer.write('');
      transformer.end();
    }));

  it('should not add a prefix if no prefix is provided', () =>
    new Promise((done: any) => {
      const transformer = addPrefixTransformer();

      const input = 'line1\nline2\nline3';
      const expectedOutput = `line1${newLineSeparator}line2${newLineSeparator}line3${newLineSeparator}`;

      const chunks: string[] = [];
      transformer.on('data', (chunk: Buffer) => {
        chunks.push(chunk.toString());
      });

      transformer.on('end', () => {
        expect(chunks.join('')).toBe(expectedOutput);
        done();
      });

      transformer.write(input);
      transformer.end();
    }));

  describe('test-ansi-color-tags', () => {
    it('should handle tag object with ANSI escape codes', () =>
      new Promise((done: any) => {
        const transformer = addPrefixTransformer({
          tag: {
            blue: '\u001b[1m\u001b[34mblue\u001b[39m\u001b[22m',
            green: '\u001b[32mgreen\u001b[39m',
          },
        });

        const input = ['good line', 'good line', 'good line'];
        const expected = input
          .map((line) => {
            return 'blue:\u001b[1m\u001b[34mblue\u001b[39m\u001b[22m green:\u001b[32mgreen\u001b[39m ' + line + '\n';
          })
          .join('');

        let received = '';

        transformer.on('data', (buf) => {
          received += buf.toString('utf8');
        });
        transformer.on('end', () => {
          expect(received).toBe(expected);
          done();
        });

        input.forEach((line) => {
          transformer.write(line + '\n');
        });
        transformer.end();
      }));
  });

  describe('test-bad-utf8', () => {
    it('should handle log line containing bad utf8', () =>
      new Promise((done: any) => {
        const transformer = addPrefixTransformer();
        const input = Buffer.from([0x48, 0x69, 0x20, 0x80, 0x0a]); // "Hi\n"
        const expected = 'Hi \ufffd\n'; // replacement character
        let received = '';

        transformer.on('data', (buf) => {
          received += buf.toString('utf8');
        });
        transformer.on('end', () => {
          expect(received).toBe(expected);
          done();
        });

        transformer.write(input);
        transformer.end();
      }));

    it('should handle chunked bad utf8', () =>
      new Promise((done: any) => {
        const transformer = addPrefixTransformer();
        // Split the bad UTF8 sequence across chunks
        const input1 = Buffer.from([0x48, 0x69, 0x20]); // "Hi "
        const input2 = Buffer.from([0x80, 0x0a]); // bad byte + newline
        const expected = 'Hi \ufffd\n';
        let received = '';

        transformer.on('data', (buf) => {
          received += buf.toString('utf8');
        });
        transformer.on('end', () => {
          expect(received).toBe(expected);
          done();
        });

        transformer.write(input1);
        transformer.write(input2);
        transformer.end();
      }));
  });

  describe('test-basic functionality', () => {
    it('should perform basic text transformation', () =>
      new Promise((done: any) => {
        const transformer = addPrefixTransformer();
        const input = 'hello world\n';
        const expected = 'hello world\n';
        let received = '';

        transformer.on('data', (buf) => {
          received += buf.toString();
        });
        transformer.on('end', () => {
          expect(received).toBe(expected);
          done();
        });

        transformer.write(input);
        transformer.end();
      }));

    it('should format with timestamp', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer({ format: 'json', timeStamp: true });
        const input = 'hello world\n';
        let received = '';

        slt.on('data', (buf) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          const parsed = JSON.parse(received.replace('\n', ''));
          expect(parsed.msg).toBe('hello world');
          expect(typeof parsed.time).toBe('string');
          expect(new Date(parsed.time).getTime()).toBeGreaterThan(0);
          done();
        });

        slt.write(input);
        slt.end();
      }));

    describe('test-stringTag functionality', () => {
      test('string tag', () =>
        new Promise((done: any) => {
          const slt = addPrefixTransformer({ tag: 'worker:1' });
          const input = 'hello world\n';
          const expected = 'worker:1 hello world\n';
          let received = '';

          slt.on('data', (buf) => {
            received += buf.toString();
          });
          slt.on('end', () => {
            expect(received).toBe(expected);
            done();
          });

          slt.write(input);
          slt.end();
        }));
    });

    describe('test-text-tag-object functionality', () => {
      test('object tag', () =>
        new Promise((done: any) => {
          const slt = addPrefixTransformer({ tag: { worker: '1', pid: '12345' } });
          const input = 'hello world\n';
          const expected = 'worker:1 pid:12345 hello world\n';
          let received = '';

          slt.on('data', (buf) => {
            received += buf.toString();
          });
          slt.on('end', () => {
            expect(received).toBe(expected);
            done();
          });

          slt.write(input);
          slt.end();
        }));
    });
  });

  describe('test-text-timestamp functionality', () => {
    test('text format with timestamp', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer({ timeStamp: true });
        const input = 'hello world\n';
        let received = '';

        slt.on('data', (buf: any) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          // Should match: "2023-01-01T00:00:00.000Z hello world\n"
          const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z hello world\n$/;
          expect(received).toMatch(timestampRegex);
          done();
        });

        slt.write(input);
        slt.end();
      }));

    test('text format with timestamp and tag', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer({ timeStamp: true, tag: 'worker:1' });
        const input = 'hello world\n';
        let received = '';

        slt.on('data', (buf: any) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          // Should match: "2023-01-01T00:00:00.000Z worker:1 hello world\n"
          const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z worker:1 hello world\n$/;
          expect(received).toMatch(timestampRegex);
          done();
        });

        slt.write(input);
        slt.end();
      }));
  });

  describe('test-lineMerge functionality', () => {
    test('merge multiline logs', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer({ mergeMultiline: true });
        const input =
          'Error: something bad happened\n    at Object.<anonymous> (/path/to/file.js:1:1)\n    at Module._compile (module.js:456:26)\nnext line\n';
        let received = '';

        slt.on('data', (buf: any) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          const lines = received.split('\n').filter((line) => line.length > 0);
          expect(lines).toHaveLength(3);
          expect(lines[0]).toContain('Error: something bad happened');
          expect(lines[1]).toContain('at Object.<anonymous>');
          expect(lines[1]).toContain('at Module._compile');
          expect(lines[2]).toBe('next line');
          done();
        });

        slt.write(input);
        slt.end();
      }));

    test('merge multiline with timeout', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer({ mergeMultiline: true });
        let received = '';
        let dataCount = 0;

        slt.on('data', (buf: any) => {
          received += buf.toString();
          dataCount++;
        });
        slt.on('end', () => {
          expect(received).toBe('Error: something bad\n    at some location\n');
          expect(dataCount).toBeGreaterThan(0);
          done();
        });

        slt.write('Error: something bad\n');
        slt.write('    at some location\n');

        // Wait for the timeout to trigger flush
        setTimeout(() => {
          slt.end();
        }, 15);
      }));
  });

  describe('newline handling', () => {
    test('handles different line endings', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer();
        const inputs = ['line1\n', 'line2\r\n', 'line3\r', 'line4\v', 'line5\f'];
        let received = '';
        let lineCount = 0;

        slt.on('data', (buf: any) => {
          received += buf.toString();
          lineCount++;
        });
        slt.on('end', () => {
          expect(lineCount).toBe(5);
          expect(received).toContain('line1\n');
          expect(received).toContain('line2\n');
          expect(received).toContain('line3\n');
          expect(received).toContain('line4\n');
          expect(received).toContain('line5\n');
          done();
        });

        inputs.forEach((input) => slt.write(input));
        slt.end();
      }));

    test('swallows empty lines', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer();
        const input = 'line1\n\n\nline2\n';
        let received = '';
        let lineCount = 0;

        slt.on('data', (buf: any) => {
          received += buf.toString();
          lineCount++;
        });
        slt.on('end', () => {
          expect(lineCount).toBe(2); // Only non-empty lines
          expect(received).toBe('line1\nline2\n');
          done();
        });

        slt.write(input);
        slt.end();
      }));
  });

  describe('edge cases', () => {
    test('handles newlines in log messages correctly', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer();
        const input = 'line with\nnewline in it\n';
        let received = '';
        let lineCount = 0;

        slt.on('data', (buf: any) => {
          received += buf.toString();
          lineCount++;
        });
        slt.on('end', () => {
          // Input with newlines gets split into separate lines by deLiner
          expect(lineCount).toBe(2);
          expect(received).toBe('line with\nnewline in it\n');
          done();
        });

        slt.write(input);
        slt.end();
      }));

    test('handles incomplete lines at end of stream', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer();
        const input = 'incomplete line without newline';
        let received = '';

        slt.on('data', (buf: any) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          expect(received).toBe('incomplete line without newline\n');
          done();
        });

        slt.write(input);
        slt.end();
      }));

    test('handles multiple chunks forming single line', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer();
        let received = '';

        slt.on('data', (buf: any) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          expect(received).toBe('hello world\n');
          done();
        });

        slt.write('hello ');
        slt.write('world\n');
        slt.end();
      }));

    test('handles tag with special characters', () =>
      new Promise((done: any) => {
        const slt = addPrefixTransformer({ tag: 'worker[1]' });
        const input = 'test message\n';
        let received = '';

        slt.on('data', (buf: any) => {
          received += buf.toString();
        });
        slt.on('end', () => {
          expect(received).toBe('worker[1] test message\n');
          done();
        });

        slt.write(input);
        slt.end();
      }));
  });
});
