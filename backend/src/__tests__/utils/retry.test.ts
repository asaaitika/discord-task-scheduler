// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  retryWithExponentialBackoff,
  retryWithRateLimit,
  RetryError,
} from '../../utils/retry';

describe('Retry Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryWithExponentialBackoff', () => {
    it('should succeed on first attempt', async () => {
      const successFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(successFn);

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryError after max retries exceeded', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        retryWithExponentialBackoff(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
        })
      ).rejects.toThrow(RetryError);

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle network errors (retryable)', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';

      const fn = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout errors (retryable)', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';

      const fn = jest
        .fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle HTTP 429 rate limit errors', async () => {
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).response = { status: 429 };

      const fn = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        initialDelayMs: 10,
        retryableStatuses: [429],
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle HTTP 500 server errors', async () => {
      const serverError = new Error('Server error');
      (serverError as any).response = { status: 500 };

      const fn = jest
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
    });

    it('should handle HTTP 502 Bad Gateway errors', async () => {
      const badGatewayError = new Error('Bad Gateway');
      (badGatewayError as any).response = { status: 502 };

      const fn = jest
        .fn()
        .mockRejectedValueOnce(badGatewayError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
    });

    it('should handle HTTP 503 Service Unavailable errors', async () => {
      const serviceUnavailableError = new Error('Service Unavailable');
      (serviceUnavailableError as any).response = { status: 503 };

      const fn = jest
        .fn()
        .mockRejectedValueOnce(serviceUnavailableError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
    });

    it('should not retry non-retryable HTTP errors', async () => {
      const notFoundError = new Error('Not found');
      (notFoundError as any).response = { status: 404 };

      const fn = jest.fn().mockRejectedValue(notFoundError);

      await expect(
        retryWithExponentialBackoff(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
        })
      ).rejects.toThrow(RetryError);

      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should respect custom retryable error messages', async () => {
      const customError = new Error('Custom retryable error');

      const fn = jest
        .fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, {
        initialDelayMs: 10,
        retryableErrors: ['Custom retryable'],
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff delays', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();

      await retryWithExponentialBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 50,
        backoffMultiplier: 2,
      });

      const elapsed = Date.now() - startTime;

      // Should have delays of ~50ms and ~100ms
      expect(elapsed).toBeGreaterThanOrEqual(150);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should cap delay at maxDelayMs', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      await retryWithExponentialBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 150,
        backoffMultiplier: 3,
      });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should include attempt count in RetryError', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

      try {
        await retryWithExponentialBackoff(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RetryError);
        expect((error as RetryError).attempts).toBe(3);
        expect((error as RetryError).lastError.message).toBe('Always fails');
      }
    });

    it('should use default options when none provided', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryWithRateLimit', () => {
    it('should use rate limit specific retry options', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithRateLimit(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle Discord rate limit (429) errors', async () => {
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).response = { status: 429 };

      const fn = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');

      const result = await retryWithRateLimit(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry up to 5 times for rate limits', async () => {
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).response = { status: 429 };

      const fn = jest.fn().mockRejectedValue(rateLimitError);

      await expect(retryWithRateLimit(fn)).rejects.toThrow(RetryError);

      expect(fn).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });

    it('should allow custom options override', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithRateLimit(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
    });
  });

  describe('RetryError', () => {
    it('should create RetryError with correct properties', () => {
      const originalError = new Error('Original error');
      const retryError = new RetryError('Retry failed', 3, originalError);

      expect(retryError).toBeInstanceOf(Error);
      expect(retryError.name).toBe('RetryError');
      expect(retryError.message).toBe('Retry failed');
      expect(retryError.attempts).toBe(3);
      expect(retryError.lastError).toBe(originalError);
    });
  });
});
