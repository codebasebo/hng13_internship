import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseBuilder } from '../types/response.types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  correlationId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json(
        ResponseBuilder.error('Unauthorized', 'No token provided')
      );
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json(
      ResponseBuilder.error('Unauthorized', 'Invalid or expired token')
    );
  }
};
