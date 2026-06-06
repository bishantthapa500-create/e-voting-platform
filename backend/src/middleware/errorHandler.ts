import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown[];
}

/**
 * Global Express error handler.
 * Always returns a consistent { success, message, errors? } shape.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  if (statusCode === 500) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
};
