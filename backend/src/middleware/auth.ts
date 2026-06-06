import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback_secret';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing authorization token' });
    return;
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload & AuthenticatedUser;

    if (!decoded.userId) {
      res.status(401).json({ success: false, message: 'Invalid authorization token' });
      return;
    }

    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      role: decoded.role || 'VOTER',
      email: decoded.email,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };

// Convenience alias
export const requireAdmin = authorize('ADMIN');
