import { osrmProvider, IOsrmProvider } from './osrm.provider.js';
import {
  findNearestLrtStation,
  calculateLrtFare,
  calculateDistanceMeters,
} from './addis-transit.data.js';
import { IncidentsRepository } from '../../incidents/incidents.repository.js';
import {
  RouteCoordinates,
  RouteIncidentAlert,
  RouteOption,
  RoutesResponse,
  RoutingMode,
  TransitFeedStatus,
} from './routing.types.js';
import { logger } from '../../../config/logger.js';

export class RoutingService {
  constructor(private provider: IOsrmProvider = osrmProvider) {}

  public async calculateRoutes(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    mode: RoutingMode = 'driving',
    language: 'en' | 'am' | 'om' = 'en',
    includeIncidents = true
  ): Promise<RoutesResponse> {
    const limitations: string[] = [];
    const routes: RouteOption[] = [];

    // 1. Geographic validation check (Greater Ethiopia bounding box: Lat 3-15, Lon 33-48)
    const isInEthiopia =
      origin.lat >= 3 &&
      origin.lat <= 15 &&
      origin.lon >= 33 &&
      origin.lon <= 48 &&
      destination.lat >= 3 &&
      destination.lat <= 15 &&
      destination.lon >= 33 &&
      destination.lon <= 48;

    if (!isInEthiopia) {
      limitations.push('Requested coordinates are outside the primary Ethiopia coverage region.');
    }

    // 2. Fetch Driving Route if requested
    if (mode === 'driving' || mode === 'all') {
      try {
        const drivingRoute = await this.provider.getRoute(origin, destination, 'driving', language);
        routes.push(drivingRoute);
      } catch (err: any) {
        logger.warn('[RoutingService] Driving route failed', { error: err.message });
        limitations.push('Driving road navigation route could not be calculated.');
      }
    }

    // 3. Fetch Walking Route if requested
    if (mode === 'walking' || mode === 'all') {
      try {
        const walkingRoute = await this.provider.getRoute(origin, destination, 'walking', language);
        routes.push(walkingRoute);
      } catch (err: any) {
        logger.warn('[RoutingService] Walking route failed', { error: err.message });
        limitations.push('Pedestrian walking route could not be calculated.');
      }
    }

    // 4. Public Transit Evaluation (Addis Ababa Light Rail & Municipal Bus Investigation)
    if (mode === 'transit' || mode === 'all') {
      const transitOption = this.evaluateAddisTransit(origin, destination, language);
      if (transitOption) {
        routes.push(transitOption);
      } else {
        limitations.push(
          'Live GTFS schedule feeds for Anbessa and Sheger buses are not published publicly; no direct LRT station corridor within walking distance.'
        );
      }
    }

    // 5. Member 4 Integration: Query road incidents along the route
    if (includeIncidents && routes.length > 0) {
      try {
        const alerts = await this.findIncidentsNearRoute(origin, destination);
        for (const r of routes) {
          if (r.mode === 'driving') {
            r.incidentAlerts = alerts;
          }
        }
      } catch (err: any) {
        logger.warn('[RoutingService] Incident alerts query non-fatal failure', { error: err.message });
      }
    }

    const transitStatus: TransitFeedStatus = {
      liveTrackingAvailable: false,
      gtfsRealtimeAvailable: false,
      notice:
        'Live dynamic GPS vehicle tracking for Addis Ababa municipal buses (Anbessa, Sheger) is currently unavailable. Light Rail Transit (LRT) operates at standard 10–20 minute intervals between 06:00 and 22:00.',
      coveredOperators: [
        'Addis Ababa Light Rail Transit (AALRT)',
        'Anbessa City Bus Enterprise (Static network)',
        'Sheger Express Bus (Key corridors)',
      ],
    };

    return {
      provider: 'addis-transit',
      origin,
      destination,
      mode,
      routes,
      transitStatus,
      limitations,
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates proximity to Addis Ababa Light Rail Transit stations.
   * If both origin and destination are near LRT stations, constructs a verified corridor itinerary.
   */
  private evaluateAddisTransit(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    language: 'en' | 'am' | 'om'
  ): RouteOption | null {
    const originStation = findNearestLrtStation(origin.lat, origin.lon, 1500);
    const destStation = findNearestLrtStation(destination.lat, destination.lon, 1500);

    if (!originStation || !destStation || originStation.station.name === destStation.station.name) {
      return null;
    }

    const oStation = originStation.station;
    const dStation = destStation.station;
    const isSameLine =
      oStation.line === dStation.line ||
      oStation.line === 'COMMON' ||
      dStation.line === 'COMMON';

    // Approximate stations count from physical distance (~750m between stations in Addis LRT)
    const trackDistanceMeters = calculateDistanceMeters(
      oStation.lat,
      oStation.lon,
      dStation.lat,
      dStation.lon
    );
    const estimatedStationCount = Math.max(2, Math.round(trackDistanceMeters / 750));
    const fareEtb = calculateLrtFare(estimatedStationCount);

    // Speed: ~20 km/h average including station dwells (~2.5 min per station)
    const trainDurationSec = estimatedStationCount * 150;
    const walkDurationSec = Math.round(
      (originStation.distanceMeters + destStation.distanceMeters) / 1.2
    );
    const totalDurationSec = trainDurationSec + walkDurationSec + (isSameLine ? 0 : 300); // 5 min transfer
    const totalDistanceMeters =
      trackDistanceMeters + originStation.distanceMeters + destStation.distanceMeters;

    const summaryText =
      language === 'am'
        ? `የአዲስ አበባ ቀላል ባቡር (LRT): ከ${oStation.nameAm} ወደ ${dStation.nameAm} (${Math.round(totalDurationSec / 60)} ደቂቃ፣ ${fareEtb} ብር)`
        : language === 'om'
        ? `Baabura Salphaa Finfinnee (LRT): ${oStation.name} irraa gara ${dStation.name} (${Math.round(totalDurationSec / 60)} daqiiqaa, ${fareEtb} ETB)`
        : `Addis LRT: from ${oStation.name} to ${dStation.name} (~${Math.round(totalDurationSec / 60)} min, ${fareEtb} ETB)`;

    const transferStationName = isSameLine ? undefined : 'Stadium / Mexico';

    return {
      id: `transit-lrt-${Date.now()}`,
      mode: 'transit',
      summary: summaryText,
      durationSeconds: totalDurationSec,
      durationMinutes: Math.round(totalDurationSec / 60),
      distanceMeters: totalDistanceMeters,
      fareEtb,
      fareExplanation: `Official AALRT tariff: ${fareEtb} ETB for ~${estimatedStationCount} stations.`,
      transitStops: [
        `Board at: ${oStation.name} Station (${originStation.distanceMeters}m walk from origin)`,
        ...(transferStationName ? [`Transfer at: ${transferStationName}`] : []),
        `Alight at: ${dStation.name} Station (${destStation.distanceMeters}m walk to destination)`,
      ],
      transfersCount: isSameLine ? 0 : 1,
      legs: [
        {
          distanceMeters: totalDistanceMeters,
          durationSeconds: totalDurationSec,
          summary: `LRT corridor between ${oStation.name} and ${dStation.name}`,
          steps: [
            {
              name: `Walk to ${oStation.name} Station`,
              distanceMeters: originStation.distanceMeters,
              durationSeconds: Math.round(originStation.distanceMeters / 1.2),
              maneuver: {
                type: 'depart',
                instruction: `Walk ${originStation.distanceMeters}m to ${oStation.name} LRT Station`,
                location: [origin.lon, origin.lat],
              },
            },
            {
              name: `LRT Train towards ${dStation.name}`,
              distanceMeters: trackDistanceMeters,
              durationSeconds: trainDurationSec,
              maneuver: {
                type: 'board',
                instruction: `Take LRT from ${oStation.name} to ${dStation.name}`,
                location: [oStation.lon, oStation.lat],
              },
            },
            {
              name: `Walk to destination from ${dStation.name}`,
              distanceMeters: destStation.distanceMeters,
              durationSeconds: Math.round(destStation.distanceMeters / 1.2),
              maneuver: {
                type: 'arrive',
                instruction: `Walk ${destStation.distanceMeters}m to destination`,
                location: [dStation.lon, dStation.lat],
              },
            },
          ],
        },
      ],
      source: 'addis-transit-static',
      sourceUpdatedAt: new Date().toISOString(),
      isLiveSchedule: false,
    };
  }

  /**
   * Queries Member 4's road incidents near origin, midpoint, and destination.
   */
  private async findIncidentsNearRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates
  ): Promise<RouteIncidentAlert[]> {
    const midLat = (origin.lat + destination.lat) / 2;
    const midLon = (origin.lon + destination.lon) / 2;

    const checkPoints = [
      { lat: origin.lat, lon: origin.lon },
      { lat: midLat, lon: midLon },
      { lat: destination.lat, lon: destination.lon },
    ];

    const alertsMap = new Map<string, RouteIncidentAlert>();

    for (const pt of checkPoints) {
      try {
        const { items } = await IncidentsRepository.findNearby({
          lat: pt.lat,
          lon: pt.lon,
          radius: 1000, // 1km search radius around key route points
          limit: 5,
          page: 1,
        });

        for (const item of items) {
          if (!alertsMap.has(item.id)) {
            alertsMap.set(item.id, {
              incidentId: item.id,
              type: item.type,
              description: item.description,
              severity: item.severity,
              location: {
                lat: item.latitude,
                lon: item.longitude,
              },
              distanceMeters: Number(item.distance_meters),
            });
          }
        }
      } catch {
        // Best-effort incident alert fetch
      }
    }

    return Array.from(alertsMap.values());
  }

  /**
   * Compatibility method for Member 2's AI assistant.
   */
  public async getRoutes(origin: string, destination: string): Promise<any[]> {
    const [oLat, oLon] = origin.split(',').map((s) => parseFloat(s.trim()));
    const [dLat, dLon] = destination.split(',').map((s) => parseFloat(s.trim()));

    if (isNaN(oLat) || isNaN(oLon) || isNaN(dLat) || isNaN(dLon)) {
      return [];
    }

    const res = await this.calculateRoutes({ lat: oLat, lon: oLon }, { lat: dLat, lon: dLon }, 'all');
    return res.routes;
  }
}

export const routingService = new RoutingService();
