import { Request, Response, NextFunction } from 'express';

/**
 * Strips MongoDB operator keys (those starting with $ or containing .)
 * from req.body and req.params recursively.
 *
 * express-mongo-sanitize@2.x is incompatible with Express 5 because
 * Express 5 made req.query a read-only getter. This custom middleware
 * achieves the same protection without touching req.query.
 */
function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Drop keys that start with $ or contain . (MongoDB injection vectors)
      if (!key.startsWith('$') && !key.includes('.')) {
        cleaned[key] = sanitizeValue(val);
      }
    }
    return cleaned;
  }

  return value;
}

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as Record<string, string>;
  }

  next();
};
