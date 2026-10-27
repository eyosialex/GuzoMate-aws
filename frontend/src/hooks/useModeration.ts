import { useState, useEffect, useCallback } from 'react';
import { moderationService } from '../services/moderationService';
import {
  ModerationIncidentItem,
  ListModerationIncidentsQuery,
  UpdateIncidentStatusPayload,
  AuditLogEntry,
} from '../types/moderation';
import { useAppStore } from '../features/useAppStore';

export function useModeration(initialQuery?: ListModerationIncidentsQuery) {
  const currentUser = useAppStore((state) => state.currentUser);
  const isStaff = currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN';

  const [incidents, setIncidents] = useState<ModerationIncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(
    async (queryOverride?: ListModerationIncidentsQuery) => {
      if (!isStaff) {
        setIncidents([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await moderationService.listIncidents({
          ...initialQuery,
          ...queryOverride,
        });
        setIncidents(res.items);
      } catch (err: unknown) {
        console.warn('Failed to fetch moderation queue', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch moderation incidents');
      } finally {
        setIsLoading(false);
      }
    },
    [isStaff, initialQuery]
  );

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const updateIncidentStatus = useCallback(
    async (
      id: string,
      payload: UpdateIncidentStatusPayload
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const updated = await moderationService.updateStatus(id, payload);
        // Optimistically update incident in list
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === id
              ? {
                  ...inc,
                  status: updated.status,
                  verification: updated.verification,
                  updatedAt: updated.updatedAt,
                }
              : inc
          )
        );
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Status update failed';
        return { success: false, error: msg };
      }
    },
    []
  );

  const getIncidentHistory = useCallback(async (id: string): Promise<AuditLogEntry[]> => {
    try {
      const res = await moderationService.getIncidentHistory(id);
      return res.history;
    } catch (err) {
      console.warn('Failed to fetch incident audit history', err);
      return [];
    }
  }, []);

  return {
    incidents,
    isLoading,
    error,
    refresh: fetchIncidents,
    updateIncidentStatus,
    getIncidentHistory,
    isStaff,
  };
}
