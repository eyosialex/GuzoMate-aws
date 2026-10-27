import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Incident } from '../../types';
import { 
  SEVERITY_COLORS, 
  SEVERITY_LABELS, 
  INCIDENT_TYPE_LABELS,
  formatDistance 
} from '../../types/incidents';
import { VoteResult } from '../../types/confirmations';
import { IncidentVoteButtons } from './IncidentVoteButtons';
import { useI18n } from '../../hooks/useI18n';
import { springGentle, tactilePress, cardEnter } from '../../lib/motion';

export interface IncidentCardProps {
  incident: Incident;
  isSelected?: boolean;
  onSelect?: (incident: Incident) => void;
  onVoteSuccess?: (result: VoteResult) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  isSelected = false,
  onSelect,
  onVoteSuccess,
}) => {
  const { language } = useI18n();
  const shouldReduceMotion = useReducedMotion();

  const formattedDistance = formatDistance(incident.distanceMeters);

  const langKey = (language === 'am' || language === 'om' ? language : 'en') as 'en' | 'am' | 'om';
  const typeLabel = INCIDENT_TYPE_LABELS[incident.type]?.[langKey] || incident.type.replace(/_/g, ' ');

  const displayLocation =
    incident.locationName ||
    `${incident.location.lat.toFixed(4)}, ${incident.location.lon.toFixed(4)}`;

  const severityStyle = SEVERITY_COLORS[incident.severity || 'MEDIUM'];
  const severityLabel = SEVERITY_LABELS[incident.severity || 'MEDIUM']?.[langKey] || 'Medium';

  return (
    <motion.div
      variants={cardEnter}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
      exit={shouldReduceMotion ? undefined : 'exit'}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : tactilePress.card}
      transition={springGentle}
      onClick={() => onSelect?.(incident)}
      className={`group bg-white rounded-2xl p-4 border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:border-primary/40 ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
          : 'border-outline-variant/40'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(incident);
        }
      }}
    >
      {/* Header: Category, Severity Badge and Distance */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full leading-none">
            {typeLabel}
          </span>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}>
            {severityLabel}
          </span>

          {incident.verification === 'COMMUNITY_CONFIRMED' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Confirmed</span>
            </span>
          )}

          {incident.verification === 'MODERATOR_VERIFIED' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {formattedDistance && (
          <span className="text-[11px] font-semibold text-on-surface-variant/70 shrink-0 leading-none">
            {formattedDistance} away
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs font-medium text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
        {incident.description}
      </p>

      {/* Location Landmark */}
      <div className="mt-2.5 flex items-center gap-1.5 font-bold text-primary leading-none text-xs truncate">
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate">{displayLocation}</span>
      </div>

      {/* Community Consensus Voting Section */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <IncidentVoteButtons
          incident={incident}
          onVoteSuccess={onVoteSuccess}
          size="sm"
        />

        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant/60 font-medium ml-auto">
          <Clock className="w-3 h-3 text-on-surface-variant/50" />
          <span>{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </motion.div>
  );
};
