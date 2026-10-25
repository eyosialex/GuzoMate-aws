import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/app-error.js';
import { ErrorCode } from '../shared/errors/error-codes.js';
import { sendError } from '../shared/utils/response.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // 1. Handled Domain AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError ${err.code}] ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        stack: err.stack,
      });
    } else {
      logger.warn(`[ClientError ${err.code}] ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        details: err.details,
      });
    }

    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(
      res,
      'Request validation failed',
      400,
      ErrorCode.VALIDATION_ERROR,
      issues
    );
  }

  // 3. Payload Too Large (Express Body Parser)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return sendError(
      res,
      'Request payload exceeds size limit',
      413,
      ErrorCode.PAYLOAD_TOO_LARGE
    );
  }

  // 4. Body Parser / JSON Syntax Error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return sendError(
      res,
      'Malformed JSON payload in request body',
      400,
      ErrorCode.BAD_REQUEST
    );
  }

  // 3. Unhandled Server Error
  logger.error(`[UnhandledError] ${err.message || err}`, {
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    stack: err.stack,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal server error';

  return sendError(res, message, 500, ErrorCode.INTERNAL_SERVER_ERROR);
}
