import { describe, expect, test } from 'vitest';

import * as throttling from '../lib/throttle-queue.js';

describe('verifyTailHeadQueueBehavior', () => {
  test('immediately runs all provided resolving promises within queue size', async () => {
    const count = 100;
    const queue = new throttling.TailHeadQueue(count, 1000);
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => Date.now()));
    const acc = await Promise.all(queue_promises);
    expect(acc.length).toBe(count);
    acc.sort();
    expect(acc[count - 1] - acc[0]).toBeLessThan(100);
  });
  test('immediately runs all provided rejecting promises within queue size', async () => {
    const count = 100;
    const queue = new throttling.TailHeadQueue(count, 1000);
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => new Promise((_, r) => r(Date.now()))));
    const acc = await Promise.allSettled(queue_promises);
    expect(acc.length).toBe(count);
    const resolved_sorted_acc = acc
      .map((r) => {
        expect(r.status).toBe('rejected');
        if (r.status === 'rejected') {
          return r.reason;
        }
      })
      .sort();
    expect(resolved_sorted_acc[count - 1] - resolved_sorted_acc[0]).toBeLessThan(100);
  });
  test('runs all provided resolving promises with a delay if they exceed queue size', async () => {
    const count = 100;
    const queue = new throttling.TailHeadQueue(count / 3 + 1, 2 * 1000);
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => Date.now()));
    const acc = await Promise.all(queue_promises);
    expect(acc.length).toBe(count);
    acc.sort();
    const total_time = acc[count - 1] - acc[0];
    expect(total_time).toBeGreaterThan(3.8 * 1000);
    expect(total_time).toBeLessThan(4.2 * 1000);
  });

  test('delays execution when queue is re-entered quickly after being emptied', async () => {
    const queue = new throttling.TailHeadQueue(2, 100);
    
    // First batch - should run immediately and empty the queue
    const firstBatch = [
      queue.queue(async () => Date.now()),
      queue.queue(async () => Date.now()),
    ];
    await Promise.all(firstBatch);
    
    // Wait a very short time (less than queue_period) before adding more
    await new Promise((r) => setTimeout(r, 10));
    
    // Second batch - should be delayed because queue was emptied recently
    const startTime = Date.now();
    const secondBatch = [
      queue.queue(async () => Date.now()),
      queue.queue(async () => Date.now()),
    ];
    const results = await Promise.all(secondBatch);
    const executionTime = results[0] - startTime;
    
    // Should have been delayed by approximately queue_period minus the 10ms we waited
    expect(executionTime).toBeGreaterThan(50);
    expect(executionTime).toBeLessThan(150);
  });
});
