// Test setup file - runs before all tests
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.API_KEY = 'test-api-key-12345';
process.env.AUTH_ENABLED = 'true';
process.env.API_KEY_HEADER = 'x-api-key';

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
