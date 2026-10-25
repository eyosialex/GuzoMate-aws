import 'dotenv/config';
import dns from 'node:dns';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Use public DNS nameservers to avoid intermittent corporate resolver timeouts
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback to system default
}

let connectionString =
  process.env.DATABASE_URL ||
  'postgresql://guzomate:guzomate_dev_password@localhost:5432/guzomate';

if (!connectionString.includes('connection_limit=')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'connection_limit=1';
}

const directConnectionString = process.env.DIRECT_URL || connectionString;

// -----------------------------------------------------------------------------
// Legacy / Direct pg Pool
// Preserved for backwards compatibility with raw-query endpoints in app.ts
// -----------------------------------------------------------------------------
export const pool = new Pool({
  connectionString: directConnectionString,
  max: 3,
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
    datasourceUrl: connectionString,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
