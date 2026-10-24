import React from 'react';
import { PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { IncidentCard } from './IncidentCard';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { useIncidents } from '../../hooks/useIncidents';
import { useI18n } from '../../hooks/useI18n';
import { useAppStore } from '../../features/useAppStore';

export const IncidentsList: React.FC = () => {
  const { t } = useI18n();
  const { incidents, isLoading, refresh, confirmIncident } = useIncidents();
  const openIncidentModal = useAppStore((state) => state.openIncidentModal);
  const selectedIncident = useAppStore((state) => state.selectedIncident);
  const setSelectedIncident = useAppStore((state) => state.setSelectedIncident);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">
            {t('incidents.title')}
          </h2>
          <span className="text-xs font-medium text-gray-500">
            {incidents.length} active reports in Addis
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            aria-label="Refresh incident feed"
            icon={<RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={refresh}
            variant="outline"
            shape="rounded"
            className="h-11 w-11"
          />
          <Button
            variant="primary"
            onClick={() => openIncidentModal()}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="rounded-xl min-h-[44px]"
          >
            {t('incidents.reportNew')}
          </Button>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-pulse h-28" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <AlertCircle className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No road incidents reported in your area.</p>
            <p className="text-xs text-gray-400 mt-1">Streets are flowing smoothly.</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
              onSelect={setSelectedIncident}
              onConfirm={(id) => confirmIncident(id, 'STILL_PRESENT')}
            />
          ))
        )}
      </div>
    </div>
  );
};
