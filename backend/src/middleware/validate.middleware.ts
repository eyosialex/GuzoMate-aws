import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: err.issues,
          },
        });
      }
      next(err);
    }
  };
}
