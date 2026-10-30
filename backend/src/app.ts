import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './config/database.js';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import authRoutes from './modules/auth/auth.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { apiLimiter } from './middleware/rate-limit.middleware.js';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter);

// -----------------------------------------------------------------------------
// Category search mappings for addis_geo_points
// -----------------------------------------------------------------------------
const CATEGORY_PATTERNS: Record<string, string[]> = {
  cafe: ['%cafe%', '%coffee%', '%pastry%', '%buna%'],
  restaurant: ['%restaurant%', '%fast_food%', '%food%', '%eatery%'],
  hotel: ['%hotel%', '%hostel%', '%guest_house%', '%motel%'],
  hospital: ['%hospital%', '%clinic%', '%doctors%', '%healthcare%'],
  pharmacy: ['%pharmacy%', '%chemist%'],
  bank: ['%bank%', '%atm%'],
  fuel: ['%fuel%', '%gas_station%', '%petrol%'],
  mechanic: ['%mechanic%', '%car_repair%', '%tyres%'],
};

function parseAddisGeoPointRow(row: any) {
  const content = row.content || '';
  const otherTags = row.other_tags || '';

  // Extract place name
  let name: string | null = null;
  const nameMatch =
    content.match(/Place name:\s*([^\n]+)/i) ||
    content.match(/English name:\s*([^\n]+)/i) ||
    content.match(/Amharic name:\s*([^\n]+)/i);

  if (nameMatch && nameMatch[1]?.trim()) {
    name = nameMatch[1].trim();
  } else {
    const tagMatch = otherTags.match(/"name"=>"([^"]+)"/);
    if (tagMatch && tagMatch[1]?.trim()) {
      name = tagMatch[1].trim();
    }
  }

  // Extract Category
  let category = 'place';
  const catMatch = content.match(/(?:Amenity|Healthcare|Tourism|Shop|Highway|Leisure):\s*([^\n]+)/i);
  if (catMatch && catMatch[1]?.trim()) {
    category = catMatch[1].trim().toLowerCase();
  } else {
    const tagCatMatch = otherTags.match(/"(amenity|healthcare|tourism|shop|leisure)"=>"([^"]+)"/);
    if (tagCatMatch && tagCatMatch[2]?.trim()) {
      category = tagCatMatch[2].trim().toLowerCase();
    }
  }

  // Extract Address
  let address: string | null = null;
  const addrDesc = otherTags.match(/"addr:description"=>"([^"]+)"/);
  const addrStreet = otherTags.match(/"addr:street"=>"([^"]+)"/);
  const addrSubcity = otherTags.match(/"addr:subcity"=>"([^"]+)"/);
  const addrCity = otherTags.match(/"addr:city"=>"([^"]+)"/);
  const addrParts = [
    addrDesc ? addrDesc[1] : null,
    addrStreet ? addrStreet[1] : null,
    addrSubcity ? `${addrSubcity[1]} Subcity` : null,
    addrCity ? addrCity[1] : null,
  ].filter(Boolean);

  if (addrParts.length > 0) {
    address = addrParts.join(', ');
  }

  // Key-value tags
  const tags: Record<string, string> = {};
  if (otherTags) {
    const tagPairs = otherTags.match(/"([^"]+)"=>"([^"]+)"/g);
    if (tagPairs) {
      for (const pair of tagPairs) {
        const m = pair.match(/"([^"]+)"=>"([^"]+)"/);
        if (m) tags[m[1]] = m[2];
      }
    }
  }

  return {
    id: String(row.id),
    name: name || 'Local Point of Interest',
    category,
    location: {
      lat: Number(row.latitude),
      lon: Number(row.longtiude),
    },
    distanceMeters: Number(row.distance_meters),
    address,
    tags,
    source: 'openstreetmap',
    osm: {
      type: 'node',
      id: String(row.id),
    },
  };
}

// -----------------------------------------------------------------------------
// Health check endpoint
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// GET /api/v1/places/nearby — Queries all 13,861 places from addis_geo_points
// -----------------------------------------------------------------------------
app.get('/api/v1/places/nearby', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radiusMeters = parseFloat((req.query.radiusMeters || req.query.radius) as string) || 5000;
  const category = (req.query.category as string || '').toLowerCase();
  const queryText = (req.query.query as string || '').trim().toLowerCase();
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Valid lat and lon query parameters are required.' }
    });
  }

  try {
    let sql = `
      SELECT 
        id, 
        latitude, 
        longtiude, 
        content, 
        other_tags,
        ROUND(ST_Distance(
          ST_SetSRID(ST_MakePoint(longtiude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        )::numeric, 1) as distance_meters
      FROM addis_geo_points
      WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint(longtiude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    const params: any[] = [lon, lat, radiusMeters];
    let paramIndex = 4;

    if (category && category !== 'all') {
      const patterns = CATEGORY_PATTERNS[category] || [`%${category}%`];
      const categoryClauses = patterns.map((p) => {
        params.push(p);
        return `(content ILIKE $${paramIndex++} OR other_tags ILIKE $${paramIndex - 1})`;
      });
      sql += ` AND (${categoryClauses.join(' OR ')})`;
    }

    if (queryText) {
      params.push(`%${queryText}%`);
      sql += ` AND (content ILIKE $${paramIndex} OR other_tags ILIKE $${paramIndex})`;
      paramIndex++;
    }

    sql += ` ORDER BY distance_meters ASC LIMIT $${paramIndex};`;
    params.push(limit);

    const result = await pool.query(sql, params);
    const items = result.rows.map(parseAddisGeoPointRow);

    return res.status(200).json({
      items,
      count: items.length,
      nextCursor: null,
      attribution: '© OpenStreetMap contributors',
    });
  } catch (err: any) {
    console.error('[/places/nearby Error]', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message }
    });
  }
});

// Single place detail endpoint
app.get('/api/v1/places/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, latitude, longtiude, content, other_tags, 0 as distance_meters
       FROM addis_geo_points
       WHERE id::text = $1
       LIMIT 1;`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Place not found' } });
    }

    return res.status(200).json(parseAddisGeoPointRow(result.rows[0]));
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// GuzoMate Complete API Routes
// -----------------------------------------------------------------------------
app.use('/auth', authRoutes);
app.use('/api/v1', apiRoutes);

// Root health redirect
app.get('/', (_req, res) => {
  res.redirect('/api/v1/health');
});

// -----------------------------------------------------------------------------
// Error & 404 Handlers
// -----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);
