import { ExecOpts } from '@lerna-lite/core';
import * as entry from '../index';

describe('Testing common lib entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have all exported object defined', () => {
    expect(typeof entry.filterPackages).toBe('function');
    expect(typeof entry.getFilteredPackages).toBe('function');
  });

  it('should return an empty array when arrify input is null or undefined', () => {
    entry.filterPackages([], null as any);
  });

  it('should expect arrify to return an array when execOpts input is empty', () => {
    expect(entry.getFilteredPackages([] as any, {} as ExecOpts, {} as entry.FilterOptions)).resolves.toBeTruthy();
  });
});
