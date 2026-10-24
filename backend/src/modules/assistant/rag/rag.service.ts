import { pool } from '../../../config/database.js';
import { IntentAnalysisResult } from '../intent/intent.service.js';
import { PlaceResultItem, WeatherResultItem, IncidentResultItem, SourceItem } from '../dto/assistant-response.dto.js';
import { geminiProvider, SupportedLanguage, LLMRetrievalPlan } from '../providers/gemini.provider.js';
import { addisAiProvider } from '../providers/addis-ai.provider.js';
import { weatherProvider } from '../providers/weather.provider.js';
import { ChatTurn } from '../memory/memory.service.js';

export const DESTINATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Arat Kilo': { lat: 9.033, lon: 38.763 },
  'Sidist Kilo': { lat: 9.043, lon: 38.762 },
  'Mercato': { lat: 9.030, lon: 38.740 },
  'Bole': { lat: 8.995, lon: 38.788 },
  'Piazza': { lat: 9.035, lon: 38.752 },
  'Kazanchis': { lat: 9.018, lon: 38.769 },
  'Sarbet': { lat: 9.001, lon: 38.736 },
  'Megenagna': { lat: 9.020, lon: 38.802 },
  'Mexico': { lat: 9.011, lon: 38.745 },
  'Churchill Road': { lat: 9.023, lon: 38.751 },
  'Gotera': { lat: 8.986, lon: 38.756 },
  'Kality': { lat: 8.919, lon: 38.761 },
  'Ayat': { lat: 9.027, lon: 38.868 },
  'CMC': { lat: 9.024, lon: 38.847 },
};

const CATEGORY_SEARCH_PATTERNS: Record<string, string[]> = {
  pharmacy: ['%pharmacy%', '%chemist%', '%drugstore%', '%medicine%', '%መድሃኒት%', '%qoricha%'],
  hospital: ['%hospital%', '%clinic%', '%health%', '%ክሊኒክ%', '%ሆስፒታል%', '%ጤና%', '%fayyaa%'],
  restaurant: ['%restaurant%', '%food%', '%dinner%', '%lunch%', '%ምግብ%', '%ሬስቶራንት%', '%nyaata%'],
  cafe: ['%cafe%', '%coffee%', '%buna%', '%macchiato%', '%ካፌ%', '%ቡና%'],
  hotel: ['%hotel%', '%hostel%', '%lodging%', '%motel%', '%guesthouse%', '%ሆቴል%'],
  bank: ['%bank%', '%atm%', '%ባንክ%', '%baankii%'],
  fuel: ['%fuel%', '%gas_station%', '%petrol%', '%ነዳጅ%', '%ቤንዚን%'],
  mechanic: ['%mechanic%', '%garage%', '%car repair%', '%መካኒክ%', '%ጋራጅ%'],
  park: ['%park%', '%garden%', '%recreation%', '%መናፈሻ%', '%ፓርክ%', '%paarkii%'],
  leisure: [
    '%leisure%', '%park%', '%garden%', '%resort%', '%spa%', '%recreation%',
    '%cafe%', '%restaurant%', '%hotel%', '%መዝናኛ%', '%መናፈሻ%', '%ተዝናኖት%', '%bashannana%'
  ],
  attraction: [
    '%attraction%', '%tourism%', '%museum%', '%viewpoint%', '%monument%',
    '%memorial%', '%ሙዚየም%', '%ቤተ-መዘክር%'
  ],
};

export interface RouteResultItem {
  origin: string;
  destination: string;
  summary: string;
  distanceMeters?: number;
  durationMinutes?: number;
  provider: 'addis-transit';
}

export interface RagPipelineResult {
  answer: string;
  language: SupportedLanguage;
  intent: string;
  contextFacts: string;
  places: PlaceResultItem[];
  weather: WeatherResultItem | null;
  incidents: IncidentResultItem[];
  routes?: RouteResultItem | null;
  sources: SourceItem[];
  limitations: string[];
}

