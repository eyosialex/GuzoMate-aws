import { useState, useEffect, useCallback } from 'react';
import { Incident } from '../types';
import { 
  incidentsService, 
  DuplicateIncidentError 
} from '../services/incidentsService';
import { 
  CreateIncidentPayload, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus 
} from '../types/incidents';
import { VoteResult } from '../types/confirmations';
import { useAppStore } from '../features/useAppStore';

export interface UseIncidentsFilter {
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  radius?: number;
}

export function useIncidents(filter?: UseIncidentsFilter) {
  const userLocation = useAppStore((state) => state.userLocation);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await incidentsService.getNearby({
        lat: userLocation.lat,
        lon: userLocation.lon,
        radius: filter?.radius || 5000,
        type: filter?.type,
        severity: filter?.severity,
        status: filter?.status,
        limit: 50,
      });
      setIncidents(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch road incidents');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation.lat, userLocation.lon, filter?.radius, filter?.type, filter?.severity, filter?.status]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const reportIncident = useCallback(
    async (payload: CreateIncidentPayload | any): Promise<{ success: boolean; duplicate?: boolean; error?: string }> => {
      setIsSubmitting(true);
      setError(null);
      setDuplicateWarning(null);
      try {
        const lat = payload.lat !== undefined ? payload.lat : payload.location?.lat;
        const lon = payload.lon !== undefined ? payload.lon : payload.location?.lon;

        const created = await incidentsService.createIncident({
          type: payload.type,
          description: payload.description,
          severity: payload.severity || 'MEDIUM',
          lat,
          lon,
          occurredAt: payload.occurredAt || new Date().toISOString(),
          evidenceUrl: payload.evidenceUrl || undefined,
        });

        setIncidents((prev) => [created, ...prev]);
        return { success: true };
      } catch (err) {
        if (err instanceof DuplicateIncidentError) {
          const msg = err.message || 'A similar incident was recently reported near this location.';
          setDuplicateWarning(msg);
          setError(msg);
          return { success: false, duplicate: true, error: msg };
        }
        const msg = err instanceof Error ? err.message : 'Submission failed';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const handleVoteResult = useCallback((result: VoteResult) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === result.incidentId) {
          return {
            ...inc,
            confirmationsCount: result.confirmationsCount,
            disputesCount: result.disputesCount,
            status: result.status,
            verification: result.verification,
            userVote: result.action,
          };
        }
        return inc;
      })
    );
  }, []);

  const voteOnIncident = useCallback(
    async (id: string, vote: 'CONFIRM' | 'DISPUTE', comment?: string): Promise<boolean> => {
      try {
        const res = await incidentsService.voteOnIncident(id, vote, comment);
        setIncidents((prev) =>
          prev.map((inc) => {
            if (inc.id === id) {
              return {
                ...inc,
                confirmationsCount: res.confirmationsCount ?? (vote === 'CONFIRM' ? (inc.confirmationsCount || 0) + 1 : (inc.confirmationsCount || 0)),
                disputesCount: res.disputesCount ?? (vote === 'DISPUTE' ? (inc.disputesCount || 0) + 1 : (inc.disputesCount || 0)),
                userVote: vote,
                verification: (res.confirmationsCount && res.confirmationsCount >= 3) ? 'COMMUNITY_CONFIRMED' : inc.verification,
              };
            }
            return inc;
          })
        );
        return true;
      } catch (err) {
        console.warn('Incident vote failed', err);
        return false;
      }
    },
    []
  );

  // Backward compatibility alias for existing cards
  const confirmIncident = useCallback(
    async (id: string) => {
      return await voteOnIncident(id, 'CONFIRM');
    },
    [voteOnIncident]
  );

  const removeIncident = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await incidentsService.deleteIncident(id);
        setIncidents((prev) => prev.filter((i) => i.id !== id));
        return true;
      } catch (err) {
        console.warn('Incident delete failed', err);
        return false;
      }
    },
    []
  );

  return {
    incidents,
    isLoading,
    isSubmitting,
    error,
    duplicateWarning,
    refresh: fetchIncidents,
    reportIncident,
    voteOnIncident,
    confirmIncident,
    handleVoteResult,
    removeIncident,
  };
}
