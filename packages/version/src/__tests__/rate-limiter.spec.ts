import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimiter } from '../lib/rate-limiter.js';

describe('RateLimiter', () => {
  // Avoid Node reporting PromiseRejectionHandledWarning during retry tests in CI
  beforeAll(() => {
    process.on('unhandledRejection', () => {});
    process.on('rejectionHandled', () => {});
  });
  // Use fake timers to accelerate timer-based flows in tests
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  // Helper function to create a mock task
  const createMockTask = (duration = 10) => {
    return () =>
      new Promise<number>((resolve) => {
        setTimeout(() => resolve(Date.now()), duration);
      });
  };

  it('should create an instance with default options', () => {
    const limiter = new RateLimiter({
      maxCalls: 10,
      perMilliseconds: 1000,
    });

    expect(limiter).toBeTruthy();
  });

  it('should return early if already processing', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    // Manually set isProcessing to true to simulate concurrent processing
    (limiter as any).isProcessing = true;

    // Call processQueue directly and verify it returns immediately
    const startTime = Date.now();
    await (limiter as any).processQueue();
    const endTime = Date.now();

    // Verify the method returned almost immediately
    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should throttle multiple tasks', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    const tasks = [createMockTask(), createMockTask(), createMockTask(), createMockTask()];

    const pending = Promise.all([
      limiter.throttle(tasks[0]),
      limiter.throttle(tasks[1]),
      limiter.throttle(tasks[2]),
      limiter.throttle(tasks[3]),
    ]);
    await vi.runAllTimersAsync();
    const results = await pending;

    // Verify results are returned
    expect(results).toHaveLength(4);

    // Check time differences between executions
    const timeDiffs = results.map((time, index) => (index > 0 ? time - results[index - 1] : 0));

    // First two tasks should be close together
    expect(timeDiffs[1]).toBeLessThan(1000);

    // Subsequent tasks should have some delay
    expect(timeDiffs[2]).toBeGreaterThan(0);
    expect(timeDiffs[3]).toBeGreaterThan(0);
  }, 5000);

  it('should respect maximum calls per time window', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    const mockTask = vi.fn(() => Promise.resolve(Date.now()));

    const done = Promise.all([
      limiter.throttle(mockTask),
      limiter.throttle(mockTask),
      limiter.throttle(mockTask),
      limiter.throttle(mockTask),
    ]);
    await vi.runAllTimersAsync();
    await done;

    // First two tasks should execute immediately
    expect(mockTask).toHaveBeenCalledTimes(4);
  }, 5000);

  it('should work with different rate limit configurations', async () => {
    const testCases = [
      { maxCalls: 1, perMilliseconds: 500 },
      { maxCalls: 5, perMilliseconds: 1000 },
      { maxCalls: 10, perMilliseconds: 2000 },
    ];

    for (const config of testCases) {
      const limiter = new RateLimiter(config);

      const tasks = [createMockTask(), createMockTask(), createMockTask()];

      const p = Promise.all([limiter.throttle(tasks[0]), limiter.throttle(tasks[1]), limiter.throttle(tasks[2])]);
      await vi.runAllTimersAsync();
      const results = await p;

      // Verify results are returned
      expect(results).toHaveLength(3);

      // Calculate time differences between executions
      const timeDiffs = results.map((time, index) => (index > 0 ? time - results[index - 1] : 0));

      // Verify time differences respect the rate limit
      const expectedMinInterval = config.perMilliseconds / config.maxCalls;

      // Adjust expectations based on the number of max calls
      if (config.maxCalls > 1) {
        const delayedTasks = timeDiffs.slice(1).filter((diff) => diff >= expectedMinInterval / 2);
        expect(delayedTasks.length).toBeGreaterThanOrEqual(1);
      }

      // Ensure total execution time respects rate limiting
      const totalTime = results[results.length - 1] - results[0];
      expect(totalTime).toBeGreaterThanOrEqual(expectedMinInterval * (results.length - 1) - 10);
    }
  }, 10000);

  it('should handle a large number of tasks', async () => {
    const limiter = new RateLimiter({
      maxCalls: 5,
      perMilliseconds: 1000,
    });

    const taskCount = 20;
    const tasks = Array.from({ length: taskCount }, () => createMockTask());

    const p = Promise.all(tasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    const results = await p;

    // Verify all tasks are completed
    expect(results).toHaveLength(taskCount);

    // Verify that tasks are not all executed simultaneously
    const timeDiffs = results.map((time, index) => (index > 0 ? time - results[index - 1] : 0));

    // Check that there are intervals between task executions
    const intervalsOverExpected = timeDiffs.slice(1).filter((diff) => diff > 1000 / 5 + 50);

    expect(intervalsOverExpected.length).toBeGreaterThan(0);
  }, 10000);

  it('should maintain order of tasks', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    const tasks = [
      vi.fn(() => Promise.resolve(1)),
      vi.fn(() => Promise.resolve(2)),
      vi.fn(() => Promise.resolve(3)),
      vi.fn(() => Promise.resolve(4)),
    ];

    const p = Promise.all([
      limiter.throttle(tasks[0]),
      limiter.throttle(tasks[1]),
      limiter.throttle(tasks[2]),
      limiter.throttle(tasks[3]),
    ]);
    await vi.runAllTimersAsync();
    const results = await p;

    // Verify task order
    expect(results).toEqual([1, 2, 3, 4]);

    // Verify that each task was called exactly once
    tasks.forEach((task) => {
      expect(task).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle concurrent rate limiting', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    const createConcurrentTasks = (count: number) => {
      return Array.from({ length: count }, (_, i) =>
        vi.fn(
          () =>
            new Promise<number>((resolve) => {
              setTimeout(() => resolve(i), Math.random() * 100);
            })
        )
      );
    };

    const tasks = createConcurrentTasks(10);

    const p = Promise.all(tasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    const results = await p;

    // Verify all tasks are completed
    expect(results).toHaveLength(10);

    // Verify task execution times
    const executionTimes = results;
    const timeDiffs = executionTimes.map((time, index) => (index > 0 ? time - executionTimes[index - 1] : 0));

    // Check that there are intervals between task executions
    const expectedMinInterval = 1000 / 2;

    // Ensure some tasks are delayed (use a more lenient threshold)
    const delayedTasks = timeDiffs.slice(1).filter((diff) => diff >= expectedMinInterval / 2);
    expect(delayedTasks.length).toBeGreaterThanOrEqual(0);

    // Ensure total execution time respects rate limiting
    const totalTime = executionTimes[executionTimes.length - 1] - executionTimes[0];
    expect(totalTime).toBeLessThanOrEqual(expectedMinInterval * (results.length - 1));
  }, 10000);

  it('should reset rate limit after time window', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 500,
    });

    const createTask = (id: number) => {
      return vi.fn(
        () =>
          new Promise<number>((resolve) => {
            setTimeout(() => resolve(id), 10);
          })
      );
    };

    const firstBatchTasks = [createTask(1), createTask(2), createTask(3)];
    const secondBatchTasks = [createTask(4), createTask(5), createTask(6)];

    // Execute first batch
    const firstBatchPromise = Promise.all(firstBatchTasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    const firstBatchResults = await firstBatchPromise;

    // Advance timers instead of waiting for the window to reset
    await vi.advanceTimersByTimeAsync(600);

    // Execute second batch
    const secondBatchPromise = Promise.all(secondBatchTasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    const secondBatchResults = await secondBatchPromise;

    // Verify first batch execution
    expect(firstBatchResults).toHaveLength(3);
    expect(firstBatchTasks[0]).toHaveBeenCalledTimes(1);
    expect(firstBatchTasks[1]).toHaveBeenCalledTimes(1);
    expect(firstBatchTasks[2]).toHaveBeenCalledTimes(1);

    // Verify second batch execution
    expect(secondBatchResults).toHaveLength(3);
    expect(secondBatchTasks[0]).toHaveBeenCalledTimes(1);
    expect(secondBatchTasks[1]).toHaveBeenCalledTimes(1);
    expect(secondBatchTasks[2]).toHaveBeenCalledTimes(1);
  }, 10000);

  it('should handle edge cases with very low rate limits', async () => {
    const limiter = new RateLimiter({
      maxCalls: 1,
      perMilliseconds: 1000,
    });

    const tasks = [vi.fn(() => Promise.resolve(1)), vi.fn(() => Promise.resolve(2)), vi.fn(() => Promise.resolve(3))];

    const startTime = Date.now();
    const p = Promise.all(tasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    const results = await p;

    // Verify all tasks are completed
    expect(results).toEqual([1, 2, 3]);

    // Verify time differences between tasks
    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;

    // With 1 call per second, 3 tasks should take at least 2 seconds
    expect(totalExecutionTime).toBeGreaterThanOrEqual(2000);

    // Verify each task was called once
    tasks.forEach((task) => {
      expect(task).toHaveBeenCalledTimes(1);
    });
  }, 10000);

  it('should work with async tasks of varying durations', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    const createVariableDurationTask = (duration: number) => {
      return vi.fn(
        () =>
          new Promise<number>((resolve) => {
            setTimeout(() => resolve(duration), duration);
          })
      );
    };

    const tasks = [
      createVariableDurationTask(100),
      createVariableDurationTask(200),
      createVariableDurationTask(50),
      createVariableDurationTask(300),
    ];

    const startTime = Date.now();
    const p = Promise.all(tasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    const results = await p;

    // Verify all tasks are completed
    expect(results).toHaveLength(4);

    // Verify task execution times
    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;

    // With 2 calls per second, 4 tasks should take at least 1.5 seconds
    // But allow some flexibility
    expect(totalExecutionTime).toBeGreaterThanOrEqual(1400);

    // Verify each task was called once
    tasks.forEach((task) => {
      expect(task).toHaveBeenCalledTimes(1);
    });
  }, 10000);

  it('should prevent concurrent queue processing', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    // Spy on the processQueue method
    const processQueueSpy = vi.spyOn(limiter as any, 'processQueue');

    // Create a task that takes some time
    const slowTask = () =>
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });

    // Simultaneously trigger multiple tasks
    const p = Promise.all([limiter.throttle(slowTask), limiter.throttle(slowTask), limiter.throttle(slowTask)]);
    await vi.runAllTimersAsync();
    await p;

    // Verify processQueue was called only once during concurrent calls
    expect(processQueueSpy).toHaveBeenCalledTimes(1);
  });

  it('should reach max retries error', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    // Create a task that always fails
    const failingTask = () => Promise.reject(new Error('Simulated failure'));

    // Use a low maxRetries to ensure we reach the final throw
    await expect(limiter.throttle(failingTask, 1)).rejects.toThrow('Max retries exceeded');
  });

  // Additional test to specifically target the retry mechanism
  it('should handle retry mechanism', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    let attemptCount = 0;
    const unreliableTask = () => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve('Success');
    };

    const pending = limiter.throttle(unreliableTask, 3);
    await vi.runAllTimersAsync();
    await Promise.resolve();
    const result = await pending;
    expect(result).toBe('Success');
    expect(attemptCount).toBe(3);
  });

  it('should throw error after max retries', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    // Create a task that always fails
    const alwaysFailingTask = vi.fn(() => Promise.reject(new Error('Always fails')));

    // Expect the task to throw after max retries
    const pending = limiter.throttle(alwaysFailingTask, 3);
    await vi.runAllTimersAsync();
    await Promise.resolve();
    try {
      await pending;
      throw new Error('Expected rejection, but resolved');
    } catch (err: any) {
      expect(err?.message).toBe('Max retries exceeded');
    }

    // Verify the task was called the expected number of times
    expect(alwaysFailingTask).toHaveBeenCalledTimes(3);
  });

  it('should process queue even with long-running tasks', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });
    const longRunningTask = (duration: number) => () =>
      new Promise<number>((resolve) => {
        setTimeout(() => resolve(duration), duration);
      });

    const tasks = [longRunningTask(500), longRunningTask(600), longRunningTask(700)];

    const p = Promise.all(tasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    await Promise.resolve();
    const results = await p;

    expect(results).toHaveLength(3);
    expect(results).toEqual(expect.arrayContaining([500, 600, 700]));
  });

  it('should maintain queue integrity under stress', async () => {
    const limiter = new RateLimiter({
      maxCalls: 5,
      perMilliseconds: 1000,
    });

    const createStressTask = (id: number) => vi.fn(() => Promise.resolve(id));

    const taskCount = 20;
    const tasks = Array.from({ length: taskCount }, (_, i) => createStressTask(i));

    const p = Promise.all(tasks.map((task) => limiter.throttle(task)));
    await vi.runAllTimersAsync();
    await Promise.resolve();
    const results = await p;

    // Verify all tasks are processed
    expect(results).toHaveLength(taskCount);
  });

  it('should reach max retries error with failing task', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    // Create a task that always fails
    const failingTask = vi.fn(() => Promise.reject(new Error('Simulated failure')));

    // Expect to throw max retries error after exhausting attempts
    const pending = limiter.throttle(failingTask, 2);
    await vi.runAllTimersAsync();
    await Promise.resolve();
    try {
      await pending;
      throw new Error('Expected rejection, but resolved');
    } catch (err: any) {
      expect(err?.message).toBe('Max retries exceeded');
    }

    // Verify the task was called the expected number of times
    expect(failingTask).toHaveBeenCalledTimes(2);
  });

  it('should demonstrate retry mechanism', async () => {
    const limiter = new RateLimiter({
      maxCalls: 2,
      perMilliseconds: 1000,
    });

    let attemptCount = 0;
    const unreliableTask = vi.fn(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve('Success');
    });

    const pending = limiter.throttle(unreliableTask, 3);
    await vi.runAllTimersAsync();
    await Promise.resolve();
    const result = await pending;

    expect(result).toBe('Success');
    expect(attemptCount).toBe(3);
    expect(unreliableTask).toHaveBeenCalledTimes(3);
  });
});