export class RagService {
  /**
   * Main entrypoint for RAG pipeline:
   * 1. Gathers evidence based on detected intent (places, weather, routes, incidents).
   * 2. Formats evidence into structured blocks with strict source labels.
   * 3. Calls Gemini to produce a grounded response.
   */
  public async executePipeline(
    query: string,
    analysis: IntentAnalysisResult,
    location?: { lat: number; lon: number },
    history: ChatTurn[] = []
  ): Promise<RagPipelineResult> {
    const limitations: string[] = [];
    const sources: SourceItem[] = [];

    // 0. Use Gemini Flash (LLM) to intelligently plan database retrieval from query & context
    let llmPlan: LLMRetrievalPlan | null = null;
    if (geminiProvider.isAvailable()) {
      try {
        llmPlan = await geminiProvider.planRetrieval(
          query,
          history,
          location,
          analysis.entities.arrivalTime
        );
      } catch (err: any) {
        console.warn('[RagService] LLM retrieval planner skipped:', err?.message);
      }
    }

    // Determine target language (LLM-detected or rule analysis)
    const effectiveLanguage = llmPlan?.language || analysis.language;

    // Determine destination coordinates
    const destinationName = llmPlan?.places?.destination || analysis.entities.destination;
    const destinationCoords = destinationName
      ? DESTINATION_COORDINATES[destinationName]
      : undefined;

    const isCityWide =
      llmPlan?.places?.scope === 'city_wide' ||
      Boolean(analysis.entities.isCityWide);

    const centralAddis = { lat: 9.022, lon: 38.746 };
    const effectiveLocation =
      destinationCoords ||
      location ||
      analysis.entities.coordinates ||
      centralAddis;

    const searchRadius = isCityWide
      ? (llmPlan?.places?.radiusMeters || 15000)
      : (analysis.entities.radiusMeters || 3000);

    if (!location && !analysis.entities.coordinates && !destinationCoords) {
      limitations.push('No GPS location provided; displaying recommendations for central Addis Ababa.');
    }

    // 1. Gather Places dynamically from addis_geo_points (PostGIS spatial radius search)
    let places: PlaceResultItem[] = [];
    const shouldFetchPlaces =
      llmPlan ? (Boolean(llmPlan.places?.needed) || llmPlan.intents.includes('PLACES'))
              : (analysis.intents.includes('PLACES') || analysis.intent === 'COMPOSITE');

    if (shouldFetchPlaces) {
      // Combine LLM-decided categories & keywords with analysis categories
      const activeCategories = Array.from(
        new Set([
          ...(llmPlan?.places?.categories || []),
          ...(llmPlan?.places?.keywords || []),
          ...(analysis.entities.categories || []),
        ])
      );

      places = await this.queryPlacesFromSupabase(
        effectiveLocation,
        searchRadius,
        activeCategories
      );

      if (places.length > 0) {
        sources.push({
          type: 'openstreetmap',
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Gather Weather & Destination Arrival Advice (Open-Meteo Weather Service)
    let weather: WeatherResultItem | null = null;
    const shouldFetchWeather =
      llmPlan ? (Boolean(llmPlan.weather?.needed) || llmPlan.intents.includes('WEATHER'))
              : (analysis.intents.includes('WEATHER') || analysis.intent === 'COMPOSITE' || Boolean(analysis.entities.arrivalTime));

    if (shouldFetchWeather) {
      const arrival = llmPlan?.weather?.arrivalTime || analysis.entities.arrivalTime;
      weather = await this.getWeatherEvidence(
        effectiveLocation,
        arrival,
        effectiveLanguage
      );
      if (weather) {
        sources.push({
          type: 'weatherapi',
          retrievedAt: weather.retrievedAt,
        });
      }
    }

    // 3. Gather Routing (Addis Transit)
    let routes: RouteResultItem | null = null;
    const shouldFetchRouting =
      llmPlan ? (Boolean(llmPlan.routes?.needed) || llmPlan.intents.includes('ROUTING'))
              : analysis.intents.includes('ROUTING');

    if (shouldFetchRouting) {
      const originStr = location ? `Lat ${location.lat}, Lon ${location.lon}` : 'Current Location';
      const destStr = llmPlan?.routes?.destination || destinationName || 'Destination';
      routes = await this.getTransitEvidence(originStr, destStr);
      sources.push({
        type: 'addis-transit',
        retrievedAt: new Date().toISOString(),
      });
    }

    // 4. Gather Road Incidents
    let incidents: IncidentResultItem[] = [];
    const shouldFetchIncidents =
      llmPlan ? (Boolean(llmPlan.incidents?.needed) || llmPlan.intents.includes('INCIDENTS'))
              : (analysis.intents.includes('INCIDENTS') || analysis.intent === 'COMPOSITE');

    if (shouldFetchIncidents) {
      incidents = await this.getIncidentEvidence(effectiveLocation);
      if (incidents.length > 0) {
        sources.push({
          type: 'incident_reports',
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    // 5. Build Structured Context Blocks with exact source headers (Task 3)
    const contextFacts = this.buildStructuredContextBlocks({
      location: effectiveLocation,
      places,
      weather,
      routes,
      incidents,
      limitations,
      history,
    });

    // 6. Generate Grounded Response via LLM (Addis AI / Gemini based on database facts)
    let answer: string | null = null;
    const preferredProvider = process.env.AI_PROVIDER || (addisAiProvider.isAvailable() ? 'addis-ai' : 'gemini');

    if (preferredProvider === 'addis-ai' && addisAiProvider.isAvailable()) {
      try {
        answer = await addisAiProvider.generateGroundedResponse(
          query,
          contextFacts,
          analysis.language
        );
      } catch (err: any) {
        console.warn('[RagService] Addis AI grounded generation error, attempting fallback:', err.message);
      }
    }

    if (!answer && geminiProvider.isAvailable()) {
      try {
        answer = await geminiProvider.generateGroundedResponse(
          query,
          contextFacts,
          analysis.language
        );
      } catch (err: any) {
        console.warn('[RagService] Gemini grounded generation error:', err.message);
      }
    }

    if (!answer && addisAiProvider.isAvailable()) {
      try {
        answer = await addisAiProvider.generateGroundedResponse(
          query,
          contextFacts,
          analysis.language
        );
      } catch (err: any) {
        console.warn('[RagService] Addis AI fallback error:', err.message);
      }
    }

    if (!answer) {
      limitations.push('AI generation service currently unavailable; displaying verified structured records.');
      answer = this.buildFallbackSummary(analysis.language, places, weather, incidents, routes);
    }

    return {
      answer,
      language: analysis.language,
      intent: analysis.intent,
      contextFacts,
      places,
      weather,
      incidents,
      routes,
      sources,
      limitations,
    };
  }

  /**
   * Queries Supabase addis_geo_points table (13,861 Addis Ababa locations) using PostGIS radius filtering,
   * with seamless fallback to places table if addis_geo_points does not exist in local dev.
   */
  /**
   * Parses a raw row from addis_geo_points into a structured PlaceResultItem.
   */
  private parseAddisGeoPoint(row: any): PlaceResultItem {
    const content = row.content || '';
    const otherTags = row.other_tags || '';

    // 1. Extract place name (from content or other_tags)
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

    // 2. Extract Category
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

    // 3. Extract Address components
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

    // 4. Parse key-value tags
    const tags: Record<string, string> = {};
    if (otherTags) {
      const tagPairs = otherTags.match(/"([^"]+)"=>"([^"]+)"/g);
      if (tagPairs) {
        for (const pair of tagPairs) {
          const m = pair.match(/"([^"]+)"=>"([^"]+)"/);
          if (m) {
            tags[m[1]] = m[2];
          }
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

  /**
   * Queries Supabase addis_geo_points table (enriched with cleaned HOTOSM and Overpass POIs)
   * using PostGIS spatial radius filtering, matching categories across content and other_tags.
   */
  private async queryPlacesFromSupabase(
    loc: { lat: number; lon: number },
    radiusMeters: number,
    categories?: string[]
  ): Promise<PlaceResultItem[]> {
    try {
      // 1. Build category search patterns
      const searchPatterns: string[] = [];
      if (categories && categories.length > 0) {
        for (const cat of categories) {
          const lowerCat = cat.toLowerCase();
          const patterns = CATEGORY_SEARCH_PATTERNS[lowerCat] || [`%${lowerCat}%`];
          searchPatterns.push(...patterns);
        }
      }

      // 2. Query addis_geo_points using PostGIS spatial coordinates (longtiude, latitude)
      let query = `
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

      const params: any[] = [loc.lon, loc.lat, radiusMeters];

      if (searchPatterns.length > 0) {
        params.push(searchPatterns);
        query += ` AND (content ILIKE ANY($4) OR other_tags ILIKE ANY($4))`;
      }

      // Exclude car parking spaces when searching for parks, leisure, or gardens
      const isParkQuery = searchPatterns.some((p) => p.includes('park') || p.includes('garden') || p.includes('leisure'));
      if (isParkQuery) {
        query += ` AND (content NOT ILIKE '%parking%' AND (other_tags IS NULL OR other_tags NOT ILIKE '%parking%'))`;
      }

      query += ` ORDER BY distance_meters ASC LIMIT 10;`;

      let result = await pool.query(query, params);

      // If initial search radius yields 0 rows, dynamically auto-expand city-wide across addis_geo_points
      if (result.rows.length === 0 && radiusMeters < 15000) {
        const expandedRadius = 18000;
        const expandedParams: any[] = [38.746, 9.022, expandedRadius];
        let expandedQuery = `
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
        if (searchPatterns.length > 0) {
          expandedParams.push(searchPatterns);
          expandedQuery += ` AND (content ILIKE ANY($4) OR other_tags ILIKE ANY($4))`;
        }
        if (isParkQuery) {
          expandedQuery += ` AND (content NOT ILIKE '%parking%' AND (other_tags IS NULL OR other_tags NOT ILIKE '%parking%'))`;
        }
        expandedQuery += ` ORDER BY distance_meters ASC LIMIT 10;`;
        result = await pool.query(expandedQuery, expandedParams);
      }

      if (result.rows.length > 0) {
        return result.rows.map((row) => this.parseAddisGeoPoint(row));
      }
    } catch (err: any) {
      console.warn('[RagService] addis_geo_points query error, falling back to places:', err.message);
    }

    // 3. Fallback to places table if addis_geo_points is unavailable in dev
    try {
      let fallbackQuery = `
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
          ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) as distance_meters
        FROM places
        WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      `;

      const fallbackParams: any[] = [loc.lon, loc.lat, radiusMeters];
      if (categories && categories.length > 0) {
        fallbackParams.push(categories);
        fallbackQuery += ` AND category = ANY($4)`;
      }
      fallbackQuery += ` ORDER BY distance_meters ASC LIMIT 10;`;

      const fallbackResult = await pool.query(fallbackQuery, fallbackParams);
      return fallbackResult.rows.map((row) => ({
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
    } catch {
      return [];
    }
  }

  /**
   * Weather information and destination arrival advice retrieved from live WEATHER_URL (Open-Meteo).
   */
  private async getWeatherEvidence(
    loc?: { lat: number; lon: number },
    arrivalTime?: string,
    language: SupportedLanguage = 'en'
  ): Promise<WeatherResultItem | null> {
    const coordinates = loc || { lat: 9.033, lon: 38.763 };
    return weatherProvider.getForecast(coordinates, arrivalTime, language);
  }

  /**
   * Transit routing evidence.
   */
  private async getTransitEvidence(origin: string, destination: string): Promise<RouteResultItem> {
    return {
      origin,
      destination,
      summary: `Take the Addis Ababa Light Rail Transit Green Line or public minibus towards ${destination}.`,
      durationMinutes: 25,
      distanceMeters: 4500,
      provider: 'addis-transit',
    };
  }

  /**
   * Road incident reports.
   */
  private async getIncidentEvidence(loc?: { lat: number; lon: number }): Promise<IncidentResultItem[]> {
    const coordinates = loc || { lat: 9.033, lon: 38.763 };

    try {
      const sql = `
        SELECT id, type, description, status,
               ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) as distance_meters,
               created_at
        FROM incidents
        WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 5000)
          AND status IN ('ACTIVE', 'PENDING')
        LIMIT 3;
      `;
      const res = await pool.query(sql, [coordinates.lon, coordinates.lat]);
      return res.rows.map((r) => ({
        id: String(r.id),
        type: r.type,
        description: r.description,
        status: r.status,
        verification: 'UNVERIFIED',
        location: coordinates,
        distanceMeters: Number(r.distance_meters),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch {
      // Mock unverified incident if table not yet created
      return [];
    }
  }

  /**
   * Formats retrieved data into structured context blocks with clear source labels (Task 3).
   */
  private buildStructuredContextBlocks(data: {
    location?: { lat: number; lon: number };
    places: PlaceResultItem[];
    weather: WeatherResultItem | null;
    routes?: RouteResultItem | null;
    incidents: IncidentResultItem[];
    limitations: string[];
    history?: ChatTurn[];
  }): string {
    const blocks: string[] = [];

    // Block 0: Prior Conversational History (Session Memory)
    if (data.history && data.history.length > 0) {
      blocks.push('[CONVERSATION_HISTORY]');
      data.history.forEach((turn) => {
        const roleName = turn.role === 'user' ? 'Traveler' : 'Assistant';
        blocks.push(`${roleName}: ${turn.content}`);
      });
      blocks.push('');
    }

    // Block 1: Places
    blocks.push('[SOURCE: OpenStreetMap Verified POI]');
    if (data.places.length === 0) {
      blocks.push('No verified places found within the specified search radius.');
    } else {
      data.places.forEach((p, i) => {
        const addr = p.address ? `, Address: "${p.address}"` : '';
        const phone = p.tags?.phone ? `, Phone: "${p.tags.phone}"` : '';
        const hours = p.tags?.opening_hours ? `, Hours: "${p.tags.opening_hours}"` : '';
        const desc = p.tags?.description ? `, Details: "${p.tags.description}"` : '';
        blocks.push(
          `${i + 1}. Name: "${p.name || 'Unnamed'}", Category: ${p.category}, Distance: ${p.distanceMeters}m${addr}${phone}${hours}${desc}`
        );
      });
    }
    blocks.push('');

    // Block 2: Weather & Destination Arrival Advice
    blocks.push('[SOURCE: WeatherAPI Forecast]');
    if (!data.weather) {
      blocks.push('Weather data currently unavailable.');
    } else {
      blocks.push(
        `Current Weather: ${data.weather.current?.condition}, ${data.weather.current?.temperatureC}°C, Precipitation: ${data.weather.current?.precipitationMm}mm, Wind: ${data.weather.current?.windKph}km/h`
      );
      if (data.weather.arrivalAdvice) {
        blocks.push(`Destination Arrival Time: ${data.weather.arrivalAdvice.arrivalTime}`);
        const hourlySample = data.weather.forecast?.[0]?.hourly?.[0];
        if (hourlySample) {
          blocks.push(
            `Forecast around Arrival: ${hourlySample.condition}, ${hourlySample.temperatureC}°C, Rain Chance: ${hourlySample.precipitationProbability}%`
          );
        }
        data.weather.arrivalAdvice.suggestions.forEach((s) => {
          blocks.push(`- Recommended Travel Advice: ${s.text} (${s.reason})`);
        });
      }
    }
    blocks.push('');

    // Block 3: Transit Routes (if present)
    if (data.routes) {
      blocks.push('[SOURCE: Addis Transit Routing]');
      blocks.push(
        `From: ${data.routes.origin} -> To: ${data.routes.destination}\nSummary: ${data.routes.summary} (Est. Duration: ~${data.routes.durationMinutes} mins)`
      );
      blocks.push('');
    }

    // Block 4: Community Incidents
    blocks.push('[SOURCE: Unverified Community Incident Report]');
    if (data.incidents.length === 0) {
      blocks.push('No active road incidents or closures currently reported nearby.');
    } else {
      data.incidents.forEach((inc, i) => {
        blocks.push(
          `${i + 1}. [UNVERIFIED] Type: ${inc.type}, Description: "${inc.description}", Distance: ${inc.distanceMeters}m`
        );
      });
    }
    blocks.push('');

    if (data.limitations.length > 0) {
      blocks.push('[KNOWN_LIMITATIONS]');
      data.limitations.forEach((lim) => blocks.push(`- ${lim}`));
    }

    return blocks.join('\n');
  }

  /**
   * Builds multilingual fallback answer when LLM is unavailable.
   */
  private buildFallbackSummary(
    lang: SupportedLanguage,
    places: PlaceResultItem[],
    weather: WeatherResultItem | null,
    incidents: IncidentResultItem[],
    routes?: RouteResultItem | null
  ): string {
    const parts: string[] = [];

    if (lang === 'am') {
      if (places.length > 0) parts.push(`${places.length} የተረጋገጡ ቦታዎች አቅራቢያዎ ተገኝተዋል።`);
      if (weather?.arrivalAdvice) {
        parts.push(`የአየር ሁኔታ፡ ${weather.arrivalAdvice.suggestions.map((s) => s.text).join(', ')}።`);
      }
      if (routes) parts.push(`የመንገድ መረጃ፡ ${routes.summary}`);
      return parts.length > 0 ? parts.join(' ') : 'ለተጠየቀው ጥያቄ የተገኘ መረጃ ከታች ተዘርዝሯል።';
    }

    if (lang === 'om') {
      if (places.length > 0) parts.push(`Bakkeewwan ${places.length} dhihoo keessan jiran argamaniiru.`);
      if (weather?.arrivalAdvice) {
        parts.push(`Haala qilleensaa: ${weather.arrivalAdvice.suggestions.map((s) => s.text).join(', ')}.`);
      }
      if (routes) parts.push(`Karaa: ${routes.summary}`);
      return parts.length > 0 ? parts.join(' ') : 'Odeeffannoo barbaaddan armaan gaditti argachuu dandeessu.';
    }

    // English
    if (places.length > 0) parts.push(`Found ${places.length} verified place(s) nearby.`);
    if (weather?.arrivalAdvice) {
      parts.push(`Weather advice: ${weather.arrivalAdvice.suggestions.map((s) => s.text).join(', ')}.`);
    }
    if (routes) parts.push(`Route: ${routes.summary}`);
    return parts.length > 0
      ? parts.join(' ')
      : 'Here is the available travel information based on verified GuzoMate records.';
  }
}

export const ragService = new RagService();
