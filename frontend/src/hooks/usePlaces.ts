import { useState, useEffect, useCallback, useMemo } from 'react';
import { Place, PlaceCategory } from '../types';
import { placesService } from '../services/placesService';
import { useAppStore } from '../features/useAppStore';

export function usePlaces() {
  const userLocation = useAppStore((state) => state.userLocation);
  const language = useAppStore((state) => state.language);
  const savedPlaceIds = useAppStore((state) => state.savedPlaceIds);
  const toggleSavePlaceInStore = useAppStore((state) => state.toggleSavePlace);

  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<PlaceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await placesService.getNearby({
        lat: userLocation.lat,
        lon: userLocation.lon,
        category: category,
        query: searchQuery,
        radiusMeters: 8000,
        language,
      });
      setPlaces(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch places');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation.lat, userLocation.lon, category, searchQuery, language]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlaces();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPlaces]);

  const placesWithSavedStatus = useMemo(() => {
    return places.map((place) => ({
      ...place,
      isSaved: savedPlaceIds.includes(place.id),
    }));
  }, [places, savedPlaceIds]);

  const toggleSave = useCallback(
    async (placeId: string) => {
      const isCurrentlySaved = savedPlaceIds.includes(placeId);
      toggleSavePlaceInStore(placeId);
      await placesService.toggleSave(placeId, !isCurrentlySaved);
    },
    [savedPlaceIds, toggleSavePlaceInStore]
  );

  return {
    places: placesWithSavedStatus,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    refresh: fetchPlaces,
    toggleSave,
  };
}
