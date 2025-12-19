import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  // Primary API key (required)
  apiKey: process.env.API_KEY || '',

  // Optional: Support multiple keys (comma-separated)
  apiKeys: process.env.API_KEYS?.split(',').map((k) => k.trim()) || [],

  // Whether auth is enabled
  enabled: process.env.AUTH_ENABLED !== 'false', // Default: enabled

  // Header name for API key
  headerName: process.env.API_KEY_HEADER || 'x-api-key',
};

// Validation helper
export function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false;

  // Check primary key
  if (authConfig.apiKey && key === authConfig.apiKey) {
    return true;
  }

  // Check additional keys
  if (authConfig.apiKeys.length > 0) {
    return authConfig.apiKeys.includes(key);
  }

  return false;
}
