import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Compass, 
  MapPin, 
  Route as RouteIcon, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Zap, 
  Radio, 
  Globe, 
  ChevronRight,
  PhoneCall,
  CloudSun,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { useAppStore } from '../features/useAppStore';
import { Language } from '../types';
import { RotatingGlobe } from '../components/common/RotatingGlobe';
import heroLayerImg from '../assets/hero.png';
import { springTactile, springGentle } from '../lib/motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, quickDemoLogin } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [activePreviewTab, setActivePreviewTab] = useState<'explore' | 'routes' | 'incidents' | 'emergency'>('explore');
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunchApp = async () => {
    setIsLaunching(true);
    if (!isAuthenticated) {
      await quickDemoLogin(0);
    }
    navigate('/app');
  };

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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springGentle,
    },
  };

  // Trilingual Content Parity: English, Amharic, Afaan Oromoo
  const copy = {
    en: {
      badge: 'Ethiopian Highland Travel & Highway Safety Platform',
      headline: 'Intelligent Navigation, Mountain Radar & Highway Safety for Ethiopia.',
      subtitle: 'GuzoMate unites OpenStreetMap spatial discovery for 13,800+ mapped places, elevation-gradient corridor planning, real-time community road hazard verification, and direct emergency dispatch (991 / 907) across Addis Ababa and strategic national corridors.',
      ctaPrimary: 'Launch GuzoMate App',
      ctaSecondary: 'Explore Interactive Map',
      ctaDemo: '1-Click Scout Demo Access',
      statsPlaces: '13,861',
      statsPlacesLabel: 'Mapped Services & Facilities',
      statsElevation: '3,120m',
      statsElevationLabel: 'Max Ridge Monitored (Termaber Pass)',
      statsBuses: '2,400+',
      statsBusesLabel: 'Intercity Buses on Radio Dispatch',
      statsAccuracy: '98.4%',
      statsAccuracyLabel: 'Scout Verification Accuracy',
      pillarsTitle: 'Engineered for Ethiopian Highland Realities',
      pillarsSubtitle: 'Built specifically for high-altitude passes, sudden mountain fog roll-ins, and vital commercial transport corridors.',
    },
    am: {
      badge: 'የኢትዮጵያ ሀይላንድ የጉዞና የመንገድ ደህንነት ፕላትፎርም',
      headline: 'ብልህ የጉዞ መመሪያ፣ የተራራ ራዳርና የመንገድ ደህንነት ለኢትዮጵያ።',
      subtitle: 'ጉዞሜት ከ13,800 በላይ የተመዘገቡ ቦታዎችን በካርታ ማሰስ፣ የተራራ ከፍታና የመንገድ ጥራት እቅድ፣ የእውነተኛ ጊዜ የመንገድ አደጋ ሪፖርትና ማረጋገጫ፣ እንዲሁም ፈጣን የድንገተኛ አደጋ ጥሪ (991 / 907) አገልግሎቶችን በአንድ ላይ አቀናጅቶ የያዘ ዘመናዊ ፕላትፎርም ነው።',
      ctaPrimary: 'ጉዞሜትን ይጀምሩ',
      ctaSecondary: 'ካርታውን ያስሱ',
      ctaDemo: 'በሙከራ ስካውት በቀጥታ ይግቡ',
      statsPlaces: '13,861',
      statsPlacesLabel: 'የተመዘገቡ አገልግሎት ሰጪ ቦታዎች',
      statsElevation: '3,120m',
      statsElevationLabel: 'ከፍተኛ የተራራ ሰንሰለት (ተርማበር)',
      statsBuses: '2,400+',
      statsBusesLabel: 'የረጅም ርቀት አውቶቡሶች በኔትወርክ የተሳሰሩ',
      statsAccuracy: '98.4%',
      statsAccuracyLabel: 'የስካውት መረጃ ማረጋገጫ ትክክለኛነት',
      pillarsTitle: 'ለኢትዮጵያ ተጨባጭ ሁኔታዎች የተነደፈ',
      pillarsSubtitle: 'ለከፍተኛ ተራራማ መንገዶች፣ ፈጣን የተራራ ጉም፣ እና ወሳኝ የትራንስፖርት መስመሮች ተብሎ የተሰራ።',
    },
    om: {
      badge: 'Platformii Imala Tulluu fi Nageenya Daandii Itoophiyaa',
      headline: 'Qajeelcha Imalaa Ammayyaa, Raadaara Tulluu fi Nageenya Daandii.',
      subtitle: 'GuzoMate iddoowwan 13,800+ kaartaa irratti argachuu, qophii daandii tulluu fi ol-ka\'iinsaa, gabaasa balaa daandii yeroo qabatamaa, fi waamicha hatattamaa (991 / 907) walitti fida.',
      ctaPrimary: 'Appilikeeshinii GuzoMate Jalqabaa',
      ctaSecondary: 'Kaartaa Sakatta\'aa',
      ctaDemo: 'Seensa Yaalii Qajeelchaa',
      statsPlaces: '13,861',
      statsPlacesLabel: 'Iddoowwan Galmaa\'an',
      statsElevation: '3,120m',
      statsElevationLabel: 'Ol-ka\'iinsa Tulluu Ol-aanaa (Termaber)',
      statsBuses: '2,400+',
      statsBusesLabel: 'Basiwwan Daandii Dheeraa Walqabatan',
      statsAccuracy: '98.4%',
      statsAccuracyLabel: 'Sirrummaa Mirkaneessa Iskaawutii',
      pillarsTitle: 'Haala Qabatamaa Tulluu Itoophiyaatiif Kan Qophaa\'e',
      pillarsSubtitle: 'Tulluuwwan ol-ka\'oo, hurrii fi daandiiwwan daldalaa murteessoo ta\'aniif kan hojjetame.',
    },
  };

  const currentCopy = copy[language] || copy.en;

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-emerald-500 selection:text-gray-950 overflow-x-hidden">
      {/* --------------------------------------------------------------------- */}
      {/* CONTINUOUS ROTATING EARTH GLOBE BACKGROUND */}
      {/* --------------------------------------------------------------------- */}
      <RotatingGlobe />

      {/* --------------------------------------------------------------------- */}
      {/* 1. STICKY GLASS HEADER */}
      {/* --------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#071910]/85 backdrop-blur-xl border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { rotate: 25, scale: 1.05 }}
              transition={springTactile}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-[#103824] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30"
            >
              <Compass className="w-5 h-5 text-emerald-300" />
            </motion.div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  GuzoMate
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                  Ethiopia
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium leading-none hidden sm:block">
                Travelers & Highway Safety
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-300">
            <a href="#telemetry" className="hover:text-emerald-400 transition-colors">Telemetry</a>
            <a href="#pillars" className="hover:text-emerald-400 transition-colors">Core Pillars</a>
            <a href="#preview" className="hover:text-emerald-400 transition-colors">System Preview</a>
            <a href="#corridors" className="hover:text-emerald-400 transition-colors">Corridors</a>
            <a href="#weather" className="hover:text-emerald-400 transition-colors">Atmosphere</a>
            <a href="#emergency" className="hover:text-emerald-400 transition-colors">Emergency 991</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          {/* Right Controls: Language & Entry Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-emerald-500/20 backdrop-blur-md">
              <Globe className="w-3.5 h-3.5 text-emerald-400 ml-1.5 mr-0.5 hidden sm:block" />
              {(['en', 'am', 'om'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    language === l 
                      ? 'bg-emerald-500 text-gray-950 shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'am' ? 'አማ' : 'OM'}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Dashboard ({user?.fullName || 'Dawit'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="py-2 px-3 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <button
                  type="button"
                  onClick={handleLaunchApp}
                  disabled={isLaunching}
                  className="py-2 px-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-gray-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main One-Page Content Stack Over The Continuously Rotating Globe */}
      <main className="relative z-10">
        {/* --------------------------------------------------------------------- */}
        {/* 2. HERO SECTION */}
        {/* --------------------------------------------------------------------- */}
        <section id="telemetry" className="pt-12 pb-20 px-4 sm:px-6">
          <div className="max-w-[1560px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 7 Columns */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={springGentle}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-lg"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span>{currentCopy.badge}</span>
              </motion.div>

              <motion.h1
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: 0.05 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-sm"
              >
                {currentCopy.headline}
              </motion.h1>

              <motion.p
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: 0.1 }}
                className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed max-w-2xl drop-shadow-xs"
              >
                {currentCopy.subtitle}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: 0.15 }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <button
                  type="button"
                  onClick={handleLaunchApp}
                  className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-gray-950 text-xs sm:text-sm font-black rounded-xl shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>{currentCopy.ctaPrimary}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/explore"
                  className="py-3 px-5 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-bold rounded-xl backdrop-blur-md shadow-lg transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{currentCopy.ctaSecondary}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => quickDemoLogin(0).then(() => navigate('/app'))}
                  className="py-3 px-4 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>{currentCopy.ctaDemo}</span>
                </button>
              </motion.div>

              {/* Live Locks Banner */}
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1 }}
                transition={{ ...springGentle, delay: 0.2 }}
                className="flex flex-wrap items-center gap-4 pt-4 text-xs text-gray-300 border-t border-emerald-500/20"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>OpenStreetMap PostGIS Telemetry Synced</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>24/7 Federal Police (991) Hotline Live</span>
                </div>
              </motion.div>
            </div>

            {/* Right 5 Columns: Highland Corridor Telemetry Stack Glass Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                transition={{ ...springGentle, delay: 0.1 }}
                className="relative w-full max-w-md bg-[#0c2419]/80 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-white">
                      Highland Telemetry Radar
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded">
                    Continuous Sync
                  </span>
                </div>

                <div className="relative py-2 flex items-center justify-center">
                  <img
                    src={heroLayerImg}
                    alt="Highland Geospatial Layers"
                    className="w-44 h-auto object-contain drop-shadow-2xl animate-pulse"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-white/5 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">Gateway Altitude</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-300">2,355 m (Addis Ababa)</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <RouteIcon className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">A2 Ridge Pass</span>
                    </div>
                    <span className="font-mono font-bold text-amber-300">3,120 m (Termaber Summit)</span>
                  </div>

                  <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/30 flex items-center justify-between text-xs backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="font-bold text-red-200">Active Road Hazards</span>
                    </div>
                    <span className="font-bold text-red-400">3 Verified On-Route</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 3. LIVE SYSTEM METRICS COUNTERS */}
        {/* --------------------------------------------------------------------- */}
        <section className="max-w-[1560px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0c2419]/80 backdrop-blur-2xl rounded-2xl border border-emerald-500/30 p-6 shadow-2xl">
            <div className="border-r border-emerald-500/20 last:border-none pr-4">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {currentCopy.statsPlaces}
              </span>
              <p className="text-xs text-gray-300 font-semibold mt-0.5">{currentCopy.statsPlacesLabel}</p>
            </div>

            <div className="border-r border-emerald-500/20 last:border-none pr-4">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                {currentCopy.statsElevation}
              </span>
              <p className="text-xs text-gray-300 font-semibold mt-0.5">{currentCopy.statsElevationLabel}</p>
            </div>

            <div className="border-r border-emerald-500/20 last:border-none pr-4">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
                {currentCopy.statsBuses}
              </span>
              <p className="text-xs text-gray-300 font-semibold mt-0.5">{currentCopy.statsBusesLabel}</p>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {currentCopy.statsAccuracy}
              </span>
              <p className="text-xs text-gray-300 font-semibold mt-0.5">{currentCopy.statsAccuracyLabel}</p>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 4. FOUR CORE ARCHITECTURE PILLARS */}
        {/* --------------------------------------------------------------------- */}
        <section id="pillars" className="max-w-[1560px] mx-auto px-4 sm:px-6 py-20">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              System Pillars
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-3">
              {currentCopy.pillarsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-2">
              {currentCopy.pillarsSubtitle}
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Pillar 1: PostGIS */}
            <motion.div
              variants={itemVariants}
              className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl hover:border-emerald-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  PostGIS Spatial Discovery
                </h3>
                <p className="text-xs text-gray-300 font-medium mt-2 leading-relaxed">
                  Over 13,800+ mapped places queried with exact real-world distances in meters using PostGIS <code>ST_DWithin</code> and <code>ST_Distance</code>. Filter Level-1 trauma clinics with certified 100% oxygen reserves, 24/7 pharmacies, 50kW EV fast chargers, and diesel depots.
                </p>
              </div>
              <Link
                to="/explore"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Explore 13,800+ Places</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Pillar 2: Highland Corridors */}
            <motion.div
              variants={itemVariants}
              className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl hover:border-emerald-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-4">
                  <RouteIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  Highland Corridor Planning
                </h3>
                <p className="text-xs text-gray-300 font-medium mt-2 leading-relaxed">
                  Strategic highway corridor intelligence: A2 Debre Birhan–Dessie (up to 3,120m at Termaber Summit), A1 Hawassa 6-lane modern expressway, and A3 Western corridor. Displays road smoothness percentages, resurfacing zones, and recovery tow units.
                </p>
              </div>
              <Link
                to="/routes"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Plan Corridors & Ridges</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Pillar 3: Scout Verification */}
            <motion.div
              variants={itemVariants}
              className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-red-500/25 shadow-xl hover:border-red-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-11 w-11 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  Scout Hazard Verification
                </h3>
                <p className="text-xs text-gray-300 font-medium mt-2 leading-relaxed">
                  Community-driven road incident reporting with barometric sensor locks, kilometer markers, and dual-script observations. Automatic threshold activation promotes reports upon 3 scout endorsements and notifies 2,400+ intercity buses.
                </p>
              </div>
              <Link
                to="/incidents"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
              >
                <span>Live Hazard Radar</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Pillar 4: AI Advisor */}
            <motion.div
              variants={itemVariants}
              className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-indigo-500/25 shadow-xl hover:border-indigo-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-11 w-11 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  Multilingual AI Advisor
                </h3>
                <p className="text-xs text-gray-300 font-medium mt-2 leading-relaxed">
                  Grounds queries in real time with OpenStreetMap places, WeatherAPI atmospheric forecasts, and Addis transit schedules. Supports full trilingual parity in English, Amharic (አማርኛ), and Afaan Oromoo with voice memo speech recognition.
                </p>
              </div>
              <Link
                to="/assistant"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>Ask GuzoMate AI</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 5. INTERACTIVE SYSTEM PREVIEW SHOWCASE */}
        {/* --------------------------------------------------------------------- */}
        <section id="preview" className="max-w-[1560px] mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[#0c2419]/85 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 p-6 sm:p-10 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                  Interactive Showcase
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Experience Every Module in Real-Time
                </h3>
              </div>

              {/* Preview Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'explore' as const, label: 'Explore Map (Screen-2)' },
                  { id: 'routes' as const, label: 'Corridor Planner (Screen-3)' },
                  { id: 'incidents' as const, label: 'Report Hazard (Screen-7)' },
                  { id: 'emergency' as const, label: 'Emergency 991/907 (Screen-6)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePreviewTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activePreviewTab === tab.id
                        ? 'bg-emerald-500 text-gray-950 shadow-md'
                        : 'bg-white/10 text-gray-300 hover:bg-white/15'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Preview Container */}
            <div className="mt-6">
              {activePreviewTab === 'explore' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Verified Healthcare Facility
                    </span>
                    <h4 className="text-xl font-extrabold text-white">
                      St. Paul&apos;s Hospital Millennium Medical College
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Replicates <code>screen-2.png</code>: Displays Elevation (2,410m), Oxygen Reserve (Available 100%), Status (Open 24/7), multilingual staff (English, አማርኛ, Oromoo), and emergency phone (011 275 0125).
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <Link
                        to="/explore"
                        className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-xl shadow-md transition-colors"
                      >
                        Open Explore Map View →
                      </Link>
                    </div>
                  </div>
                  <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-emerald-500/20 p-5 space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span>GPS Telemetry: <strong>Bole Medhane Alem</strong></span>
                      <span className="font-mono text-[10px] bg-black/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Alt: 2,355m</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-black/30 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-gray-400 font-bold uppercase">Elevation</span>
                        <span className="font-bold text-white">2,410 m</span>
                      </div>
                      <div className="p-2.5 bg-black/30 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-gray-400 font-bold uppercase">Oxygen Reserve</span>
                        <span className="font-bold text-emerald-400">100% Avail</span>
                      </div>
                      <div className="p-2.5 bg-black/30 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-gray-400 font-bold uppercase">Trauma Status</span>
                        <span className="font-bold text-white">Level-1 24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'routes' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Highland Corridor Planner
                    </span>
                    <h4 className="text-xl font-extrabold text-white">
                      A2 Corridor: Addis – Debre Birhan – Dessie
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Replicates <code>screen-3.png</code>: Displays Elevation Ridge (3,120m at Termaber Pass), 128 km distance, 2h 25m transit time, 94% smooth asphalt with Legetafo resurfacing warning, Sheno Dairy & Depot waypoints, and heavy tow recovery unit.
                    </p>
                    <Link
                      to="/routes"
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-xl shadow-md transition-colors"
                    >
                      <span>Launch Corridor Planner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-emerald-500/20 p-5 space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Termaber Summit Ridge Pass</span>
                      <span className="font-mono text-amber-400 font-bold text-xs">Max Ridge: 3,120m</span>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-white">Sheno Dairy & Depot</span>
                        <span className="text-[11px] text-gray-400">Fresh highland yogurt & diesel refill point</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        100% Stock
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'incidents' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                      5-Step Hazard Reporting
                    </span>
                    <h4 className="text-xl font-extrabold text-white">
                      Report Escarpment Hazard & Roadblock
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Replicates <code>screen-7.png</code>: Includes category cards (Rockfall, Fog, Mudslide, Breakdown, Livestock, Bottleneck), kilometer posts (`Km 98.4`), barometric altitude lock (`3,120m`), dual-script description with quick attribute chips, and direct dispatch to Federal Police (991).
                    </p>
                    <Link
                      to="/incidents/report"
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                    >
                      <span>Open Report Form</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-red-500/30 p-5 space-y-3 backdrop-blur-md">
                    <div className="p-3 bg-black/40 rounded-xl border border-red-500/30 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Termaber Hairpin Curve #4 (ተርማበር ዋ) • Km 98.4
                        </span>
                        <p className="text-xs text-gray-300 mt-1">
                          Three large basalt boulders fell from cliff. Descending lane blocked with mud slurry. 14 scout confirmations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'emergency' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                      24/7 Priority Hotline Directory
                    </span>
                    <h4 className="text-xl font-extrabold text-white">
                      Federal Highway Police & Ambulance Dispatch
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Replicates <code>screen-6.png</code>: Direct call lines for Police (991, Patrol Sector A2 Legetafo), Ambulance (907, Tikur Anbessa ICU transfer), Red Cross (922), and 11°C highland chill apparel alert.
                    </p>
                    <Link
                      to="/emergency"
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-xl shadow-md transition-colors"
                    >
                      <span>View Emergency Directory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-emerald-500/20 p-5 space-y-2 backdrop-blur-md">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">Federal Highway Police</span>
                        <span className="text-[10px] text-gray-400 block">Assigned: Cruiser Unit 04 • Sector A2 Legetafo</span>
                      </div>
                      <span className="font-mono text-base font-black text-emerald-400">991</span>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">National Ambulance Service</span>
                        <span className="text-[10px] text-gray-400 block">Level 1 Trauma EMT • O2 Equipped</span>
                      </div>
                      <span className="font-mono text-base font-black text-emerald-400">907</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 6. WEATHER & ATMOSPHERIC RADAR */}
        {/* --------------------------------------------------------------------- */}
        <section id="weather" className="max-w-[1560px] mx-auto px-4 sm:px-6 py-8">
          <div className="bg-[#0c2419]/80 backdrop-blur-2xl rounded-2xl border border-emerald-500/30 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CloudSun className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-black text-white">21°C</span>
                  <span className="text-xs font-bold text-gray-300">• Addis Basin Atmosphere</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Apparel Alert
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  <strong>Mountain fog alert on Entoto Pass (8 km North)</strong>: Visibility reduced under 40m. Dew point: 4°C • Barometric pressure: 746 hPa.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-400">
                  <span>Altitude Advisory: <strong>2,355m – 3,020m</strong></span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-400">Recommended: Gabi / warm woolen shawl for evening chill</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/emergency"
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-colors"
              >
                Priority Dials (991 / 907)
              </Link>
              <Link
                to="/routes"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black rounded-xl transition-colors"
              >
                Route Advisories
              </Link>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 7. STRATEGIC HIGHWAY CORRIDORS BREAKDOWN */}
        {/* --------------------------------------------------------------------- */}
        <section id="corridors" className="max-w-[1560px] mx-auto px-4 sm:px-6 py-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              Highway Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
              Strategic National Travel Corridors
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
              Real-time monitoring across Ethiopia&apos;s most vital highland arteries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Corridor A2 */}
            <div className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    A2 CORRIDOR
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">Ridge: 3,120m</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Addis Ababa – Debre Birhan – Dessie
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  128 km • 2h 25m estimated transit. Asphalt 94% smooth with Legetafo resurfacing warning. 3 verified diesel stations open.
                </p>
              </div>
              <Link
                to="/routes"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>View A2 Corridor Telemetry</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Corridor A1 */}
            <div className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    A1 EXPRESSWAY
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">Grade: Separated</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Addis Ababa – Mojo – Hawassa Expressway
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  275 km • 3h 15m. Modern 6-lane toll bypass with Telebirr QR fast lanes and direct access to Lake Hawassa resorts.
                </p>
              </div>
              <Link
                to="/routes"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>View A1 Expressway Details</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Corridor A3 */}
            <div className="p-6 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    A3 CORRIDOR
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">Ridge: 2,450m</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Addis Ababa – Ambo – Nekemte
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  330 km • 4h 40m. Western trade corridor with Ambo mineral halts, winding mountain curves, and heavy transport depots.
                </p>
              </div>
              <Link
                to="/routes"
                className="mt-6 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>View A3 Western Route</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 8. EMERGENCY PRIORITY DIRECT DIAL DIRECTORY */}
        {/* --------------------------------------------------------------------- */}
        <section id="emergency" className="max-w-[1560px] mx-auto px-4 sm:px-6 py-12">
          <div className="bg-[#0c2419]/85 backdrop-blur-2xl rounded-3xl border border-red-500/30 p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    24/7 Priority Emergency Directory (Screen-6)
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Toll-free direct lines with instant GPS coordinates transmission to patrol commanders.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full">
                24/7 Monitored
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-white text-xs">Federal Highway Police</span>
                  <span className="text-[10px] text-gray-400">Escarpment Patrol Cruiser 04</span>
                </div>
                <a href="tel:991" className="font-mono text-xl font-black text-emerald-400 hover:underline">
                  991
                </a>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-white text-xs">National Ambulance</span>
                  <span className="text-[10px] text-gray-400">Level-1 Trauma O2 Equipped</span>
                </div>
                <a href="tel:907" className="font-mono text-xl font-black text-emerald-400 hover:underline">
                  907
                </a>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-white text-xs">Red Cross Response</span>
                  <span className="text-[10px] text-gray-400">Mountain 4WD Rescue</span>
                </div>
                <a href="tel:922" className="font-mono text-xl font-black text-red-400 hover:underline">
                  922
                </a>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-white text-xs">Heavy Recovery & Tow</span>
                  <span className="text-[10px] text-gray-400">Termaber Summit Winch</span>
                </div>
                <a href="tel:939" className="font-mono text-xl font-black text-amber-400 hover:underline">
                  939
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 9. TRAVEL SAFETY TIPS & FAQS */}
        {/* --------------------------------------------------------------------- */}
        <section id="faq" className="max-w-[1560px] mx-auto px-4 sm:px-6 py-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              Travel Advisory
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
              Highland Navigation FAQs & Safety Guide
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
              Essential knowledge for crossing high-altitude ridges and escarpments in Ethiopia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>How does GuzoMate verify road hazards?</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                When a scout or driver submits a report with barometric altitude and photo verification, it enters <strong>PENDING</strong> status. Once endorsed by 3 independent scouts or verified by Highway Police, it immediately promotes to <strong>ACTIVE</strong> and broadcasts over radio telemetry.
              </p>
            </div>

            <div className="p-5 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Can I use GuzoMate offline in remote mountain areas?</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Yes! The application automatically caches Addis Ababa and Sheger corridor OpenStreetMap tiles and verified facility datasets locally, ensuring access to emergency phone numbers, hospital oxygen reserves, and route coordinates even when mobile networks drop.
              </p>
            </div>

            <div className="p-5 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>What precautions should I take on the Termaber Pass?</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Termaber Pass reaches an elevation of 3,120 meters. Dense mountain fog often reduces visibility below 30 meters between 5 PM and 8 AM. Use low fog beams, keep a minimum 60m following distance, and carry a warm gabi or jacket.
              </p>
            </div>

            <div className="p-5 bg-[#0c2419]/80 backdrop-blur-xl rounded-2xl border border-emerald-500/25 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Does the AI Assistant support Amharic and Afaan Oromoo?</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Yes! GuzoMate AI provides full trilingual parity across English, Amharic (አማርኛ), and Afaan Oromoo. You can type queries or record audio voice memos for real-time translation, transit routes, and hospital guidance.
              </p>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 10. CALL TO ACTION FOOTER BANNER */}
        {/* --------------------------------------------------------------------- */}
        <section className="max-w-[1560px] mx-auto px-4 sm:px-6 py-16">
          <div className="bg-gradient-to-br from-[#103824] via-[#0c291b] to-[#05140d] rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-2xl border border-emerald-500/30">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                Begin Your Journey
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Ready to Navigate Ethiopia with Verified Highland Intelligence?
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                Join thousands of travelers, bus drivers, and emergency scouts keeping Ethiopian highways safe and connected.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleLaunchApp}
                  className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-gray-950 text-xs sm:text-sm font-black rounded-xl shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Launch GuzoMate Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/explore"
                  className="py-3 px-5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/20 transition-colors"
                >
                  Open Live Map
                </Link>

                <Link
                  to="/login"
                  className="py-3 px-4 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Scout Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 11. LANDING PAGE FOOTER */}
        {/* --------------------------------------------------------------------- */}
        <footer className="w-full bg-[#05130b]/90 border-t border-emerald-500/20 text-gray-400 text-xs py-6 px-4 sm:px-6">
          <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">GuzoMate Ethiopia v4.8-ET</span>
              <span className="text-[10px] text-gray-500">• OpenStreetMap & PostGIS Powered</span>
            </div>

            <div className="text-[11px] text-gray-400">
              © 2024 GuzoMate — Verified Highland Travel Intelligence. Full Latin, አማርኛ & Afaan Oromo parity.
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <a href="tel:991" className="text-emerald-400 hover:underline">Police 991</a>
              <a href="tel:907" className="text-emerald-400 hover:underline">Ambulance 907</a>
              <a href="tel:922" className="text-red-400 hover:underline">Red Cross 922</a>
              <Link to="/explore" className="text-gray-300 hover:text-white">Explore Map</Link>
              <Link to="/routes" className="text-gray-300 hover:text-white">Corridors</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
