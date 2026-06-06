import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from './auth';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Writes an AuditLog entry for every mutating HTTP request.
 * Fires after the response is sent (non-blocking).
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  res.on('finish', () => {
    const user = (req as AuthenticatedRequest).user;
    const action = `${req.method} ${req.path}`;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';

    AuditLog.create({
      userId: user?.userId,
      action,
      ip,
      userAgent,
      meta: { statusCode: res.statusCode, body: req.body },
    }).catch((err) => console.error('AuditLog write error:', err));
  });

  next();
};
