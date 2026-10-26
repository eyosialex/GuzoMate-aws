import React from 'react';
import { PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { IncidentCard } from './IncidentCard';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { useIncidents } from '../../hooks/useIncidents';
import { useAppStore } from '../../features/useAppStore';

interface IncidentsListProps {
  onGoToSubmit?: () => void;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({ onGoToSubmit }) => {
  const { incidents, isLoading, refresh } = useIncidents();
  const selectedIncident = useAppStore((state) => state.selectedIncident);
  const setSelectedIncident = useAppStore((state) => state.setSelectedIncident);

  return (
    <div className="flex flex-col h-full bg-surface-low/30 overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-outline-variant/30 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-on-surface tracking-tight leading-tight">
            Road Incidents
          </h2>
          <span className="text-xs font-medium text-on-surface-variant">
            {incidents.length} verified reports in Addis Ababa
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            aria-label="Refresh incident feed"
            icon={<RefreshCw className={`w-4 h-4 text-on-surface-variant ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={refresh}
            variant="outline"
            shape="rounded"
            className="h-10 w-10"
          />
          {onGoToSubmit && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGoToSubmit}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="rounded-xl min-h-[40px]"
            >
              Report
            </Button>
          )}
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-4 border border-outline-variant/30 animate-pulse h-28"
              />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-on-surface-variant/50">
            <AlertCircle className="w-10 h-10 mb-3 text-primary/30" />
            <p className="text-sm font-semibold text-on-surface">No road incidents reported.</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">Traffic across Addis corridors is flowing smoothly.</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
              onSelect={setSelectedIncident}
            />
          ))
        )}
      </div>
    </div>
  );
};
