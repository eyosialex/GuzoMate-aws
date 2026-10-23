import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './config/database.js';

export const app = express();

app.use(cors());
app.use(express.json());

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
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      service: 'guzomate-backend',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Example 1: Insert a new place into PostgreSQL with coordinates
app.post('/api/v1/places', async (req: Request, res: Response) => {
  const { name, category, lat, lon, address, osmType, osmId } = req.body;

  if (!name || !category || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'name, category, lat, and lon are required.' });
  }

  try {
    // ST_SetSRID(ST_MakePoint(lon, lat), 4326): Note PostGIS uses (Longitude, Latitude) order!
    const query = `
      INSERT INTO places (name, category, address, osm_type, osm_id, location)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography)
      RETURNING id, name, category, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon, created_at;
    `;
    const result = await pool.query(query, [name, category, address || null, osmType || null, osmId || null, lon, lat]);
    res.status(201).json({ place: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Example 2: Query nearby places sorted by distance in meters using PostGIS
app.get('/api/v1/places/nearby', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radiusMeters = parseFloat(req.query.radiusMeters as string) || 3000;
  const category = req.query.category as string;

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
  }

  try {
    let query = `
      SELECT 
        id, 
        name, 
        category, 
        address,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lon,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) as distance_meters
      FROM places
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
    `;
    const params: any[] = [lon, lat, radiusMeters];

    if (category) {
      params.push(category);
      query += ` AND category = $4`;
    }

    query += ` ORDER BY distance_meters ASC LIMIT 50;`;

    const result = await pool.query(query, params);
    res.json({ count: result.rows.length, items: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
