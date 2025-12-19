import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import discordService from '../../services/discordService';
import { mockTask } from '../fixtures/task.fixtures';
import { RetryError } from '../../utils/retry';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock retry utility
jest.mock('../../utils/retry', () => ({
  retryWithRateLimit: jest.fn((fn) => fn()),
  RetryError: class RetryError extends Error {
    constructor(message: string, public attempts: number, public lastError: Error) {
      super(message);
      this.name = 'RetryError';
    }
  },
}));

describe('DiscordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTaskNotification', () => {
    it('should successfully send Discord notification with default payload', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockTask.discord_webhook_url,
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining(mockTask.title),
              description: mockTask.description,
            }),
          ]),
        }),
        expect.objectContaining({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should send Discord notification with custom payload', async () => {
      const customPayload = {
        content: 'Custom message',
        embeds: [
          {
            title: 'Custom Title',
            description: 'Custom Description',
            color: 0xff0000,
          },
        ],
      };

      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await discordService.sendTaskNotification(
        mockTask,
        customPayload
      );

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockTask.discord_webhook_url,
        customPayload,
        expect.any(Object)
      );
    });

    it('should handle Discord rate limit headers', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset-after': '5',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Discord rate limit reached')
      );
    });

    it('should return false on RetryError', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const originalError = new Error('Network error');
      const retryError = new RetryError('Failed after retries', 3, originalError);

      mockedAxios.post.mockRejectedValue(retryError);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Discord notification'),
        expect.any(String)
      );
    });

    it('should handle axios errors with response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Bad request' },
        },
      };

      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Discord API error: 400')
      );
    });

    it('should handle axios errors with no response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const axiosError = {
        isAxiosError: true,
        request: {},
      };

      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Discord API: No response received'
      );
    });

    it('should handle axios request setup errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const axiosError = {
        isAxiosError: true,
        message: 'Request setup failed',
      };

      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Discord API request setup error:',
        'Request setup failed'
      );
    });

    it('should handle generic errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const genericError = new Error('Unknown error');

      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
      mockedAxios.post.mockRejectedValue(genericError);

      const result = await discordService.sendTaskNotification(mockTask);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Discord notification:',
        genericError
      );
    });

    it('should log success message', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await discordService.sendTaskNotification(mockTask);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Discord notification sent for task: ${mockTask.id}`)
      );
    });
  });

  describe('sendCustomMessage', () => {
    const webhookUrl = 'https://discord.com/api/webhooks/test/webhook';
    const message = 'Test custom message';

    it('should successfully send custom message', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await discordService.sendCustomMessage(webhookUrl, message);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        webhookUrl,
        { content: message },
        expect.objectContaining({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should return false on RetryError', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const originalError = new Error('Network error');
      const retryError = new RetryError('Failed after retries', 5, originalError);

      mockedAxios.post.mockRejectedValue(retryError);

      const result = await discordService.sendCustomMessage(webhookUrl, message);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send custom message after 5 attempts'),
        expect.any(String)
      );
    });

    it('should handle generic errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const genericError = new Error('Unknown error');

      mockedAxios.post.mockRejectedValue(genericError);

      const result = await discordService.sendCustomMessage(webhookUrl, message);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending custom Discord message:',
        genericError
      );
    });
  });
});
