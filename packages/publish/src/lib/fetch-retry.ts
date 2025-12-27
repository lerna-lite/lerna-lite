/**
 * Options for customizing fetch retry behavior
 */
interface FetchRetryOptions extends RequestInit {
  /** Number of times to retry the fetch request if it fails. */
  retry?: number;

  /** Base delay between retry attempts in milliseconds. Uses exponential backoff. */
  retryDelay?: number;

  /** Custom function to determine if a response should trigger a retry. */
  retryCondition?: (response: Response) => boolean;
}

/**
 * Performs a fetch request with configurable retry mechanism.
 *
 * @param url - The URL to fetch.
 * @param options - Optional configuration for the fetch request.
 * @returns A promise that resolves to the fetch response.
 * @throws Error if all retry attempts fail.
 */
export async function fetchWithRetry(url: string | URL, options: FetchRetryOptions = {}): Promise<Response> {
  const {
    retry = 3, // Default retry count
    retryDelay = 1000, // Default delay between retries
    retryCondition = (response: Response) => !response.ok,
    ...fetchOptions // Spread remaining native Fetch options, including headers
  } = options;

  for (let attempt = 0; attempt < retry + 1; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
      });

      // Check if the response meets the retry condition
      if (retryCondition(response)) {
        // Do not retry if method is POST
        if (fetchOptions.method?.toUpperCase() === 'POST') {
          throw new Error(`Failed after 1 attempt (POST requests are not retried)`);
        }
        if (attempt < retry) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(`Failed after ${retry + 1} attempts`);
      }

      return response;
    } catch (error) {
      // Do not retry if method is POST
      if (fetchOptions.method?.toUpperCase() === 'POST' || attempt === retry) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  // This line should never be reached, but TypeScript requires a return
  throw new Error('Unexpected fetch failure');
}