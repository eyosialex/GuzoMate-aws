import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
  });
}
