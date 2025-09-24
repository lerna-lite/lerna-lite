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

  /** HTTP headers to send with the request. */
  headers?: HeadersInit;
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
    headers,
    ...fetchOptions // Spread remaining fetch options
  } = options;

  for (let attempt = 0; attempt < retry + 1; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions, // Spread other fetch options like method, body, etc.
        headers: {
          ...headers, // Spread headers to allow full customization
        },
      });

      // Check if the response meets the retry condition
      if (retryCondition(response)) {
        if (attempt < retry) {
          // Wait before retrying with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
        // If max retries reached, throw an error
        throw new Error(`Failed after ${retry + 1} attempts`);
      }

      // Return successful response
      return response;
    } catch (error) {
      // Handle network errors
      if (attempt === retry) {
        throw error; // Rethrow on last attempt
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  // This line should never be reached, but TypeScript requires a return
  throw new Error('Unexpected fetch failure');
}
