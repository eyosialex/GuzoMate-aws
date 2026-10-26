import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bookmark, MapPin, Navigation } from 'lucide-react';
import { Place } from '../../types';
import { Badge } from '../common/Badge';
import { IconButton } from '../common/IconButton';
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
      className={`group relative bg-white rounded-2xl p-4 border transition-colors duration-150 cursor-pointer shadow-xs hover:shadow-md hover:border-primary/40 ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
          : 'border-outline-variant/40'
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
            <Badge variant="primary" size="sm">
              {place.category}
            </Badge>
            {distanceText && (
              <span className="text-xs font-semibold text-on-surface-variant inline-flex items-center gap-1 leading-none">
                <Navigation className="w-3 h-3 text-primary" />
                {distanceText}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-on-surface truncate tracking-tight leading-tight group-hover:text-primary transition-colors">
            {place.name}
          </h3>

          {place.address && (
            <p className="text-xs font-medium text-on-surface-variant truncate mt-1 flex items-center gap-1 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-on-surface-variant/60 shrink-0" />
              {place.address}
            </p>
          )}
        </div>

        {/* Save bookmark button with 44px touch area and spring feedback */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(place.id);
          }}
          className="shrink-0"
        >
          <IconButton
            aria-label={place.isSaved ? 'Unsave place' : 'Save place'}
            icon={
              <motion.div
                whileTap={shouldReduceMotion ? undefined : { scale: 0.8 }}
                transition={springTactile}
              >
                <Bookmark
                  className={`w-5 h-5 transition-colors ${
                    place.isSaved ? 'fill-secondary text-secondary' : 'text-on-surface-variant/40'
                  }`}
                />
              </motion.div>
            }
            variant={place.isSaved ? 'secondary' : 'ghost'}
            className="h-11 w-11 rounded-xl"
          />
        </div>
      </div>

      {/* OSM Attribution micro-label */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant/60 leading-none">
        <span>OSM: {place.osm?.type || 'node'}/{place.osm?.id}</span>
        <span className="text-primary font-bold group-hover:underline">View on map →</span>
      </div>
    </motion.div>
  );
};
