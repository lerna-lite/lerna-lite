import { describe, expect, it, vi } from 'vitest';

import { pMap } from '../p-map.js';

describe('pMap()', () => {
  describe('empty input', () => {
    it('returns an empty array for an empty iterable', async () => {
      const result = await pMap([], (x) => Promise.resolve(x));
      expect(result).toEqual([]);
    });
  });

  describe('basic mapping', () => {
    it('maps over an array with async mapper', async () => {
      const result = await pMap([1, 2, 3], async (x) => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('maps over an array with sync mapper', async () => {
      const result = await pMap([1, 2, 3], (x) => x + 10);
      expect(result).toEqual([11, 12, 13]);
    });

    it('preserves the order of results regardless of resolution timing', async () => {
      // First item resolves last, third resolves first
      const delays = [30, 10, 0];
      const result = await pMap([0, 1, 2], (i) => new Promise<number>((resolve) => setTimeout(() => resolve(i * 10), delays[i])));
      expect(result).toEqual([0, 10, 20]);
    });

    it('passes the correct index to the mapper', async () => {
      const indices: number[] = [];
      await pMap(['a', 'b', 'c'], async (item, i) => {
        indices.push(i);
        return item;
      });
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('concurrency limiting', () => {
    it('respects concurrency = 1 (serial execution)', async () => {
      const order: number[] = [];
      await pMap(
        [1, 2, 3, 4],
        async (x) => {
          order.push(x);
          await new Promise((r) => setTimeout(r, 5));
          return x;
        },
        { concurrency: 1 }
      );
      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('runs at most `concurrency` tasks in parallel', async () => {
      let active = 0;
      let maxActive = 0;
      const concurrency = 2;

      await pMap(
        [1, 2, 3, 4, 5, 6],
        async (x) => {
          active++;
          maxActive = Math.max(maxActive, active);
          await new Promise((r) => setTimeout(r, 10));
          active--;
          return x;
        },
        { concurrency }
      );

      expect(maxActive).toBeLessThanOrEqual(concurrency);
    });

    it('starts the next item as soon as a slot frees up', async () => {
      const started: number[] = [];
      await pMap(
        [1, 2, 3],
        async (x) => {
          started.push(x);
          await new Promise((r) => setTimeout(r, 5));
          return x;
        },
        { concurrency: 2 }
      );
      // All three items should have been started
      expect(started.sort()).toEqual([1, 2, 3]);
    });
  });

  describe('default concurrency (Infinity)', () => {
    it('runs all items in parallel with default concurrency', async () => {
      const started: number[] = [];
      await pMap([1, 2, 3, 4], async (x) => {
        started.push(x);
        return x;
      });
      expect(started).toHaveLength(4);
    });

    it('uses Promise.all path when concurrency >= items.length', async () => {
      const spy = vi.fn(async (x: number) => x * 2);
      const result = await pMap([1, 2, 3], spy, { concurrency: 10 });
      expect(result).toEqual([2, 4, 6]);
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('rejects when the mapper throws synchronously', async () => {
      await expect(
        pMap([1, 2, 3], (x) => {
          if (x === 2) throw new Error('sync error');
          return x;
        })
      ).rejects.toThrow('sync error');
    });

    it('rejects when the mapper returns a rejected promise', async () => {
      await expect(
        pMap([1, 2, 3], async (x) => {
          if (x === 1) throw new Error('async error');
          return x;
        })
      ).rejects.toThrow('async error');
    });

    it('rejects on the first error with concurrency limiting', async () => {
      await expect(
        pMap(
          [1, 2, 3, 4, 5],
          async (x) => {
            if (x === 2) throw new Error(`error at ${x}`);
            return x;
          },
          { concurrency: 2 }
        )
      ).rejects.toThrow('error at 2');
    });

    it('does not start new items after rejection (concurrency path)', async () => {
      const started: number[] = [];
      await expect(
        pMap(
          [1, 2, 3, 4, 5],
          async (x) => {
            started.push(x);
            if (x === 1) {
              await new Promise((r) => setTimeout(r, 0));
              throw new Error('stop');
            }
            await new Promise((r) => setTimeout(r, 20));
            return x;
          },
          { concurrency: 1 }
        )
      ).rejects.toThrow('stop');

      // With concurrency=1, only item 1 should have been started before error
      expect(started).toEqual([1]);
    });

    it('does not call reject twice on multiple concurrent failures', async () => {
      let rejectCount = 0;
      const originalPromise = pMap(
        [1, 2, 3],
        async (x) => {
          throw new Error(`error ${x}`);
        },
        { concurrency: 3 }
      );

      await originalPromise.catch(() => {
        rejectCount++;
      });

      // Promise can only be rejected once
      expect(rejectCount).toBe(1);
    });

    it('ignores subsequent errors once already settled (concurrency-limited path)', async () => {
      // With concurrency=2, items 1 and 2 start together; both fail, but only the
      // first rejection should call reject() — the second hits the settled guard.
      let firstError: string | undefined;
      await pMap(
        [1, 2, 3, 4],
        async (x) => {
          if (x <= 2) throw new Error(`fail-${x}`);
          return x;
        },
        { concurrency: 2 }
      ).catch((err: Error) => {
        firstError = err.message;
      });

      expect(firstError).toMatch(/^fail-/);
    });
  });

  describe('edge cases', () => {
    it('handles a Set as the iterable input', async () => {
      const result = await pMap(new Set([10, 20, 30]), async (x) => x + 1);
      expect(result).toEqual([11, 21, 31]);
    });

    it('handles a Map values iterable', async () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const result = await pMap(map.values(), async (x) => x * 3);
      expect(result).toEqual([3, 6]);
    });

    it('handles a single-item array', async () => {
      const result = await pMap(['only'], async (x) => x.toUpperCase());
      expect(result).toEqual(['ONLY']);
    });

    it('handles concurrency exactly equal to item count', async () => {
      const result = await pMap([1, 2, 3], async (x) => x * 2, { concurrency: 3 });
      expect(result).toEqual([2, 4, 6]);
    });

    it('handles mapper returning non-promise values', async () => {
      const result = await pMap([1, 2, 3], (x, i) => `${x}-${i}`, { concurrency: 2 });
      expect(result).toEqual(['1-0', '2-1', '3-2']);
    });
  });
});
