import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bookmark, MapPin, Navigation } from 'lucide-react';
import { Place } from '../../types';
import { Badge } from '../common/Badge';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
  onSelect?: (place: Place) => void;
  onToggleSave?: (placeId: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected = false,
  onSelect,
  onToggleSave,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const formatDistance = (meters: number | null) => {
    if (meters === null || meters === undefined) return null;
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const distanceText = formatDistance(place.distanceMeters);

  return (
    <motion.div
      variants={cardEnter}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
      exit={shouldReduceMotion ? undefined : 'exit'}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : tactilePress.card}
      transition={springGentle}
      onClick={() => onSelect?.(place)}
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:border-blue-600/40 ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20'
          : 'border-[rgba(32,34,31,0.12)]'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(place);
        }
      }}
      aria-label={`${place.name}, ${place.category}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="primary" size="sm" className="bg-blue-50 text-blue-700 border-blue-200/60 font-mono uppercase text-[10px]">
              {place.category}
            </Badge>
            {distanceText && (
              <span className="text-xs font-semibold text-stone-500 inline-flex items-center gap-1 leading-none font-mono">
                <Navigation className="w-3 h-3 text-blue-600" />
                {distanceText}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-stone-900 truncate tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
            {place.name}
          </h3>

          {place.address && (
            <p className="text-xs font-medium text-stone-500 truncate mt-1 flex items-center gap-1 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              {place.address}
            </p>
          )}
        </div>

        {/* Lucid Save bookmark button with tactile spring feedback */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(place.id);
          }}
          className="shrink-0"
        >
          <motion.button
            type="button"
            aria-label={place.isSaved ? 'Unsave place' : 'Save place'}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
            transition={springTactile}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              place.isSaved
                ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-xs'
                : 'bg-white text-stone-400 hover:text-stone-700 hover:bg-stone-50 border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 shadow-xs'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                place.isSaved ? 'fill-amber-500 text-amber-500' : 'text-stone-400'
              }`}
            />
          </motion.button>
        </div>
      </div>

      {/* OSM Attribution micro-label */}
      <div className="mt-3 pt-2.5 border-t border-[rgba(32,34,31,0.08)] flex items-center justify-between text-[11px] text-stone-400 font-mono leading-none">
        <span>OSM: {place.osm?.type || 'node'}/{place.osm?.id}</span>
        <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
          View on map <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </motion.div>
  );
};
