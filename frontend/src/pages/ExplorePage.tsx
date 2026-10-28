import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Search, 
  X, 
  Phone, 
  Share2, 
  Bookmark, 
  Navigation, 
  CheckCircle2, 
  Layers, 
  Compass, 
  CloudSun, 
  ShieldAlert, 
  Fuel, 
  Coffee, 
  PlusSquare, 
  Sparkles,
  Map as MapIcon,
  List as ListIcon
} from 'lucide-react';
import { GuzoMap } from '../components/map/GuzoMap';
import { useAppStore } from '../features/useAppStore';
import { Place } from '../types';
import { placesService } from '../services/placesService';
import { springGentle } from '../lib/motion';

export const ExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const selectedPlace = useAppStore((state) => state.selectedPlace);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);
  const savedPlaceIds = useAppStore((state) => state.savedPlaceIds);
  const toggleSavePlace = useAppStore((state) => state.toggleSavePlace);
  const userLocation = useAppStore((state) => state.userLocation);
  const userLocationName = useAppStore((state) => state.userLocationName);
  const userAltitude = useAppStore((state) => state.userAltitude);

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(10);
  const [onlyGuildVerified, setOnlyGuildVerified] = useState<boolean>(true);
  const [onlyOpenNow, setOnlyOpenNow] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<'terrain' | 'satellite' | 'standard'>('standard');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    let active = true;
    placesService.getNearby({
      lat: userLocation.lat,
      lon: userLocation.lon,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      query: searchQuery,
      radiusMeters: maxDistanceKm * 1000,
    }).then((res) => {
      if (active) {
        setPlaces(res.items);
        if (!selectedPlace && res.items.length > 0) {
          setSelectedPlace(res.items[0]);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [userLocation.lat, userLocation.lon, selectedCategory, searchQuery, maxDistanceKm, selectedPlace, setSelectedPlace]);

  const filteredPlaces = places.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const distKm = (p.distanceMeters || 1000) / 1000;
    const matchesDist = distKm <= maxDistanceKm;
    return matchesCat && matchesSearch && matchesDist;
  });

  const categories = [
    { id: 'all', label: 'All Services', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'hospital', label: 'Hospitals & Clinics', icon: <PlusSquare className="w-3.5 h-3.5" /> },
    { id: 'pharmacy', label: 'Pharmacies', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'fuel', label: 'Fuel & EV Fast Charge', icon: <Fuel className="w-3.5 h-3.5" /> },
    { id: 'cafe', label: 'Scenic Lodges & Cafes', icon: <Coffee className="w-3.5 h-3.5" /> },
  ];

  const activeSelected = selectedPlace || filteredPlaces[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-[#f8faf8] font-sans relative">
      {/* Mobile / Tablet Segmented View Switcher */}
      <div className="lg:hidden p-3 bg-white border-b border-gray-200 flex items-center justify-center gap-2 sticky top-16 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileView === 'list'
              ? 'bg-[#183a2b] text-white shadow-xs'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <ListIcon className="w-3.5 h-3.5" />
          <span>Services List ({filteredPlaces.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileView === 'map'
              ? 'bg-[#183a2b] text-white shadow-xs'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive OSM Map</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* LEFT SPLIT PANEL: SEARCH, FILTERS & PLACES LIST */}
      {/* --------------------------------------------------------------------- */}
      <aside className={`w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-[#e2e8e3] shrink-0 z-20 shadow-[2px_0_12px_rgba(0,0,0,0.03)] overflow-y-auto ${
        mobileTabClass(mobileView)
      }`}>
        {/* Top Search Input */}
        <div className="p-3.5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Addis Ababa services, 24/7 trauma, EV..."
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Current GPS Status Bar matching Screen-2 */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2.5 px-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-gray-700">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>Current GPS: <strong>{userLocationName}</strong></span>
            </div>
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-[10px]">
              Alt: {userAltitude}
            </span>
          </div>
        </div>

        {/* Category Pills & Filters */}
        <div className="p-3 border-b border-gray-100 bg-[#fbfdfb] space-y-2.5">
          {/* Category buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#183a2b] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Distance & Verification Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-[11px] mr-1">Distance:</span>
              {[2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => setMaxDistanceKm(km)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    maxDistanceKm === km
                      ? 'bg-[#183a2b] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  &lt;{km}km
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer select-none text-[11px] font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyGuildVerified}
                  onChange={(e) => setOnlyGuildVerified(e.target.checked)}
                  className="rounded text-[#183a2b] focus:ring-[#183a2b]"
                />
                <span>Guild Verified</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer select-none text-[11px] font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyOpenNow}
                  onChange={(e) => setOnlyOpenNow(e.target.checked)}
                  className="rounded text-[#183a2b] focus:ring-[#183a2b]"
                />
                <span>Open Now</span>
              </label>
            </div>
          </div>
        </div>

        {/* Places List Scroll Area */}
        <div className="p-3.5 space-y-3.5">
          {/* Detailed Selected Facility Card Matching Screen-2 */}
          {activeSelected && (
            <motion.div
              layout
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={springGentle}
              className="p-4 bg-white rounded-2xl border-2 border-[#183a2b]/30 shadow-md space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-md">
                    {activeSelected.tags?.trauma || activeSelected.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                    Alt: {activeSelected.tags?.elevation || '2,355 m'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {activeSelected.tags?.oxygen || 'Open 24/7'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSavePlace(activeSelected.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    savedPlaceIds.includes(activeSelected.id)
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
                  }`}
                  title="Bookmark place"
                >
                  <Bookmark className={`w-4 h-4 ${savedPlaceIds.includes(activeSelected.id) ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-gray-950 leading-snug">
                  {activeSelected.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {activeSelected.address}
                </p>
              </div>

              {/* Multilingual Staff / Oxygen reserve badges */}
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="text-[11px] text-gray-500">Trauma Level:</span>
                  <span className="font-bold text-gray-900">{activeSelected.tags?.trauma || 'Standard Hospital'}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span className="text-[11px] text-gray-500">Language Parity:</span>
                  <span className="font-semibold text-gray-800">{activeSelected.tags?.staff || 'English, አማርኛ'}</span>
                </div>
                {activeSelected.tags?.phone && (
                  <div className="flex items-center justify-between text-gray-700 pt-1 border-t border-gray-200/60">
                    <span className="text-[11px] text-gray-500">Emergency Phone:</span>
                    <a href={`tel:${activeSelected.tags.phone}`} className="font-mono font-bold text-[#183a2b] hover:underline">
                      {activeSelected.tags.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeSelected.location.lat},${activeSelected.location.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>

                {activeSelected.tags?.phone && (
                  <a
                    href={`tel:${activeSelected.tags.phone}`}
                    className="py-2 px-3 bg-[#f0f7f3] hover:bg-[#dceee3] text-[#183a2b] border border-[#d1e2d8] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* List of Other Matching Place Cards */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Nearby Highland Services ({filteredPlaces.length})
            </h4>

            {filteredPlaces.filter((p) => p.id !== activeSelected?.id).map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  setSelectedPlace(place);
                  // On mobile, automatically show map when selecting
                  if (window.innerWidth < 1024) {
                    setMobileView('map');
                  }
                }}
                className="p-3.5 bg-white rounded-xl border border-gray-200 hover:border-[#183a2b]/40 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {place.tags?.diesel || place.tags?.scenic || place.tags?.stock || place.tags?.style || place.category.toUpperCase()}
                  </span>
                  <span className="font-bold text-gray-500">
                    {place.distanceMeters ? `${(place.distanceMeters / 1000).toFixed(1)} km away` : 'Nearby'}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#183a2b] transition-colors">
                  {place.name}
                </h4>
                <p className="text-xs text-gray-500 truncate mt-0.5">{place.address}</p>

                {/* Tag highlights */}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-gray-600">
                  {place.tags?.charger && (
                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                      ⚡ {place.tags.charger}
                    </span>
                  )}
                  {place.tags?.atm && (
                    <span className="bg-gray-100 px-1.5 py-0.2 rounded">{place.tags.atm}</span>
                  )}
                  {place.tags?.advisory && (
                    <span className="bg-amber-50 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                      {place.tags.advisory}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* --------------------------------------------------------------------- */}
      {/* RIGHT PANEL: FULL BLEED INTERACTIVE OPENSTREETMAP CANVAS */}
      {/* --------------------------------------------------------------------- */}
      <main className={`flex-1 h-[calc(100vh-4rem)] relative overflow-hidden ${
        mobileView === 'list' ? 'hidden lg:block' : 'block'
      }`} aria-label="Interactive OpenStreetMap Canvas">
        {/* Top-Right Map Controls Header */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-gray-200/80 shadow-md">
          <button
            type="button"
            onClick={() => setMapStyle('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapStyle === 'standard'
                ? 'bg-[#183a2b] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Standard OSM</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('terrain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapStyle === 'terrain'
                ? 'bg-[#183a2b] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>▲ Topo Relief</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapStyle === 'satellite'
                ? 'bg-[#183a2b] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>Satellite</span>
          </button>
        </div>

        {/* Leaflet OpenStreetMap Canvas */}
        <GuzoMap 
          customPlaces={filteredPlaces}
          mapStyle={mapStyle}
          className="w-full h-full"
        />

        {/* Bottom-Floating Highland Weather Pill matching Screen-2 */}
        <div className="absolute bottom-5 left-4 right-4 md:left-6 md:right-auto z-30 max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-[#d1e2d8] p-3.5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#f0f7f3] text-[#183a2b] flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">21°C • Addis Basin</span>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                  Gabi / Jacket
                </span>
              </div>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Fog alert on Entoto Pass (8 km North) • Altitude Advisory: 2,355m – 3,020m
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function mobileTabClass(mobileView: 'list' | 'map') {
  return mobileView === 'map' ? 'hidden lg:block' : 'block';
}

export default ExplorePage;
