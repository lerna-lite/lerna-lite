import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { tempWrite } from '../temp-write.js';

describe('utils/temp-write', () => {
  it('tempWrite(string)', async () => {
    const filePath = await tempWrite('unicorn', 'test.png');
    expect(readFileSync(filePath, 'utf8')).toEqual('unicorn');
    expect(basename(filePath)).toEqual('test.png');
  });

  it('tempWrite(buffer)', async () => {
    const filePath = await tempWrite(Buffer.from('unicorn'), 'test.png');
    expect(readFileSync(filePath, 'utf8')).toEqual('unicorn');
  });

  it('tempWrite(buffer, path)', async () => {
    const filePath = await tempWrite(Buffer.from('unicorn'), 'foo/bar/test.png');
    expect(readFileSync(filePath, 'utf8')).toEqual('unicorn');

    const regexp = process.platform === 'win32' ? /foo\\bar\\test\.png$/ : /foo\/bar\/test\.png$/;
    expect(filePath).toMatch(regexp);
  });

  it('tempWrite(stream)', async () => {
    const readable = new Readable({
      read() {}, // Noop
    });
    readable.push('unicorn');
    readable.push(null);
    const filePath = await tempWrite(readable, 'test.png');
    expect(readFileSync(filePath, 'utf8')).toEqual('unicorn');
  });

  it('rejects when tempWrite(stream) throws an error', async () => {
    const mockWriteStream = {
      pipe: vi.fn().mockImplementation(() => ({
        on: vi.fn().mockImplementation(() => ({
          on: vi.fn(),
        })),
      })),
      unpipe: vi.fn(),
      on: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
        if (event === 'error') {
          handler('some error');
        }
        return this;
      }),
    };

    try {
      await tempWrite(mockWriteStream as any, 'test.png');
    } catch (err) {
      expect(err).toBe('some error');
    }
  });

  it('tempWrite.sync()', () => {
    expect(readFileSync(tempWrite.sync('unicorn'), 'utf8')).toEqual('unicorn');
  });
});
