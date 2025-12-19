import { Request, Response, NextFunction } from 'express';
import { authConfig, isValidApiKey } from '../config/auth';

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip auth if disabled (for development/testing)
  if (!authConfig.enabled) {
    return next();
  }

  // Extract API key from header
  const apiKey = req.headers[authConfig.headerName.toLowerCase()] as
    | string
    | undefined;

  // Validate API key
  if (!isValidApiKey(apiKey)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      requiredHeader: authConfig.headerName,
    });
    return;
  }

  // API key is valid, proceed
  next();
}

// Optional: Middleware for logging API key usage
export function logApiKeyUsage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers[authConfig.headerName.toLowerCase()] as
    | string
    | undefined;

  if (apiKey) {
    // Log masked key for security
    const maskedKey = apiKey.slice(0, 4) + '****' + apiKey.slice(-4);
    console.log(
      `[API Auth] ${req.method} ${req.path} - Key: ${maskedKey}`
    );
  }

  next();
}
