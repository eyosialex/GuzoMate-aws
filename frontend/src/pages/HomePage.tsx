import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Route, 
  AlertTriangle, 
  CloudSun, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Bookmark, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../features/useAppStore';
import { useAuth } from '../features/AuthContext';
import { placesService } from '../services/placesService';
import { incidentsService } from '../services/incidentsService';
import { Place, Incident } from '../types';
import { springTactile, springGentle } from '../lib/motion';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  const savedPlaceIds = useAppStore((state) => state.savedPlaceIds);
  const toggleSavePlace = useAppStore((state) => state.toggleSavePlace);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);

  const [places, setPlaces] = useState<Place[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    let active = true;
    placesService.getNearby({ lat: 9.0108, lon: 38.7618, limit: 12 }).then((res) => {
      if (active) setPlaces(res.items);
    });
    incidentsService.getNearby({ lat: 9.0108, lon: 38.7618 }).then((res) => {
      if (active) setIncidents(res.items);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const filteredPlaces = places.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  }).slice(0, 4);

  // Stagger animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springGentle,
    },
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans pb-16">
      {/* ----------------------------------------------------------------------- */}
      {/* 1. HERO SECTION WITH SEARCH & TELEMETRY */}
      {/* ----------------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-white/80 to-[#f8faf8] border-b border-[#e2e8e3] pt-8 pb-12 px-4 sm:px-6">
        {/* Subtle topography mesh accent */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#183a2b_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-[1440px] mx-auto relative z-10">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={springGentle}
            className="flex flex-wrap items-center justify-between gap-3 mb-6"
          >
            {/* GPS Telemetry Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f7f3] border border-[#d1e2d8] text-xs font-semibold text-[#183a2b] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>Current GPS: Bole Medhane Alem, Addis Ababa</span>
              <span className="text-gray-400">•</span>
              <span className="font-mono text-[11px] text-[#25563e]">Alt: 2,355m</span>
            </div>

            {/* Scout Status Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#183a2b]" />
              <span>Logged as <strong className="text-gray-900">{user?.fullName || 'Dawit A.'}</strong></span>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                {user?.scoutGuildBadge || 'Selam Guild #418'}
              </span>
            </div>
          </motion.div>

          {/* Main Hero Headline */}
          <div className="max-w-3xl mb-8">
            <motion.h1
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.05 }}
              className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-950 leading-[1.15]"
            >
              Your Verified Highland Travel & Highway Safety Companion.
            </motion.h1>
            <motion.p
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.1 }}
              className="mt-3 text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-2xl"
            >
              Real-time geospatial discovery for 13,800+ mapped places, altitude-aware route profiles, community-moderated road incident radar, and emergency dispatch across Ethiopia.
            </motion.p>
          </div>

          {/* Search Bar Container */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ ...springGentle, delay: 0.15 }}
            className="max-w-3xl"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="relative w-full">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search places, clinics, 24/7 pharmacies, EV chargers, Entoto pass..."
                  className="w-full pl-12 pr-28 py-3.5 bg-white border border-[#d1e2d8] rounded-2xl text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick search chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
              <span className="text-gray-400 text-[11px] font-semibold mr-1">Suggested:</span>
              {[
                { label: 'Hospitals & 24/7 Trauma', query: 'hospital' },
                { label: 'Oxygen Relievers & Pharmacy', query: 'pharmacy' },
                { label: 'EV Charger & Diesel Depots', query: 'fuel' },
                { label: 'Traditional Coffee & Viewpoints', query: 'cafe' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip.query);
                    navigate(`/explore?category=${chip.query}`);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-[#f0f7f3] border border-gray-200 hover:border-[#183a2b]/30 rounded-lg text-gray-600 hover:text-[#183a2b] text-[11px] font-medium transition-all shadow-2xs cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 2. PRIMARY 4 ACTION CARDS (TACTILE & ANIMATED) */}
      {/* ----------------------------------------------------------------------- */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 -mt-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          {/* Card 1: Explore Nearby */}
          <motion.div variants={itemVariants}>
            <Link
              to="/explore"
              className="h-full flex flex-col justify-between p-5 bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#183a2b]/50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-[#f0f7f3] text-[#183a2b] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 text-[#183a2b]" />
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#183a2b] transition-colors">
                  Explore Nearby Map
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Discover 13,800+ OSM verified services, hospitals, pharmacies, and scenic lodges with verified distance.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#183a2b] mt-4 pt-3 border-t border-gray-100">
                <span>Open Interactive Map</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Ask GuzoMate */}
          <motion.div variants={itemVariants}>
            <Link
              to="/assistant"
              className="h-full flex flex-col justify-between p-5 bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#183a2b]/50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Ask GuzoMate AI
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Intelligent travel advisor grounded with Addis transit routes, weather conditions, and Amharic voice memo.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mt-4 pt-3 border-t border-gray-100">
                <span>Start Conversation</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Card 3: Highland Corridors */}
          <motion.div variants={itemVariants}>
            <Link
              to="/routes"
              className="h-full flex flex-col justify-between p-5 bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#183a2b]/50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Route className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  Highland Corridors
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Plan A2 Debre Birhan, A1 Hawassa Expressway, with elevation gradients, ridge passes, and road smoothness.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mt-4 pt-3 border-t border-gray-100">
                <span>Plan Corridor Route</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Card 4: Report Road Hazard */}
          <motion.div variants={itemVariants}>
            <Link
              to="/incidents/report"
              className="h-full flex flex-col justify-between p-5 bg-white rounded-2xl border border-red-100 hover:border-red-400 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  Report Road Hazard
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Broadcast rockfalls, heavy fog, and blockades instantly to 2,400+ intercity buses and rescue posts.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mt-4 pt-3 border-t border-gray-100">
                <span>Submit 10s Dispatch</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 3. WEATHER & HIGHLAND ATMOSPHERE RADAR */}
      {/* ----------------------------------------------------------------------- */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-10">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springGentle}
          className="bg-white rounded-2xl border border-[#d1e2d8] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Subtle gradient strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-[#183a2b]" />

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#f0f7f3] text-[#183a2b] flex items-center justify-center shrink-0">
              <CloudSun className="w-7 h-7 text-[#183a2b]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-black text-gray-950">21°C</span>
                <span className="text-xs font-bold text-gray-600">• Addis Basin Atmosphere</span>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                  Apparel Alert
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                <strong>Fog alert on Entoto Pass (8 km North)</strong>: Visibility reduced under 40m. Dew point: 4°C • Barometric pressure: 746 hPa.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-500">
                <span>Altitude Advisory: <strong>2,355m – 3,020m</strong></span>
                <span>•</span>
                <span className="font-semibold text-[#183a2b]">Recommended: Gabi / warm woolen shawl for evening chill</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/emergency"
              className="px-3 py-2 bg-[#f0f7f3] hover:bg-[#dceee3] text-[#183a2b] text-xs font-bold rounded-xl border border-[#d1e2d8] transition-colors"
            >
              Priority Dials (991 / 907)
            </Link>
            <Link
              to="/routes"
              className="px-3.5 py-2 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl transition-colors"
            >
              View Route Advisories
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 4. RECENT INCIDENTS */}
      {/* ----------------------------------------------------------------------- */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Incidents</h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Community verified alerts reported by drivers and transport scouts.
            </p>
          </div>
          <Link
            to="/incidents"
            className="text-xs font-bold text-[#183a2b] hover:underline flex items-center gap-1"
          >
            <span>View All Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {incidents.slice(0, 3).map((incident) => {
            const isClosure = incident.type === 'ROAD_CLOSURE' || incident.type === 'ACCIDENT';
            return (
              <motion.div
                key={incident.id}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                transition={springTactile}
                className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isClosure 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {incident.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {incident.distanceMeters ? `${(incident.distanceMeters / 1000).toFixed(1)} km away` : 'Nearby'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                    {incident.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{incident.confirmationsCount || 12} Scout Endorsements</span>
                  </div>
                  <Link
                    to="/incidents"
                    className="font-bold text-[#183a2b] hover:underline text-[11px]"
                  >
                    Details →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 5. VERIFIED PLACES & EMERGENCY CLINICS (FROM SCREEN-2) */}
      {/* ----------------------------------------------------------------------- */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Verified Services & Facilities</h2>
              <span className="text-[10px] font-bold bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-md">
                Transport Guild Audited
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Hospitals with 24/7 trauma, certified pharmacies, and mountain lodges with diesel depots.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Services' },
              { id: 'hospital', label: 'Hospitals & Clinics' },
              { id: 'pharmacy', label: 'Pharmacies' },
              { id: 'fuel', label: 'Fuel & EV' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#183a2b] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Place Cards Grid matching Screen-2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPlaces.map((place) => {
            const isSaved = savedPlaceIds.includes(place.id);
            return (
              <motion.div
                key={place.id}
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                transition={springTactile}
                className="bg-white rounded-2xl border border-[#e2e8e3] p-4 shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-md">
                      {place.category === 'hospital' ? '24/7 Level-1 Trauma' : place.category.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSavePlace(place.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isSaved ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save place'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#183a2b] transition-colors leading-snug">
                    {place.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                    {place.address}
                  </p>

                  {/* Highlights / Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                      {place.distanceMeters ? `${(place.distanceMeters / 1000).toFixed(1)} km away` : '1.8 km'}
                    </span>
                    {place.tags.emergency === 'yes' && (
                      <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">
                        Oxygen 100%
                      </span>
                    )}
                    {place.tags.brand && (
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        {place.tags.brand}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlace(place);
                      navigate('/explore');
                    }}
                    className="text-xs font-bold text-[#183a2b] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View on Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-[#183a2b] hover:bg-[#122e22] text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    Directions
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-bold text-xs rounded-xl border border-gray-200 shadow-xs transition-colors"
          >
            <span>Explore All 13,800+ Places on Interactive Map</span>
            <ArrowRight className="w-4 h-4 text-[#183a2b]" />
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 6. CORRIDOR ROUTE PREVIEW (FROM SCREEN-3) */}
      {/* ----------------------------------------------------------------------- */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-14">
        <div className="bg-gradient-to-br from-[#183a2b] to-[#0f2b1d] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="max-w-2xl relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-emerald-300 border border-white/10 px-2.5 py-1 rounded-full">
              Strategic Highway Corridors
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">
              Addis Ababa – Debre Birhan – Dessie (A2 Corridor)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-2 leading-relaxed">
              Highland corridor elevation profile: 128 km • 2h 25m estimated transit. Asphalt 94% smooth with 6 km resurfacing near Legetafo. 3 verified fuel depots open.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs">
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <span className="block text-[10px] text-gray-300">Max Elevation Ridge</span>
                <span className="text-sm font-bold text-emerald-300">Termaber Pass (3,120m)</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <span className="block text-[10px] text-gray-300">Traffic Condition</span>
                <span className="text-sm font-bold text-white">Normal Flow</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <span className="block text-[10px] text-gray-300">Contactless Toll</span>
                <span className="text-sm font-bold text-emerald-300">Legetafo Plaza QR Ready</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                to="/routes"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <span>Open Highland Corridor Planner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/emergency"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-colors"
              >
                Termaber Heavy Tow (km 102)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
