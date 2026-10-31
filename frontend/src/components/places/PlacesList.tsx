import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, MapPinOff } from 'lucide-react';
import { PlaceCategory } from '../../types';
import { PlaceCard } from './PlaceCard';
import { Input } from '../common/Input';
import { usePlaces } from '../../hooks/usePlaces';
import { useI18n } from '../../hooks/useI18n';
import { useAppStore } from '../../features/useAppStore';
import { springTactile, tactilePress, staggerListContainer } from '../../lib/motion';

const CATEGORIES: { id: PlaceCategory; labelKey: string }[] = [
  { id: 'all', labelKey: 'places.categories.all' },
  { id: 'cafe', labelKey: 'places.categories.cafe' },
  { id: 'restaurant', labelKey: 'places.categories.restaurant' },
  { id: 'hotel', labelKey: 'places.categories.hotel' },
  { id: 'hospital', labelKey: 'places.categories.hospital' },
  { id: 'pharmacy', labelKey: 'places.categories.pharmacy' },
  { id: 'mechanic', labelKey: 'places.categories.mechanic' },
  { id: 'fuel', labelKey: 'places.categories.fuel' },
  { id: 'bank', labelKey: 'places.categories.bank' },
];

export const PlacesList: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const {
    places,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    toggleSave,
  } = usePlaces();

  const selectedPlace = useAppStore((state) => state.selectedPlace);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#fbfaf4]">
      {/* Search Header */}
      <div className="p-4 border-b border-[rgba(32,34,31,0.1)] flex flex-col gap-3 shrink-0 bg-white/95 backdrop-blur-md">
        <Input
          shape="pill"
          leftIcon={<Search className="w-4 h-4 text-stone-400" />}
          placeholder={t('places.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={t('places.searchPlaceholder')}
          className="border-[rgba(32,34,31,0.14)] focus:border-blue-600 focus:ring-blue-600/15"
        />

        {/* Category Pills horizontal scroll with 44px min tap targets & springs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={() => setCategory(cat.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold leading-none whitespace-nowrap transition-all duration-150 focus:outline-none select-none cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold border border-blue-600'
                    : 'bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 hover:bg-stone-50'
                }`}
                aria-pressed={isActive}
              >
                {t(cat.labelKey)}
              </motion.button>
            );
          })}
        </div>

        {/* Results Count Banner with Monospace Accents */}
        <div className="flex items-center justify-between text-xs font-medium text-stone-500 px-1 leading-none font-mono">
          <span className="text-[11px] uppercase tracking-wider">{t('places.resultsFound', { count: places.length })}</span>
          <span className="text-[10px] text-stone-400">Addis Ababa • OSM</span>
        </div>
      </div>

      {/* Places Scroll Area with Staggered Spring Entry */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white/80 rounded-2xl p-4 border border-[rgba(32,34,31,0.1)] h-28 animate-pulse"
              />
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400 bg-white rounded-2xl border border-[rgba(32,34,31,0.1)] p-8">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <MapPinOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-800 leading-tight">{t('places.noResults')}</p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">Try another category or broaden your search.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerListContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="space-y-3"
          >
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isSelected={selectedPlace?.id === place.id}
                onSelect={setSelectedPlace}
                onToggleSave={toggleSave}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
