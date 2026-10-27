import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  Loader2,
} from 'lucide-react';
import { useModeration } from '../../hooks/useModeration';
import { ModerationIncidentItem } from '../../types/moderation';
import { ModerationActionModal } from './ModerationActionModal';
import { SEVERITY_COLORS } from '../../types/incidents';

export const ModerationQueueTab: React.FC = () => {
  const [filterDisputed, setFilterDisputed] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<ModerationIncidentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { incidents, isLoading, refresh, updateIncidentStatus } = useModeration({
    disputedOnly: filterDisputed,
  });

  const handleOpenReview = (incident: ModerationIncidentItem) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleQuickApprove = async (incident: ModerationIncidentItem) => {
    await updateIncidentStatus(incident.id, {
      status: 'ACTIVE',
      reason: 'Quick verified by staff.',
    });
  };

  const handleQuickResolve = async (incident: ModerationIncidentItem) => {
    await updateIncidentStatus(incident.id, {
      status: 'RESOLVED',
      reason: 'Confirmed hazard resolved by staff.',
    });
  };

  const disputedCount = incidents.filter((i) => i.disputesCount > 0).length;

  return (
    <div className="space-y-4">
      {/* Review Modal */}
      <ModerationActionModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refresh()}
      />

      {/* Filter and Summary Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterDisputed(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              !filterDisputed
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-low text-on-surface hover:bg-surface-high'
            }`}
          >
            All Actionable ({incidents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterDisputed(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterDisputed
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Disputed Only ({disputedCount})
          </button>
        </div>

        <button
          type="button"
          onClick={() => refresh()}
          className="p-1.5 rounded-lg bg-surface-low hover:bg-surface-high text-on-surface-variant transition-colors cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Queue Items */}
      {isLoading && incidents.length === 0 ? (
        <div className="py-8 flex justify-center text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant/60 space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="font-bold text-on-surface text-xs">Review Queue Clear</p>
          <p className="text-[11px] max-w-xs mx-auto">
            All crowdsourced reports in Addis Ababa are currently verified and active.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {incidents.map((inc) => {
            const severityStyle = SEVERITY_COLORS[inc.severity || 'MEDIUM'];
            const isHeavilyDisputed = inc.disputesCount >= 3;

            return (
              <div
                key={inc.id}
                className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                  isHeavilyDisputed
                    ? 'bg-rose-50/50 border-rose-300'
                    : 'bg-surface-low border-outline-variant/30 hover:border-outline-variant/60'
                }`}
              >
                {/* Header: Badges & Dispute count */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[10px]">
                      {inc.type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 rounded text-stone-600">
                      {inc.status}
                    </span>
                  </div>

                  {inc.disputesCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{inc.disputesCount} disputes</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-on-surface font-medium leading-relaxed">
                  {inc.description}
                </p>

                {/* Actions Row */}
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[11px] text-ash">
                    👍 {inc.confirmationsCount} | 👎 {inc.disputesCount}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inc.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(inc)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Verify Active</span>
                      </button>
                    )}

                    {inc.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleQuickResolve(inc)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Resolved</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenReview(inc)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-outline-variant/40 hover:bg-surface-high text-on-surface font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Review & Actions...
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
