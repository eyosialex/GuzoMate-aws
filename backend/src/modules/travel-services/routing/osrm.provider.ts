import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { ProviderError } from '../../../shared/errors/app-error.js';
import {
  RouteCoordinates,
  RouteLeg,
  RouteOption,
  RouteStep,
} from './routing.types.js';
import { calculateDistanceMeters } from './addis-transit.data.js';

export interface IOsrmProvider {
  getRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    mode: 'driving' | 'walking',
    language?: 'en' | 'am' | 'om'
  ): Promise<RouteOption>;
}

export class OsrmProvider implements IOsrmProvider {
  private baseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = env.OSRM_BASE_URL || 'https://router.project-osrm.org';
    this.timeoutMs = env.ROUTING_REQUEST_TIMEOUT_MS || 10000;
  }

  public async getRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    mode: 'driving' | 'walking' = 'driving',
    language: 'en' | 'am' | 'om' = 'en'
  ): Promise<RouteOption> {
    const profile = mode === 'walking' ? 'foot' : 'driving';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    // OSRM coordinate order: {longitude},{latitude}
    const url = `${this.baseUrl}/route/v1/${profile}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`OSRM HTTP error: ${res.status}`);
      }

      const data = (await res.json()) as any;
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No route found between these coordinates');
      }

      const primary = data.routes[0];
      const durationSec = Math.round(primary.duration);
      const distanceMeters = Math.round(primary.distance);

      const legs: RouteLeg[] = (primary.legs || []).map((leg: any) => ({
        distanceMeters: Math.round(leg.distance),
        durationSeconds: Math.round(leg.duration),
        summary: leg.summary || '',
        steps: (leg.steps || []).map((step: any): RouteStep => ({
          name: step.name || (mode === 'walking' ? 'Pedestrian Path' : 'Road'),
          durationSeconds: Math.round(step.duration),
          distanceMeters: Math.round(step.distance),
          maneuver: {
            type: step.maneuver?.type || 'turn',
            modifier: step.maneuver?.modifier,
            instruction: this.formatInstruction(step.maneuver, step.name, mode, language),
            location: step.maneuver?.location || [origin.lon, origin.lat],
          },
        })),
      }));

      const summaryText =
        mode === 'walking'
          ? language === 'am'
            ? `የእግር ጉዞ መስመር (${(distanceMeters / 1000).toFixed(1)} ኪሜ፣ ~${Math.round(durationSec / 60)} ደቂቃ)`
            : language === 'om'
            ? `Daandii miilaa (${(distanceMeters / 1000).toFixed(1)} km, ~${Math.round(durationSec / 60)} daqiiqaa)`
            : `Walking path (${(distanceMeters / 1000).toFixed(1)} km, ~${Math.round(durationSec / 60)} min)`
          : language === 'am'
          ? `የመኪና መስመር (${(distanceMeters / 1000).toFixed(1)} ኪሜ፣ ~${Math.round(durationSec / 60)} ደቂቃ)`
          : language === 'om'
          ? `Daandii konkolaataa (${(distanceMeters / 1000).toFixed(1)} km, ~${Math.round(durationSec / 60)} daqiiqaa)`
          : `Driving route via ${legs[0]?.summary || 'primary road'} (${(distanceMeters / 1000).toFixed(1)} km, ~${Math.round(durationSec / 60)} min)`;

      return {
        id: `route-${mode}-${Date.now()}`,
        mode,
        summary: summaryText,
        durationSeconds: durationSec,
        durationMinutes: Math.round(durationSec / 60),
        distanceMeters,
        geometry: primary.geometry,
        legs,
        source: 'osrm',
        sourceUpdatedAt: new Date().toISOString(),
        isLiveSchedule: false,
      };
    } catch (err: any) {
      clearTimeout(timer);
      logger.warn('[OsrmProvider] OSRM live routing lookup failed, using geometric estimation fallback', {
        error: err.message,
      });

      // Graceful fallback for offline / mock testing: Haversine distance and real metrics
      return this.buildFallbackRoute(origin, destination, mode, language);
    }
  }

  private buildFallbackRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    mode: 'driving' | 'walking',
    language: 'en' | 'am' | 'om'
  ): RouteOption {
    const straightDist = calculateDistanceMeters(origin.lat, origin.lon, destination.lat, destination.lon);
    // Road factor: roads in Addis Ababa are ~1.3x straight-line distance
    const distanceMeters = Math.round(straightDist * 1.3);

    // Average speed in Addis Ababa: driving ~25 km/h (6.9 m/s), walking ~4.5 km/h (1.25 m/s)
    const speedMs = mode === 'walking' ? 1.25 : 6.94;
    const durationSec = Math.round(distanceMeters / speedMs);

    const stepSummary =
      mode === 'walking'
        ? language === 'am'
          ? 'በቀጥታ በእግር ይሂዱ'
          : language === 'om'
          ? 'Miilaan toora qabadhaa deemaa'
          : 'Walk along direct route towards destination'
        : language === 'am'
        ? 'በዋናው መንገድ ይንዱ'
        : language === 'om'
        ? 'Daandii guddaa irra oofa'
        : 'Drive along main arterial corridor towards destination';

    return {
      id: `fallback-${mode}-${Date.now()}`,
      mode,
      summary: `${mode === 'walking' ? 'Walking' : 'Road'} route (${(distanceMeters / 1000).toFixed(1)} km, ~${Math.round(durationSec / 60)} min)`,
      durationSeconds: durationSec,
      durationMinutes: Math.round(durationSec / 60),
      distanceMeters,
      geometry: {
        type: 'LineString',
        coordinates: [
          [origin.lon, origin.lat],
          [destination.lon, destination.lat],
        ],
      },
      legs: [
        {
          distanceMeters,
          durationSeconds: durationSec,
          summary: 'Direct corridor',
          steps: [
            {
              name: mode === 'walking' ? 'Walkway' : 'Main Road',
              distanceMeters,
              durationSeconds: durationSec,
              maneuver: {
                type: 'depart',
                instruction: stepSummary,
                location: [origin.lon, origin.lat],
              },
            },
          ],
        },
      ],
      source: 'osrm',
      sourceUpdatedAt: new Date().toISOString(),
      isLiveSchedule: false,
    };
  }

  private formatInstruction(
    maneuver: any,
    streetName: string,
    mode: 'driving' | 'walking',
    lang: 'en' | 'am' | 'om'
  ): string {
    const type = maneuver?.type || 'turn';
    const modifier = maneuver?.modifier || '';
    const street = streetName || (mode === 'walking' ? 'path' : 'road');

    if (lang === 'am') {
      if (type === 'depart') return `ጉዞዎን በ${street} ይጀምሩ`;
      if (type === 'arrive') return `መድረሻዎ ደርሰዋል`;
      if (modifier.includes('right')) return `ወደ ቀኝ ታጥፈው በ${street} ይቀጥሉ`;
      if (modifier.includes('left')) return `ወደ ግራ ታጥፈው በ${street} ይቀጥሉ`;
      return `በ${street} ቀጥታ ይቀጥሉ`;
    }

    if (lang === 'om') {
      if (type === 'depart') return `Daandii ${street} irra qabadhaa eegalaa`;
      if (type === 'arrive') return `Bakka geessan geessaniittu`;
      if (modifier.includes('right')) return `Gara mirgaatti jalladhaatii ${street} irra deemaa`;
      if (modifier.includes('left')) return `Gara bitaatti jalladhaatii ${street} irra deemaa`;
      return `Qajeeltootti ${street} irra deemaa`;
    }

    if (type === 'depart') return `Head towards ${street}`;
    if (type === 'arrive') return `You have arrived at your destination`;
    if (modifier.includes('right')) return `Turn right onto ${street}`;
    if (modifier.includes('left')) return `Turn left onto ${street}`;
    return `Continue onto ${street}`;
  }
}

export const osrmProvider = new OsrmProvider();
