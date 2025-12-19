import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { requireApiKey, logApiKeyUsage } from '../../middleware/auth.middleware';
import * as authConfig from '../../config/auth';

// Mock auth config
jest.mock('../../config/auth', () => ({
  authConfig: {
    enabled: true,
    headerName: 'x-api-key',
    apiKey: 'test-api-key-12345',
    apiKeys: ['additional-key-1', 'additional-key-2'],
  },
  isValidApiKey: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockRequest = {
      headers: {},
      method: 'GET',
      path: '/test',
    } as Partial<Request>;

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;

    nextFunction = jest.fn();
  });

  describe('requireApiKey', () => {
    it('should call next() when auth is disabled', () => {
      // Mock auth as disabled
      (authConfig.authConfig as any).enabled = false;

      requireApiKey(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 401 when API key is missing', () => {
      (authConfig.authConfig as any).enabled = true;
      (authConfig.isValidApiKey as jest.Mock).mockReturnValue(false);

      mockRequest.headers = {};

      requireApiKey(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid or missing API key',
        requiredHeader: 'x-api-key',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when API key is invalid', () => {
      (authConfig.authConfig as any).enabled = true;
      (authConfig.isValidApiKey as jest.Mock).mockReturnValue(false);

      mockRequest.headers = {
        'x-api-key': 'invalid-key',
      };

      requireApiKey(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authConfig.isValidApiKey).toHaveBeenCalledWith('invalid-key');
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() when API key is valid', () => {
      (authConfig.authConfig as any).enabled = true;
      (authConfig.isValidApiKey as jest.Mock).mockReturnValue(true);

      mockRequest.headers = {
        'x-api-key': 'test-api-key-12345',
      };

      requireApiKey(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authConfig.isValidApiKey).toHaveBeenCalledWith('test-api-key-12345');
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive header names', () => {
      (authConfig.authConfig as any).enabled = true;
      (authConfig.isValidApiKey as jest.Mock).mockReturnValue(true);

      mockRequest.headers = {
        'X-API-KEY': 'test-api-key-12345', // uppercase
      };

      requireApiKey(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('logApiKeyUsage', () => {
    it('should log masked API key when present', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      mockRequest = {
        headers: { 'x-api-key': 'test-api-key-12345' },
        method: 'GET',
        path: '/api/tasks',
      } as Partial<Request>;

      logApiKeyUsage(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[API Auth] GET /api/tasks - Key: test****2345'
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should not log when API key is missing', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      mockRequest = {
        headers: {},
        method: 'POST',
        path: '/api/tasks',
      } as Partial<Request>;

      logApiKeyUsage(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should properly mask short API keys', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      mockRequest = {
        headers: { 'x-api-key': '12345678' },
        method: 'DELETE',
        path: '/api/tasks/123',
      } as Partial<Request>;

      logApiKeyUsage(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[API Auth] DELETE /api/tasks/123 - Key: 1234****5678'
      );
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
