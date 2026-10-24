import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../shared/errors/app-error.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
