import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Compass, 
  MapPin, 
  ArrowRight, 
  Navigation, 
  CloudSun, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LandingHero: React.FC = () => {
  const { setPageView, language } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isHoveringLaunch, setIsHoveringLaunch] = useState(false);

  const quickDestinations = [
    { nameEn: 'Entoto Ridge Pass', nameAm: 'እንጦጦ ተራራ', alt: '3,020 m' },
    { nameEn: 'Hawassa Expressway', nameAm: 'ሀዋሳ የፍጥነት መንገድ', alt: '1,685 m' },
    { nameEn: 'Debre Birhan Corridor', nameAm: 'ደብረ ብርሃን ኮሪደር', alt: '2,840 m' },
    { nameEn: 'Bole Medhane Alem', nameAm: 'ቦሌ መድኃኔዓለም', alt: '2,355 m' },
  ];

  const handleLaunchApp = (destName?: string) => {
    // Fire celebratory Highland green/amber confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1b4332', '#d97706', '#0e7490', '#c1ecd4'],
    });

    if (destName) {
      setSearchQuery(destName);
    }

    setTimeout(() => {
      setPageView('app');
    }, 400);
  };

  const scrollToSimulators = () => {
    const el = document.getElementById('multimodal-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-visible">
      
      {/* Top Highland Status Badge */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-outline-variant/60 shadow-sm backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-primary tracking-wide">
            Verified Highland Travel Intelligence
          </span>
          <span className="text-outline-variant">•</span>
          <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Route Radar Active
          </span>
        </div>
      </div>

      {/* Main Hero Headline & Value Proposition */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-on-surface tracking-tight leading-[1.1]">
          {language === 'am' ? (
            <>
              በከፍታዎች መካከል <br />
              <span className="text-primary bg-clip-text">በልበ ሙሉነት ይጓዙ።</span>
            </>
          ) : language === 'om' ? (
            <>
              Tulluuwwan Gidduu <br />
              <span className="text-primary bg-clip-text">Of-eeggannoon Imalaa.</span>
            </>
          ) : (
            <>
              Explore Ethiopia With <br />
              <span className="text-primary bg-clip-text">Highland Precision.</span>
            </>
          )}
        </h1>

        <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed">
          {language === 'am'
            ? 'አስተማማኝ የከፍታና የአየር ሁኔታ መረጃ፣ የማህበረሰብ የተረጋገጠ የመንገድ አደጋ ራዳር፣ እና በቋንቋዎ የተዘጋጀ ብልህ የጉዞ ረዳት።'
            : language === 'om'
            ? 'Odeeffannoo qilleensaa fi olka\'iinsa amansiisaa, balaa daandii hawaasaan mirkanaa\'ee fi gargaaraa imalaa afaan keessaniin.'
            : 'Terrain-aware high-altitude routing, crowdsourced road hazard radar, and intelligent guidance calibrated for every mountain pass.'}
        </p>
      </div>

      {/* Interactive Floating Search & Location Dock */}
      <div className="mt-10 max-w-3xl mx-auto">
        <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-outline-variant/50 shadow-highland space-y-3">
          
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Input field */}
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-ash absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLaunchApp(searchQuery)}
                placeholder={
                  language === 'am'
                    ? 'ወዴት መጓዝ ይፈልጋሉ? (ለምሳሌ፦ እንጦጦ፣ ሀዋሳ፣ ደብረ ብርሃን...)'
                    : 'Where do you want to journey? (e.g., Entoto, Hawassa, Debre Birhan...)'
                }
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-low border border-transparent focus:border-primary focus:bg-white text-sm font-medium text-on-surface transition-all outline-none"
              />
            </div>

            {/* Launch Map CTA */}
            <button
              onClick={() => handleLaunchApp(searchQuery)}
              onMouseEnter={() => setIsHoveringLaunch(true)}
              onMouseLeave={() => setIsHoveringLaunch(false)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-highland flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] group whitespace-nowrap"
            >
              <Compass className={`w-4 h-4 transition-transform duration-500 ${isHoveringLaunch ? 'rotate-180' : ''}`} />
              <span>Launch Map</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Destination Chips & Location Sensor */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 text-xs">
            <div className="flex items-center gap-1.5 text-ash font-medium">
              <Navigation className="w-3.5 h-3.5 text-primary" />
              <span>Current GPS:</span>
              <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                Bole, Addis Ababa (2,355 m a.s.l.)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-ash font-medium text-[11px]">Popular:</span>
              {quickDestinations.map((dest) => (
                <button
                  key={dest.nameEn}
                  onClick={() => handleLaunchApp(dest.nameEn)}
                  className="px-2.5 py-1 rounded-lg bg-surface-low hover:bg-surface-high text-on-surface font-semibold text-[11px] border border-outline-variant/30 transition-all flex items-center gap-1"
                >
                  <span>{language === 'am' ? dest.nameAm : dest.nameEn}</span>
                  <span className="text-ash font-mono text-[9px]">{dest.alt}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Microclimate & Clothing Advisory HUD Banner */}
      <div className="mt-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Microclimate Card */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-secondary border border-amber-200/50 flex items-center justify-center flex-shrink-0">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-display text-on-surface">19°C</span>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-high text-on-surface-variant font-semibold">
                Partly Cloudy
              </span>
            </div>
            <p className="text-[11px] text-ash mt-0.5">
              Addis Corridor • Alt: 2,355 m — 2,840 m
            </p>
          </div>
        </div>

        {/* Highland Travel Clothing Advice */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-primary border border-emerald-200/50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">dry_cleaning</span>
          </div>
          <div>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary" />
              Highland Clothing Advisory
            </span>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5 line-clamp-2">
              Chilly evening ahead. Traditional <strong className="text-primary font-bold">Gabi</strong> or windbreaker advised as temp drops to 11°C.
            </p>
          </div>
        </div>

        {/* Guild Hazard Radar */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 border border-orange-200/50 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-800">A2 Corridor Status</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
                Clear
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5 line-clamp-2">
              Termaber Hairpin Pass open. Verified by drivers guild 24 mins ago.
            </p>
          </div>
        </div>

      </div>

      {/* Downward Simulator Teaser Prompt */}
      <div className="mt-10 flex flex-col items-center justify-center gap-2">
        <button
          onClick={scrollToSimulators}
          className="group flex flex-col items-center text-xs font-bold text-ash hover:text-primary transition-colors cursor-pointer"
        >
          <span className="tracking-widest uppercase text-[10px] text-ash group-hover:text-primary">
            Explore Interactive Travel &amp; AI Simulators
          </span>
          <ChevronDown className="w-4 h-4 text-primary animate-bounce mt-1" />
        </button>
      </div>

    </section>
  );
};
