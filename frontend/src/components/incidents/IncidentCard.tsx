import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, ThumbsUp } from 'lucide-react';
import { Incident } from '../../types';
import { Badge } from '../common/Badge';
import { useI18n } from '../../hooks/useI18n';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export interface IncidentCardProps {
  incident: Incident;
  isSelected?: boolean;
  onSelect?: (incident: Incident) => void;
  onConfirm?: (id: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  isSelected = false,
  onSelect,
  onConfirm,
}) => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();

  const getStatusBadge = () => {
    switch (incident.status) {
      case 'PENDING':
        return <Badge variant="pending">{t('incidents.status.PENDING')}</Badge>;
      case 'ACTIVE':
        return <Badge variant="active">{t('incidents.status.ACTIVE')}</Badge>;
      case 'RESOLVED':
        return <Badge variant="resolved">{t('incidents.status.RESOLVED')}</Badge>;
      default:
        return <Badge variant="neutral">{incident.status}</Badge>;
    }
  };

  const formattedDistance = incident.distanceMeters
    ? incident.distanceMeters < 1000
      ? `${incident.distanceMeters}m`
      : `${(incident.distanceMeters / 1000).toFixed(1)}km`
    : null;

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
      className={`group bg-white rounded-2xl p-4 border transition-colors duration-150 cursor-pointer shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/20'
          : 'border-gray-100 hover:border-gray-200'
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
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge()}
          <span className="text-xs font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md leading-none">
            {t(`incidents.types.${incident.type}`)}
          </span>
        </div>

        {formattedDistance && (
          <span className="text-xs font-medium text-gray-400 shrink-0 leading-none">
            {formattedDistance}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-gray-900 line-clamp-2 mt-1 leading-snug">
        {incident.description}
      </p>

      <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5 font-medium leading-none">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <motion.button
          type="button"
          whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
          transition={springTactile}
          onClick={(e) => {
            e.stopPropagation();
            onConfirm?.(incident.id);
          }}
          className="min-h-[44px] px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-none"
          aria-label="Confirm this road condition"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Confirm ({incident.confirmationsCount || 1})</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
