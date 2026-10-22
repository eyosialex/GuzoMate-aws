import express, { Request, Response } from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'guzomate-backend',
    timestamp: new Date().toISOString()
  });
});
