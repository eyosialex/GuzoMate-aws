import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Bus, 
  Car, 
  Footprints, 
  MapPin, 
  Clock, 
  Navigation, 
  AlertCircle,
  Crosshair,
  Search,
  Check
} from 'lucide-react';
import { RouteTravelMode } from '../../types';
import { useRoutes } from '../../hooks/useRoutes';
import { useI18n } from '../../hooks/useI18n';
import { searchAddisLandmarks, AddisLandmark } from '../../lib/addisLandmarks';
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
    originName,
    destinationName,
    setDestinationName,
    setDestination,
    isLoading,
    error,
    limitations,
    calculateRoute,
    isPickingDestination,
    startPickingDestination,
  } = useRoutes();

  const [suggestions, setSuggestions] = useState<AddisLandmark[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const handleDestinationInputChange = (val: string) => {
    setDestinationName(val);
    if (val.trim().length >= 2) {
      const matches = searchAddisLandmarks(val);
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (landmark: AddisLandmark) => {
    setDestination(landmark.location, landmark.name);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfaf4] overflow-y-auto p-4 space-y-4">
      {/* Route Inputs Card with Scale 0.95 Enter Animation */}
      <motion.div
        variants={cardEnter}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        transition={springGentle}
        className="bg-white rounded-2xl p-4 border border-[rgba(32,34,31,0.12)] shadow-xs space-y-3 relative"
      >
        {/* Origin */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-white shrink-0 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block font-mono leading-none">
              Origin (GPS Telemetry)
            </span>
            <span className="text-sm font-bold text-stone-900 truncate block mt-0.5 leading-tight" title={originName}>
              {originName || t('routes.origin')}
            </span>
          </div>
        </div>

        {/* Divider dotted line */}
        <div className="ml-2 pl-3 border-l-2 border-dashed border-[rgba(32,34,31,0.12)] py-1" />

        {/* Destination */}
        <div className="flex items-center gap-3 relative">
          <div className="h-4 w-4 rounded-full bg-rose-600 shrink-0 flex items-center justify-center shadow-xs">
            <MapPin className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block font-mono leading-none">
                Destination
              </span>
              <motion.button
                type="button"
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={startPickingDestination}
                className={`text-[11px] font-bold flex items-center gap-1 transition-all px-2.5 py-1 rounded-lg cursor-pointer ${
                  isPickingDestination
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50 animate-pulse'
                    : 'text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/60 border border-blue-200/60 shadow-xs'
                }`}
                title="Tap a point on the map to select destination"
              >
                <Crosshair className="w-3 h-3" />
                <span>{isPickingDestination ? 'Selecting on Map...' : 'Select on Map'}</span>
              </motion.button>
            </div>

            <div className="relative mt-1">
              <input
                type="text"
                value={destinationName}
                onChange={(e) => handleDestinationInputChange(e.target.value)}
                onFocus={() => destinationName.trim().length >= 2 && setShowSuggestions(true)}
                className="text-sm font-bold text-stone-900 bg-transparent border-b border-[rgba(32,34,31,0.14)] focus:border-blue-600 focus:outline-none w-full pb-1 leading-tight placeholder:text-stone-400 pr-6 transition-colors"
                placeholder={t('routes.destinationPlaceholder')}
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute right-1 top-1" />
            </div>

            {/* Landmark Quick Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-[rgba(32,34,31,0.12)] p-1.5 z-30 space-y-1">
                {suggestions.map((lm) => (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => selectSuggestion(lm)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50/60 rounded-lg text-xs font-medium flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block leading-tight group-hover:text-blue-600">{lm.name}</span>
                      <span className="text-[10px] text-stone-500 leading-tight block truncate mt-0.5">{lm.address}</span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Buttons with Tactile Springs */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(32,34,31,0.1)]">
          {travelModes.map((mode) => {
            const isActive = travelMode === mode.id;
            return (
              <motion.button
                key={mode.id}
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={() => setTravelMode(mode.id)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600/20 select-none cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-extrabold border border-blue-600'
                    : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 hover:bg-stone-50'
                }`}
                aria-pressed={isActive}
              >
                {mode.icon}
                <span>{t(mode.labelKey)}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          whileTap={shouldReduceMotion ? undefined : tactilePress.button}
          transition={springTactile}
          onClick={calculateRoute}
          disabled={isLoading}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Calculating Route...</span>
            </>
          ) : (
            t('routes.planRoute')
          )}
        </motion.button>
      </motion.div>

      {/* Error or Notice Alert */}
      {error && (
        <motion.div
          variants={cardEnter}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={springGentle}
          className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-2 shadow-xs"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">
              <p className="font-bold">Routing Notice</p>
              <p className="mt-0.5 text-amber-800">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={calculateRoute}
              className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-[11px] hover:bg-amber-700 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Retry
            </button>
            {travelMode === 'transit' && (
              <button
                onClick={() => setTravelMode('driving')}
                className="px-3 py-1.5 bg-white border border-amber-300 font-bold rounded-lg text-[11px] hover:bg-amber-100 active:scale-95 transition-all text-amber-900 cursor-pointer shadow-xs"
              >
                Switch to Driving
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Available Routes summary */}
      {routes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-500 tracking-wide uppercase font-mono leading-none">
              {t('routes.title')}
            </h3>
            <span className="text-xs text-stone-400 font-mono leading-none">
              {routes[0]?.provider === 'addis-transit' ? 'Addis Transit / LRT' : 'OSRM High Precision'}
            </span>
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/30 border-blue-600 ring-2 ring-blue-600/15 shadow-xs'
                    : 'bg-white border-[rgba(32,34,31,0.12)] hover:border-blue-600/40 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-stone-900 leading-tight">
                    {formatDuration(route.durationSeconds)}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 font-mono leading-none">
                    {formatDistance(route.distanceMeters)}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium mt-1 truncate leading-relaxed">
                  {route.summary}
                </p>

                {route.incidentAlerts && route.incidentAlerts.length > 0 && (
                  <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-1.5 font-medium leading-tight">
                    <span className="text-amber-700 font-bold shrink-0">⚠️</span>
                    <span className="truncate">
                      {route.incidentAlerts.length} hazard(s) on route ({route.incidentAlerts.map((a: any) => a.type.replace(/_/g, ' ')).join(', ')})
                    </span>
                  </div>
                )}
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
          className="bg-white rounded-2xl p-4 border border-[rgba(32,34,31,0.12)] shadow-xs"
        >
          <h4 className="text-xs font-bold text-stone-900 tracking-wide uppercase font-mono mb-4 flex items-center gap-1.5 leading-none">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            {t('routes.steps')}
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
            {(selectedRoute.segments || []).map((segment, idx) => (
              <div key={segment.id || idx} className="relative group">
                {/* Node icon pin */}
                <div className="absolute -left-6 top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-xs flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 leading-none">
                      Step {idx + 1}
                    </span>
                    {segment.lineName && (
                      <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-full leading-none">
                        {segment.lineName}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-stone-800 mt-1 leading-relaxed">
                    {segment.instruction}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 font-semibold font-mono leading-none">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      {formatDuration(segment.durationSeconds)}
                    </span>
                    <span>•</span>
                    <span>{formatDistance(segment.distanceMeters)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {((selectedRoute.limitations && selectedRoute.limitations.length > 0) || limitations.length > 0) && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{(selectedRoute.limitations && selectedRoute.limitations[0]) || limitations[0]}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default RouteTimeline;
