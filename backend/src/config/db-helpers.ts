import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './database.js';

/**
 * Reusable SQL fragment helper for PostGIS geographic Point construction (SRID 4326).
 * PostGIS accepts (longitude, latitude) coordinate order.
 */
export function sqlPostgisPoint(longitude: number, latitude: number): Prisma.Sql {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
}

/**
 * Reusable SQL condition helper for ST_DWithin radius filtering in meters.
 */
export function sqlDWithinMeters(
  columnSql: Prisma.Sql,
  longitude: number,
  latitude: number,
  radiusMeters: number
): Prisma.Sql {
  return Prisma.sql`ST_DWithin(${columnSql}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${radiusMeters})`;
}

/**
 * Reusable SQL expression for calculating geodesic distance in meters.
 */
export function sqlDistanceMeters(
  columnSql: Prisma.Sql,
  longitude: number,
  latitude: number
): Prisma.Sql {
  return Prisma.sql`ROUND(ST_Distance(${columnSql}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography)::numeric, 1)`;
}

/**
 * Reusable SQL expression for pgvector cosine distance:
 * Cosine similarity = 1 - (embedding <=> query_vector::vector)
 */
export function sqlVectorCosineSimilarity(
  columnSql: Prisma.Sql,
  embeddingVector: number[]
): Prisma.Sql {
  const vectorStr = `[${embeddingVector.join(',')}]`;
  return Prisma.sql`1 - (${columnSql} <=> ${vectorStr}::vector)`;
}

/**
 * Executes a callback within a managed Prisma database transaction.
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx);
  });
}

/**
 * Performs a health and extension verification check on the database.
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  dbTime?: Date;
  postgisVersion?: string;
  hasPgVector?: boolean;
  error?: string;
}> {
  try {
    const result = await prisma.$queryRaw<
      Array<{
        now: Date;
        postgis: string | null;
        has_vector: boolean;
      }>
    >`
      SELECT 
        NOW() AS now,
        (SELECT extversion FROM pg_extension WHERE extname = 'postgis') AS postgis,
        EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') AS has_vector;
    `;

    const row = result[0];
    return {
      connected: true,
      dbTime: row?.now,
      postgisVersion: row?.postgis ?? undefined,
      hasPgVector: row?.has_vector ?? false,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error?.message ?? String(error),
    };
  }
}
