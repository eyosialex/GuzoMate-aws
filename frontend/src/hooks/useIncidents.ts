import { useState, useEffect, useCallback } from 'react';
import { Incident, IncidentSubmissionPayload } from '../types';
import { incidentsService } from '../services/incidentsService';
import { useAppStore } from '../features/useAppStore';

export function useIncidents() {
  const userLocation = useAppStore((state) => state.userLocation);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await incidentsService.getNearby({
        lat: userLocation.lat,
        lon: userLocation.lon,
        radiusMeters: 10000,
      });
      setIncidents(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch road incidents');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation.lat, userLocation.lon]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const reportIncident = useCallback(
    async (payload: IncidentSubmissionPayload): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        const created = await incidentsService.createIncident(payload);
        setIncidents((prev) => [created, ...prev]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission failed');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const confirmIncident = useCallback(
    async (id: string, type: 'STILL_PRESENT' | 'RESOLVED' | 'INACCURATE') => {
      try {
        await incidentsService.confirmIncident(id, type);
        setIncidents((prev) =>
          prev.map((inc) => {
            if (inc.id === id) {
              return {
                ...inc,
                confirmationsCount: (inc.confirmationsCount || 0) + 1,
                verification: 'COMMUNITY_CONFIRMED',
              };
            }
            return inc;
          })
        );
      } catch {
        // Ignored
      }
    },
    []
  );

  return {
    incidents,
    isLoading,
    isSubmitting,
    error,
    refresh: fetchIncidents,
    reportIncident,
    confirmIncident,
  };
}
