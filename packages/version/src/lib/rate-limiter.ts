// oxlint-disable no-floating-promises
interface RateLimitOptions {
  maxCalls: number;
  perMilliseconds: number;
  globalDelay?: number;
}

export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private lastCallTimes: number[] = [];
  private options: RateLimitOptions;
  private isProcessing = false;
  private nextAllowedTime = 0;

  constructor(options: RateLimitOptions) {
    this.options = {
      maxCalls: options.maxCalls,
      perMilliseconds: options.perMilliseconds,
      globalDelay: options.globalDelay || 0,
    };
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const now = Date.now();

        // Wait if we haven't reached the next allowed time
        if (now < this.nextAllowedTime) {
          await new Promise((resolve) => setTimeout(resolve, this.nextAllowedTime - now));
        }

        // Clean up old call times
        this.lastCallTimes = this.lastCallTimes.filter((time) => now - time < this.options.perMilliseconds);

        // If we've reached max calls, calculate wait time
        if (this.lastCallTimes.length >= this.options.maxCalls) {
          const oldestCallTime = this.lastCallTimes[0];
          const timeToNextSlot = this.options.perMilliseconds - (now - oldestCallTime);

          await new Promise((resolve) => setTimeout(resolve, timeToNextSlot));
          continue;
        }

        // Execute the next task
        const nextTask = this.queue.shift();
        if (nextTask) {
          const startTime = Date.now();
          this.lastCallTimes.push(startTime);

          // Calculate next allowed time to enforce rate limit
          this.nextAllowedTime = startTime + this.options.perMilliseconds / this.options.maxCalls;

          await nextTask();
        }
      }
    } /* v8 ignore next */ catch (error) {
      console.error('Rate limited task failed:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async throttle<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let retries = 0;

    while (true) {
      try {
        return await new Promise((resolve, reject) => {
          const wrappedTask = async () => {
            try {
              const result = await fn();
              resolve(result);
            } catch (error) {
              // Explicitly reject the promise
              reject(error);
            }
          };

          this.queue.push(wrappedTask);

          // Start processing if not already in progress
          if (!this.isProcessing) {
            this.processQueue();
          }
        });
      } catch (error) {
        retries++;

        // Check if max retries is reached
        if (retries >= maxRetries) {
          throw new Error('Max retries exceeded');
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 2 ** retries * 1000));
      }
    }
  }
}
