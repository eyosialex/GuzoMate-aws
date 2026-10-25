import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Bus, 
  Car, 
  Footprints, 
  MapPin, 
  Clock, 
  Navigation, 
  AlertCircle 
} from 'lucide-react';
import { RouteTravelMode } from '../../types';
import { useRoutes } from '../../hooks/useRoutes';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../common/Button';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const RouteTimeline: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const {
    routes,
    selectedRoute,
    setSelectedRoute,
    travelMode,
    setTravelMode,
    destinationName,
    setDestinationName,
    isLoading,
    calculateRoute,
  } = useRoutes();

  const travelModes: { id: RouteTravelMode; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'transit', labelKey: 'routes.transit', icon: <Bus className="w-4 h-4" /> },
    { id: 'driving', labelKey: 'routes.driving', icon: <Car className="w-4 h-4" /> },
    { id: 'walking', labelKey: 'routes.walking', icon: <Footprints className="w-4 h-4" /> },
  ];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '--';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto p-4 space-y-4">
      {/* Route Inputs Card with Scale 0.95 Enter Animation */}
      <motion.div
        variants={cardEnter}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        transition={springGentle}
        className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-3"
      >
        {/* Origin */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-600 bg-white shrink-0 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block leading-none">
              Origin
            </span>
            <span className="text-sm font-bold text-gray-900 truncate block mt-0.5 leading-tight">
              {t('routes.origin')}
            </span>
          </div>
        </div>

        {/* Divider dotted line */}
        <div className="ml-2 pl-3 border-l-2 border-dashed border-gray-300 py-1" />

        {/* Destination */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full bg-red-500 shrink-0 flex items-center justify-center">
            <MapPin className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block leading-none">
              Destination
            </span>
            <input
              type="text"
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              className="text-sm font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-indigo-600 focus:outline-none w-full pb-0.5 mt-0.5 leading-tight"
              placeholder={t('routes.destinationPlaceholder')}
            />
          </div>
        </div>

        {/* Mode Selector Buttons with Tactile Springs */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60">
          {travelModes.map((mode) => {
            const isActive = travelMode === mode.id;
            return (
              <motion.button
                key={mode.id}
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={() => setTravelMode(mode.id)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-100/80'
                }`}
                aria-pressed={isActive}
              >
                {mode.icon}
                <span>{t(mode.labelKey)}</span>
              </motion.button>
            );
          })}
        </div>

        <Button
          onClick={calculateRoute}
          isLoading={isLoading}
          variant="primary"
          className="w-full rounded-xl"
        >
          {t('routes.planRoute')}
        </Button>
      </motion.div>

      {/* Available Routes summary */}
      {routes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 tracking-wide uppercase leading-none">
              {t('routes.title')}
            </h3>
            <span className="text-xs text-gray-400 leading-none">Addis Transit</span>
          </div>

          {routes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            return (
              <motion.div
                key={route.id}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : tactilePress.card}
                transition={springGentle}
                onClick={() => setSelectedRoute(route)}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-gray-900 leading-tight">
                    {formatDuration(route.durationSeconds)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 leading-none">
                    {formatDistance(route.distanceMeters)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium mt-1 truncate leading-relaxed">
                  {route.summary}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Step-by-Step Vertical Timeline */}
      {selectedRoute && (
        <motion.div
          variants={cardEnter}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={springGentle}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
        >
          <h4 className="text-xs font-bold text-gray-800 tracking-wide uppercase mb-4 flex items-center gap-1.5 leading-none">
            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
            {t('routes.steps')}
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
            {selectedRoute.segments.map((segment, idx) => (
              <div key={segment.id || idx} className="relative group">
                {/* Node icon pin */}
                <div className="absolute -left-6 top-0 h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 leading-none">
                      Step {idx + 1}
                    </span>
                    {segment.lineName && (
                      <span className="text-[10px] font-bold bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded-full leading-none">
                        {segment.lineName}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-gray-700 mt-1 leading-relaxed">
                    {segment.instruction}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 font-semibold leading-none">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(segment.durationSeconds)}
                    </span>
                    <span>•</span>
                    <span>{formatDistance(segment.distanceMeters)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRoute.limitations && selectedRoute.limitations.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{selectedRoute.limitations[0]}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
