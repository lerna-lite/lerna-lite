interface RateLimitOptions {
  /** Maximum number of calls allowed within the specified time window. */
  maxCalls: number;
  /** Time window in milliseconds for rate limiting. */
  perMilliseconds: number;
  /** Optional global delay between task executions. */
  globalDelay?: number;
  /** Number of calls allowed during the first iteration before applying standard rate limiting. */
  firstRunMaxCalls?: number;
}

export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private lastCallTimes: number[] = [];
  private options: Required<RateLimitOptions>;
  private isFirstIteration = true;
  private isProcessing = false;
  private nextAllowedTime = 0;

  constructor(options: RateLimitOptions) {
    this.options = {
      maxCalls: options.maxCalls,
      perMilliseconds: options.perMilliseconds,
      globalDelay: options.globalDelay || 0,
      firstRunMaxCalls: options.firstRunMaxCalls || options.maxCalls, // Default to maxCalls if not specified
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

        // Determine max allowed calls based on first iteration
        const maxAllowedCalls = this.isFirstIteration ? this.options.firstRunMaxCalls : this.options.maxCalls;

        // If we've reached max calls, calculate wait time
        if (this.lastCallTimes.length >= maxAllowedCalls) {
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
          this.nextAllowedTime = startTime + this.options.perMilliseconds / maxAllowedCalls;

          await nextTask();
        }
      }

      // Reset first iteration flag after processing the queue
      this.isFirstIteration = false;
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
              reject(error);
            }
          };

          this.queue.push(wrappedTask);

          if (!this.isProcessing) {
            // Start processing; attach catch to avoid background unhandled rejection
            this.processQueue().catch(/* v8 ignore next */ () => {});
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
