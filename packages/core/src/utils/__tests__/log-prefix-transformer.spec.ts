import { describe, expect, it } from 'vitest';

import { addPrefixTransformer } from '../log-prefix-transformer.js';

describe('addPrefixTransformer', () => {
  const newLineSeparator = process.platform.startsWith('win') ? '\r\n' : '\n';

  it('should add a prefix to each line of output', () =>
    new Promise((done: any) => {
      const prefix = 'PREFIX';
      const transformer = addPrefixTransformer(prefix);

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
      const transformer = addPrefixTransformer('PREFIX');

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
});
