import { useState, useCallback, useEffect, useRef } from 'react';
import { RouteOption, RouteTravelMode, GeoLocation } from '../types';
import { routesService } from '../services/routesService';
import { useAppStore } from '../features/useAppStore';

const DEFAULT_DESTINATION: GeoLocation = {
  lat: 9.0340, // Piazza St George
  lon: 38.7510,
};

export function useRoutes() {
  const userLocation = useAppStore((state) => state.userLocation);
  const userLocationName = useAppStore((state) => state.userLocationName);
  const language = useAppStore((state) => state.language);
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRouteInStore = useAppStore((state) => state.setSelectedRoute);

  const destinationLocationFromStore = useAppStore((state) => state.destinationLocation);
  const destinationNameFromStore = useAppStore((state) => state.destinationName);
  const setDestinationInStore = useAppStore((state) => state.setDestination);
  const isPickingDestination = useAppStore((state) => state.isPickingDestination);
  const startPickingDestination = useAppStore((state) => state.startPickingDestination);

  const [origin, setOrigin] = useState<GeoLocation>(userLocation);
  const [destination, setDestination] = useState<GeoLocation>(destinationLocationFromStore || DEFAULT_DESTINATION);
  const [destinationName, setDestinationName] = useState(destinationNameFromStore || 'Piazza St George, Addis Ababa');
  const [travelMode, setTravelMode] = useState<RouteTravelMode>('transit');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitations, setLimitations] = useState<string[]>([]);

  // Request race-condition counter
  const requestIdRef = useRef(0);

  // Sync origin when userLocation in store changes
  useEffect(() => {
    setOrigin(userLocation);
  }, [userLocation.lat, userLocation.lon]);

  // Sync destination when updated from store (e.g. via map picker or search)
  useEffect(() => {
    if (destinationLocationFromStore) {
      setDestination(destinationLocationFromStore);
    }
    if (destinationNameFromStore) {
      setDestinationName(destinationNameFromStore);
    }
  }, [destinationLocationFromStore, destinationNameFromStore]);

  const calculateRoute = useCallback(async () => {
    // 1. Validate coordinates
    if (
      !origin ||
      typeof origin.lat !== 'number' ||
      typeof origin.lon !== 'number' ||
      !isFinite(origin.lat) ||
      !isFinite(origin.lon)
    ) {
      setError('Origin GPS coordinates are not yet available. Please enable location.');
      return;
    }

    if (
      !destination ||
      typeof destination.lat !== 'number' ||
      typeof destination.lon !== 'number' ||
      !isFinite(destination.lat) ||
      !isFinite(destination.lon)
    ) {
      setError('Please select or specify a valid destination on the map.');
      return;
    }

    if (
      origin.lat < -90 || origin.lat > 90 || origin.lon < -180 || origin.lon > 180 ||
      destination.lat < -90 || destination.lat > 90 || destination.lon < -180 || destination.lon > 180
    ) {
      setError('Coordinates out of range. Please choose a location within the map.');
      return;
    }

    const currentReqId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    setLimitations([]);

    try {
      const res = await routesService.getRoutes({
        originLat: origin.lat,
        originLon: origin.lon,
        destinationLat: destination.lat,
        destinationLon: destination.lon,
        mode: travelMode,
        language,
      });

      // Guard against older slow requests overwriting newer results
      if (currentReqId !== requestIdRef.current) return;

      setRoutes(res.routes);
      setLimitations(res.limitations || []);

      if (res.routes.length > 0) {
        setSelectedRouteInStore(res.routes[0]);
      } else {
        setSelectedRouteInStore(null);
        if (res.limitations && res.limitations.length > 0) {
          setError(res.limitations[0]);
        } else {
          setError(
            travelMode === 'transit'
              ? 'No direct municipal transit or LRT corridor found between these points. Try Driving or Walking mode.'
              : 'No route could be calculated between these coordinates.'
          );
        }
      }
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      const msg = err instanceof Error ? err.message : 'Route calculation service is currently unavailable.';
      setError(msg);
      setRoutes([]);
      setSelectedRouteInStore(null);
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [origin, destination, travelMode, language, setSelectedRouteInStore]);

  // Recalculate route whenever travel mode or destination changes
  useEffect(() => {
    calculateRoute();
  }, [travelMode, destination.lat, destination.lon, calculateRoute]);

  const updateDestination = (loc: GeoLocation, name?: string) => {
    setDestination(loc);
    if (name) setDestinationName(name);
    setDestinationInStore(loc, name);
  };

  return {
    routes,
    selectedRoute,
    setSelectedRoute: setSelectedRouteInStore,
    travelMode,
    setTravelMode,
    origin,
    originName: userLocationName,
    setOrigin,
    destination,
    setDestination: updateDestination,
    destinationName,
    setDestinationName,
    isLoading,
    error,
    limitations,
    calculateRoute,
    isPickingDestination,
    startPickingDestination,
  };
}
