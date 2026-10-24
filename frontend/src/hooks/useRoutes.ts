import { useState, useCallback, useEffect } from 'react';
import { RouteOption, RouteTravelMode, GeoLocation } from '../types';
import { routesService } from '../services/routesService';
import { useAppStore } from '../features/useAppStore';

const DEFAULT_DESTINATION: GeoLocation = {
  lat: 9.0340, // Piazza / St George
  lon: 38.7510,
};

export function useRoutes() {
  const userLocation = useAppStore((state) => state.userLocation);
  const language = useAppStore((state) => state.language);
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRouteInStore = useAppStore((state) => state.setSelectedRoute);

  const [origin, setOrigin] = useState<GeoLocation>(userLocation);
  const [destination, setDestination] = useState<GeoLocation>(DEFAULT_DESTINATION);
  const [destinationName, setDestinationName] = useState('Piazza St George');
  const [travelMode, setTravelMode] = useState<RouteTravelMode>('transit');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await routesService.getRoutes({
        originLat: origin.lat,
        originLon: origin.lon,
        destinationLat: destination.lat,
        destinationLon: destination.lon,
        mode: travelMode,
        language,
      });
      setRoutes(res.routes);
      if (res.routes.length > 0) {
        setSelectedRouteInStore(res.routes[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Routing unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, travelMode, language, setSelectedRouteInStore]);

  // Initial calculation
  useEffect(() => {
    calculateRoute();
  }, [travelMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    routes,
    selectedRoute,
    setSelectedRoute: setSelectedRouteInStore,
    travelMode,
    setTravelMode,
    origin,
    setOrigin,
    destination,
    setDestination,
    destinationName,
    setDestinationName,
    isLoading,
    error,
    calculateRoute,
  };
}
