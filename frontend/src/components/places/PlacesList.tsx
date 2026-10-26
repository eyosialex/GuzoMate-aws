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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shrink-0">
        <Input
          shape="pill"
          leftIcon={<Search className="w-5 h-5 text-gray-400" />}
          placeholder={t('places.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={t('places.searchPlaceholder')}
        />

        {/* Category Pills horizontal scroll with 44px min tap targets & springs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={() => setCategory(cat.id)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold leading-none whitespace-nowrap transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary select-none ${
                  isActive
                    ? 'bg-primary text-white shadow-sm font-bold'
                    : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
                }`}
                aria-pressed={isActive}
              >
                {t(cat.labelKey)}
              </motion.button>
            );
          })}
        </div>

        {/* Results Count Banner with Inverse Leading */}
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 px-1 leading-none">
          <span>{t('places.resultsFound', { count: places.length })}</span>
          <span className="text-[11px] text-gray-400 font-normal">Addis Ababa • OSM</span>
        </div>
      </div>

      {/* Places Scroll Area with Staggered Spring Entry */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-pulse h-28"
              />
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <MapPinOff className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600 leading-tight">{t('places.noResults')}</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">Try another category or broaden your search.</p>
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
