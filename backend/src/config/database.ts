import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://guzomate:guzomate_dev_password@localhost:5432/guzomate';

export const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});
