import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import { find, findPrefix } from '../find-prefix.js';

// Mock the entire module
vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
}));

vi.mock('node:path', () => ({
  resolve: vi.fn(),
  basename: vi.fn(),
  dirname: vi.fn(),
}));

describe('findPrefix function', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should handle a path inside node_modules', () => {
    // Mock path.resolve to return a specific path
    (path.resolve as Mock).mockReturnValueOnce('/some/path/to/node_modules/package');
    (fs.readdirSync as Mock).mockReturnValueOnce([]);

    const result = findPrefix('/some/path/to/node_modules/package');

    expect(result).toBe('/some/path/to/node_modules/package');
    expect(path.resolve).toHaveBeenCalledWith('/some/path/to/node_modules/package');
  });

  it('should return original directory if not in node_modules', () => {
    // Mock path.resolve to return a specific path
    (path.resolve as Mock).mockReturnValueOnce('/some/project/path');
    (fs.readdirSync as Mock).mockReturnValueOnce([]);

    const result = findPrefix('/some/project/path');

    expect(result).toBe('/some/project/path');
    expect(path.resolve).toHaveBeenCalledWith('/some/project/path');
  });
});

describe('find function', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return current directory if node_modules exists', () => {
    // Mock readdirSync to return an array with 'node_modules'
    (fs.readdirSync as Mock).mockReturnValueOnce(['node_modules', 'other_file.txt']);

    const result = find('/some/path', '/original');

    expect(result).toBe('/some/path');
  });

  it('should return current directory if package.json exists', () => {
    // Mock readdirSync to return an array with 'package.json'
    (fs.readdirSync as Mock).mockReturnValueOnce(['package.json', 'other_file.txt']);

    const result = find('/some/path', '/original');

    expect(result).toBe('/some/path');
  });

  it('should recursively search up the directory tree', () => {
    // First call returns no special files, second call returns node_modules
    (fs.readdirSync as Mock).mockImplementationOnce(() => ['some_file.txt']).mockImplementationOnce(() => ['node_modules']);

    // Mock path.dirname to simulate moving up the directory tree
    (path.dirname as Mock).mockReturnValueOnce('/some/nested').mockReturnValueOnce('/some');

    const result = find('/some/nested/path', '/original');

    expect(result).toBe('/some/nested');
  });

  it('should handle directory read errors', () => {
    const mockError = new Error('Read error') as NodeJS.ErrnoException;
    mockError.code = 'ENOENT';

    // Mock readdirSync to throw an ENOENT error
    (fs.readdirSync as Mock).mockImplementation(() => {
      throw mockError;
    });

    const result = find('/some/path', '/original');

    expect(result).toBe('/original');
  });

  it('should throw non-ENOENT errors', () => {
    const mockError = new Error('Unexpected error') as NodeJS.ErrnoException;
    mockError.code = 'UNEXPECTED';

    // Mock readdirSync to throw a non-ENOENT error
    (fs.readdirSync as Mock).mockImplementation(() => {
      throw mockError;
    });

    // When the error is thrown for the original path, it should be re-thrown
    expect(() => find('/some/path', '/some/path')).toThrow('Unexpected error');
  });

  it('should handle root directory on Unix-like systems', () => {
    // Mock platform to ensure Unix-like behavior
    vi.spyOn(process, 'platform', 'get').mockReturnValueOnce('darwin');

    const result = find('/', '/original');

    expect(result).toBe('/original');
  });

  it('should handle root directory on Windows', () => {
    // Mock platform to Windows
    vi.spyOn(process, 'platform', 'get').mockReturnValueOnce('win32');

    const result = find('C:\\', '/original');

    expect(result).toBe('/original');
  });

  it('should stop searching when reaching the original directory', () => {
    // Mock path.dirname to return the same path, simulating reaching the top
    (path.dirname as Mock).mockReturnValueOnce('/some/path');

    // Mock readdirSync to return no special files
    (fs.readdirSync as Mock).mockReturnValueOnce(['some_file.txt']);

    const result = find('/some/path', '/some/path');

    expect(result).toBe('/some/path');
  });
});
