export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatuses?: number[]; // HTTP status codes to retry
  retryableErrors?: string[]; // Error messages/codes to retry
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry this error
      const shouldRetry = isRetryableError(error, opts);

      if (!shouldRetry || attempt === opts.maxRetries) {
        throw new RetryError(
          `Failed after ${attempt + 1} attempts: ${error.message}`,
          attempt + 1,
          error
        );
      }

      // Log retry attempt
      console.warn(
        `Attempt ${attempt + 1}/${opts.maxRetries + 1} failed: ${error.message}. ` +
          `Retrying in ${delay}ms...`
      );

      // Wait before retrying
      await sleep(delay);

      // Calculate next delay (exponential backoff with max cap)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw new RetryError(
    `Failed after ${opts.maxRetries + 1} attempts`,
    opts.maxRetries + 1,
    lastError!
  );
}

function isRetryableError(error: any, options: RetryOptions): boolean {
  // Check for network errors
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND'
  ) {
    return true;
  }

  // Check HTTP status codes
  if (error.response?.status) {
    const status = error.response.status;
    const retryableStatuses = options.retryableStatuses || [
      429, 500, 502, 503, 504,
    ];
    return retryableStatuses.includes(status);
  }

  // Check custom retryable errors
  if (options.retryableErrors && error.message) {
    return options.retryableErrors.some((msg) =>
      error.message.includes(msg)
    );
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Special handler for Discord rate limits (429)
export async function retryWithRateLimit<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return retryWithExponentialBackoff(fn, {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    retryableStatuses: [429, 500, 502, 503, 504],
    ...options,
  });
}
