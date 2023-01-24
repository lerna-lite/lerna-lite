import * as entry from '../index';

describe('Testing common lib entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have all exported object defined', () => {
    expect(typeof entry.Profiler).toBe('function');
  });
});
