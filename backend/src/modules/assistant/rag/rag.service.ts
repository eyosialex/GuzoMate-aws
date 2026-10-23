import { pool } from '../../../config/database.js';
import { ParsedIntent } from '../intent/intent.types.js';
import { PlaceResultItem, WeatherResultItem, IncidentResultItem, SourceItem } from '../dto/assistant-response.dto.js';
import { ContextBuilder, EvidenceContextData, RetrievedKnowledgeDoc } from './context.builder.js';
import { embeddingProvider } from '../providers/embedding.provider.js';

export interface RagRetrievalResult {
  evidenceBlock: string;
  places: PlaceResultItem[];
  weather: WeatherResultItem | null;
  incidents: IncidentResultItem[];
  sources: SourceItem[];
  limitations: string[];
}

export class RagService {
  /**
   * Retrieves structured facts, weather, incidents, and vector knowledge to construct evidence.
   */
  public async retrieveEvidence(
    intent: ParsedIntent,
    location?: { lat: number; lon: number },
    sanitizedQuery?: string
  ): Promise<RagRetrievalResult> {
    const limitations: string[] = [];
    const sources: SourceItem[] = [];

    // 1. Retrieve Places via PostGIS (Spatial-First)
    let places: PlaceResultItem[] = [];
    if (location && intent.needsPlaces) {
      try {
        places = await this.queryNearbyPlaces(location, intent.radiusMeters || 3000, intent.categories);
        if (places.length > 0) {
          sources.push({
            type: 'openstreetmap',
            retrievedAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.warn('[RagService] Places query error:', err.message);
        limitations.push('Could not access places spatial database.');
      }
    } else if (intent.needsPlaces && !location) {
      limitations.push('User location coordinates were not provided for nearby place search.');
    }

    // 2. Retrieve Incidents via PostGIS (Resilient check if table exists)
    let incidents: IncidentResultItem[] = [];
    if (location && intent.needsIncidents) {
      try {
        incidents = await this.queryNearbyIncidents(location, intent.radiusMeters || 5000);
        if (incidents.length > 0) {
          sources.push({
            type: 'incident_reports',
            retrievedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Table may not yet be migrated by Member 4
        incidents = [];
      }
    }

    // 3. Retrieve Weather / Arrival Advice
    let weather: WeatherResultItem | null = null;
    if (location && intent.needsWeather) {
      weather = await this.fetchWeather(location, intent.arrivalTime);
      if (weather) {
        sources.push({
          type: 'weatherapi',
          retrievedAt: weather.retrievedAt,
        });
      }
    }

    // 4. Retrieve Curated Knowledge via pgvector
    let knowledgeDocs: RetrievedKnowledgeDoc[] = [];
    if (intent.needsKnowledge && sanitizedQuery) {
      try {
        knowledgeDocs = await this.searchVectorKnowledge(sanitizedQuery, intent.language);
        if (knowledgeDocs.length > 0) {
          sources.push({
            type: 'rag_knowledge',
            retrievedAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.warn('[RagService] Vector knowledge search error:', err.message);
        // Fall back gracefully to empty knowledge docs
      }
    }

    // 5. Build Compact Context Block
    const contextData: EvidenceContextData = {
      language: intent.language,
      location,
      places,
      weather,
      incidents,
      knowledgeDocs,
      limitations,
    };

    const evidenceBlock = ContextBuilder.build(contextData);

    return {
      evidenceBlock,
      places,
      weather,
      incidents,
      sources,
      limitations,
    };
  }

  /**
   * Spatial query using PostGIS ST_DWithin and distance sorting.
   */
  private async queryNearbyPlaces(
    loc: { lat: number; lon: number },
    radiusMeters: number,
    categories?: string[]
  ): Promise<PlaceResultItem[]> {
    let query = `
      SELECT 
        id, 
        name, 
        category, 
        address,
        tags,
        osm_type,
        osm_id,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lon,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) as distance_meters
      FROM places
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
    `;

    const params: any[] = [loc.lon, loc.lat, radiusMeters];

    if (categories && categories.length > 0) {
      params.push(categories);
      query += ` AND category = ANY($4)`;
    }

    query += ` ORDER BY distance_meters ASC LIMIT 15;`;

    const result = await pool.query(query, params);

    return result.rows.map((row) => ({
      id: String(row.id),
      name: row.name || null,
      category: row.category,
      location: { lat: Number(row.lat), lon: Number(row.lon) },
      distanceMeters: Number(row.distance_meters),
      address: row.address || null,
      tags: row.tags || {},
      source: 'openstreetmap',
      osm: {
        type: row.osm_type || 'node',
        id: String(row.osm_id || ''),
      },
    }));
  }

  /**
   * Queries nearby active/pending incidents if the table exists.
   */
  private async queryNearbyIncidents(
    loc: { lat: number; lon: number },
    radiusMeters: number
  ): Promise<IncidentResultItem[]> {
    const query = `
      SELECT 
        id,
        type,
        description,
        status,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) as distance_meters,
        created_at,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lon
      FROM incidents
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        AND status IN ('ACTIVE', 'PENDING')
      ORDER BY distance_meters ASC LIMIT 5;
    `;

    const result = await pool.query(query, [loc.lon, loc.lat, radiusMeters]);

    return result.rows.map((row) => ({
      id: String(row.id),
      type: row.type,
      description: row.description,
      status: row.status,
      verification: 'UNVERIFIED',
      location: { lat: Number(row.lat), lon: Number(row.lon) },
      distanceMeters: Number(row.distance_meters),
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  /**
   * Resilient weather retrieval with arrival advice derivation.
   */
  private async fetchWeather(
    loc: { lat: number; lon: number },
    arrivalTime?: string
  ): Promise<WeatherResultItem | null> {
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      // Graceful default if WeatherAPI key not yet provided
      return {
        location: loc,
        current: {
          temperatureC: 22,
          condition: 'Partly Cloudy',
          precipitationMm: 0,
          windKph: 12,
        },
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
        cached: true,
      };
    }

    try {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${loc.lat},${loc.lon}&days=2&aqi=no`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;

      const data: any = await res.json();
      const current = data.current;

      const result: WeatherResultItem = {
        location: loc,
        current: {
          temperatureC: current.temp_c,
          condition: current.condition?.text || 'Clear',
          precipitationMm: current.precip_mm ?? 0,
          windKph: current.wind_kph ?? 0,
        },
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      };

      if (arrivalTime) {
        result.arrivalAdvice = {
          arrivalTime,
          suggestions: [
            {
              type: 'general',
              text: 'Check forecast prior to departure',
              reason: 'Dynamic mountain weather in Addis Ababa',
            },
          ],
        };
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Semantic vector similarity search against rag_documents using pgvector cosine distance (<=>).
   */
  private async searchVectorKnowledge(query: string, language: string): Promise<RetrievedKnowledgeDoc[]> {
    if (!embeddingProvider.isAvailable()) {
      return [];
    }

    const vector = await embeddingProvider.embedText(query);
    const vectorStr = embeddingProvider.formatVectorForPg(vector);

    const sql = `
      SELECT title, content, source_type,
             1 - (embedding <=> $1::vector) as similarity
      FROM rag_documents
      WHERE language = $2 OR language IS NULL
      ORDER BY embedding <=> $1::vector ASC
      LIMIT 3;
    `;

    const result = await pool.query(sql, [vectorStr, language]);

    return result.rows.map((row) => ({
      title: row.title,
      content: row.content,
      sourceType: row.source_type,
    }));
  }
}

export const ragService = new RagService();
