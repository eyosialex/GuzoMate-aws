<<<<<<< HEAD
=======
import 'dotenv/config';
>>>>>>> feature/db-schema
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://guzomate:guzomate_dev_password@localhost:5432/guzomate';

// -----------------------------------------------------------------------------
// Legacy / Direct pg Pool
// Preserved for backwards compatibility with raw-query endpoints in app.ts
// -----------------------------------------------------------------------------
export const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// -----------------------------------------------------------------------------
// Prisma Client Singleton
// Prevents multiple instances across module imports and HMR in development
// -----------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
