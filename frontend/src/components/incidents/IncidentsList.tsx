import React, { useState, useMemo } from 'react';
import { PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { IncidentCard } from './IncidentCard';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { useIncidents } from '../../hooks/useIncidents';
import { useAppStore } from '../../features/useAppStore';
import { IncidentType, IncidentSeverity } from '../../types/incidents';

interface IncidentsListProps {
  onGoToSubmit?: () => void;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({ onGoToSubmit }) => {
  const [selectedCategory, setSelectedCategory] = useState<IncidentType | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity | 'ALL'>('ALL');

  const { incidents, isLoading, refresh, handleVoteResult } = useIncidents({
    type: selectedCategory === 'ALL' ? undefined : selectedCategory,
    severity: selectedSeverity === 'ALL' ? undefined : selectedSeverity,
  });

  const selectedIncident = useAppStore((state) => state.selectedIncident);
  const setSelectedIncident = useAppStore((state) => state.setSelectedIncident);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (selectedCategory !== 'ALL' && inc.type !== selectedCategory) return false;
      if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) return false;
      return true;
    });
  }, [incidents, selectedCategory, selectedSeverity]);

  return (
    <div className="flex flex-col h-full bg-[#fbfaf4] overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-[rgba(32,34,31,0.1)] bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-stone-900 tracking-tight leading-tight">
            Road Hazard Alerts
          </h2>
          <span className="text-xs font-medium text-stone-500 font-mono">
            {filteredIncidents.length} active incidents in Addis Ababa
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            aria-label="Refresh incident feed"
            icon={<RefreshCw className={`w-4 h-4 text-stone-600 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />}
            onClick={refresh}
            variant="outline"
            shape="rounded"
            className="h-10 w-10 border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 cursor-pointer"
          />
          {onGoToSubmit && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGoToSubmit}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="rounded-xl min-h-[40px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold cursor-pointer shadow-xs"
            >
              Report
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 py-2 bg-[#f8f7f2]/90 border-b border-[rgba(32,34,31,0.08)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <button
          type="button"
          onClick={() => { setSelectedCategory('ALL'); setSelectedSeverity('ALL'); }}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedCategory === 'ALL' && selectedSeverity === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
              : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 hover:bg-stone-50'
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'ACCIDENT' ? 'ALL' : 'ACCIDENT')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedCategory === 'ACCIDENT'
              ? 'bg-red-600 text-white shadow-xs border border-red-600'
              : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-red-400 hover:bg-stone-50'
          }`}
        >
          Accidents
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'HEAVY_TRAFFIC' ? 'ALL' : 'HEAVY_TRAFFIC')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedCategory === 'HEAVY_TRAFFIC'
              ? 'bg-purple-600 text-white shadow-xs border border-purple-600'
              : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-purple-400 hover:bg-stone-50'
          }`}
        >
          Traffic
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'ROAD_CLOSURE' ? 'ALL' : 'ROAD_CLOSURE')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedCategory === 'ROAD_CLOSURE'
              ? 'bg-amber-600 text-white shadow-xs border border-amber-600'
              : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-amber-400 hover:bg-stone-50'
          }`}
        >
          Closures
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'FLOODING' ? 'ALL' : 'FLOODING')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedCategory === 'FLOODING'
              ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
              : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-blue-400 hover:bg-stone-50'
          }`}
        >
          Flooding
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory(selectedCategory === 'CONSTRUCTION' ? 'ALL' : 'CONSTRUCTION')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedCategory === 'CONSTRUCTION'
              ? 'bg-orange-600 text-white shadow-xs border border-orange-600'
              : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-orange-400 hover:bg-stone-50'
          }`}
        >
          Work
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity(selectedSeverity === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer select-none text-xs ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-red-700 text-white shadow-xs border border-red-700'
              : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
          }`}
        >
          Critical
        </button>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface-low/60 rounded-2xl p-4 border border-outline-variant/30 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-on-surface-variant/50">
            <AlertCircle className="w-10 h-10 mb-3 text-primary/30" />
            <p className="text-sm font-semibold text-on-surface">No road incidents matching filter.</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">Traffic across Addis corridors is currently flowing smoothly.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
              onSelect={setSelectedIncident}
              onVoteSuccess={handleVoteResult}
            />
          ))
        )}
      </div>
    </div>
  );
};
