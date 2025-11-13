import { Request, Response, NextFunction } from 'express';
import { ResponseBuilder } from '../types/response.types';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${message}`, err.stack);

  res.status(statusCode).json(
    ResponseBuilder.error(
      err.name || 'Error',
      message
    )
  );
};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
