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

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & AuthenticatedUser;

    if (!decoded.userId) {
      res.status(401).json({ error: 'Invalid authorization token' });
      return;
    }

    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      role: decoded.role || 'VOTER',
      email: decoded.email,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  if (user.role === 'VOTER') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};