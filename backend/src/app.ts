import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './config/database.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Main API routes connecting all modules (assistant, places, travel-services, incidents)
app.use('/api/v1', apiRouter);

// Health check with DB status
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as now, postgis_version() as postgis');
    res.json({
      status: 'ok',
      service: 'guzomate-backend',
      database: 'connected',
      dbTime: dbResult.rows[0].now,
      postgisVersion: dbResult.rows[0].postgis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      service: 'guzomate-backend',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Global error handler
app.use(errorHandler);
