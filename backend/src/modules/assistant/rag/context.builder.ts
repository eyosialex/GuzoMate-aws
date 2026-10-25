import { SupportedLanguage } from '../dto/assistant-query.dto.js';
import { PlaceResultItem, WeatherResultItem, IncidentResultItem } from '../dto/assistant-response.dto.js';

export interface RetrievedKnowledgeDoc {
  title: string | null;
  content: string;
  sourceType: string;
}

export interface EvidenceContextData {
  language: SupportedLanguage;
  location?: { lat: number; lon: number };
  places: PlaceResultItem[];
  weather: WeatherResultItem | null;
  incidents: IncidentResultItem[];
  knowledgeDocs: RetrievedKnowledgeDoc[];
  limitations: string[];
}

export class ContextBuilder {
  /**
   * Compiles retrieved facts, live provider data, and travel knowledge into a compact <EVIDENCE> block.
   */
  public static build(data: EvidenceContextData): string {
    const lines: string[] = ['<EVIDENCE>'];

    // 1. Metadata
    lines.push('[QUERY_METADATA]');
    lines.push(`Requested Language: ${data.language}`);
    lines.push(`Retrieval Timestamp: ${new Date().toISOString()}`);
    if (data.location) {
      lines.push(`Search Coordinates: Lat ${data.location.lat.toFixed(4)}, Lon ${data.location.lon.toFixed(4)}`);
    }
    lines.push('');

    // 2. Mapped Places (OpenStreetMap)
    lines.push('[STRUCTURED_PLACES - Source: OpenStreetMap (© OpenStreetMap contributors)]');
    if (data.places.length === 0) {
      lines.push('No mapped places found within the specified radius.');
    } else {
      data.places.forEach((p, idx) => {
        const tags = Object.keys(p.tags || {}).length > 0 ? JSON.stringify(p.tags) : 'none';
        lines.push(
          `${idx + 1}. Name: "${p.name || 'Unnamed Place'}", Category: "${p.category}", Distance: ${p.distanceMeters}m` +
            (p.address ? `, Address: "${p.address}"` : '') +
            `, Tags: ${tags}`
        );
      });
    }
    lines.push('');

    // 3. Destination Weather (WeatherAPI)
    lines.push('[DESTINATION_WEATHER - Source: WeatherAPI]');
    if (!data.weather) {
      lines.push('Live weather information is currently unavailable.');
    } else {
      if (data.weather.current) {
        lines.push(
          `Current Conditions: ${data.weather.current.condition}, Temp: ${data.weather.current.temperatureC}°C` +
            (data.weather.current.precipitationMm !== null
              ? `, Precipitation: ${data.weather.current.precipitationMm}mm`
              : '') +
            (data.weather.current.windKph !== null ? `, Wind: ${data.weather.current.windKph}km/h` : '')
        );
      }
      if (data.weather.arrivalAdvice) {
        lines.push(`Arrival Time: ${data.weather.arrivalAdvice.arrivalTime}`);
        data.weather.arrivalAdvice.suggestions.forEach((s) => {
          lines.push(`- Advice: ${s.text} (Reason: ${s.reason})`);
        });
      }
    }
    lines.push('');

    // 4. Community Incident Reports (UNVERIFIED)
    lines.push('[ROAD_INCIDENTS - Source: Traveler Reports (UNVERIFIED NOTICE)]');
    if (data.incidents.length === 0) {
      lines.push('No active road incidents reported nearby.');
    } else {
      data.incidents.forEach((inc, idx) => {
        lines.push(
          `${idx + 1}. [UNVERIFIED] Type: "${inc.type}", Status: "${inc.status}", Verification: "${inc.verification}", Distance: ${inc.distanceMeters}m, Description: "${inc.description}", Reported: "${inc.createdAt}"`
        );
      });
    }
    lines.push('');

    // 5. Curated Travel Knowledge (pgvector)
    lines.push('[CURATED_TRAVEL_KNOWLEDGE - Source: GuzoMate Knowledge Base]');
    if (data.knowledgeDocs.length === 0) {
      lines.push('No specific travel guide entries retrieved.');
    } else {
      data.knowledgeDocs.forEach((doc, idx) => {
        lines.push(`${idx + 1}. [${doc.title || doc.sourceType}]: ${doc.content}`);
      });
    }
    lines.push('');

    // 6. Explicit Limitations
    if (data.limitations.length > 0) {
      lines.push('[KNOWN_LIMITATIONS]');
      data.limitations.forEach((lim) => lines.push(`- ${lim}`));
      lines.push('');
    }

    lines.push('</EVIDENCE>');

    return lines.join('\n');
  }
}
