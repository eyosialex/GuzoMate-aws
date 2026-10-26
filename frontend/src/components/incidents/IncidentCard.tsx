import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';
import { Incident } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { springGentle, tactilePress, cardEnter } from '../../lib/motion';

export interface IncidentCardProps {
  incident: Incident;
  isSelected?: boolean;
  onSelect?: (incident: Incident) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  isSelected = false,
  onSelect,
}) => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();

  const formattedDistance = incident.distanceMeters
    ? incident.distanceMeters < 1000
      ? `${incident.distanceMeters}m away`
      : `${(incident.distanceMeters / 1000).toFixed(1)}km away`
    : null;

  const displayTitle =
    incident.title ||
    t(`incidents.types.${incident.type}`) ||
    incident.type.replace('_', ' ');

  const displayLocation =
    incident.locationName ||
    `${incident.location.lat.toFixed(4)}, ${incident.location.lon.toFixed(4)}`;

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
      {/* Header: Type and Distance (No status badges) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full leading-none">
          {t(`incidents.types.${incident.type}`) || incident.type.replace('_', ' ')}
        </span>

        {formattedDistance && (
          <span className="text-[11px] font-semibold text-on-surface-variant/70 shrink-0 leading-none">
            {formattedDistance}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-on-surface tracking-tight leading-snug group-hover:text-primary transition-colors">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-xs font-medium text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
        {incident.description}
      </p>

      {/* Location Landmark */}
      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-primary leading-none">
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate">{displayLocation}</span>
      </div>

      {/* Footer Timestamp */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant/60 leading-none">
        <div className="flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-on-surface-variant/50" />
          <span>{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <span className="text-primary font-semibold group-hover:underline">View on map →</span>
      </div>
    </motion.div>
  );
};
