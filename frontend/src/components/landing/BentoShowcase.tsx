import React, { useState } from 'react';
import { TiltCard } from './TiltCard';
import { 
  Radio, 
  WifiOff, 
  Languages, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Zap, 
  Cpu, 
  AlertTriangle 
} from 'lucide-react';
import { soundFX } from '../../lib/audioEffects';

export const BentoShowcase: React.FC = () => {
  const [radarPing, setRadarPing] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);

  const words = [
    { text: 'Explore with Confidence', lang: 'English' },
    { text: 'በልበ ሙሉነት ይጓዙ', lang: 'አማርኛ (ግዕዝ)' },
    { text: 'Of-eeggannoon Imalaa', lang: 'Afaan Oromoo' },
  ];

  const handleRadarClick = () => {
    soundFX.playRadarPing();
    setRadarPing(true);
    setTimeout(() => setRadarPing(false), 800);
  };

  const handleWordMorph = () => {
    soundFX.playClick();
    setWordIdx((prev) => (prev + 1) % words.length);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary-dark text-xs font-bold mb-3 border border-secondary/30">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>Interactive 3D Bento Showcase</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-display font-extrabold text-on-surface tracking-tight">
          Engineered for the Extremes.
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-xl mx-auto">
          Hover and tilt each module in 3D space. Built to withstand sudden mountain pass blockages, zero connectivity, and high-altitude emergencies.
        </p>
      </div>

      {/* 4-Item 3D Tilt Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: 360° Radar (2-column span on medium+) */}
        <TiltCard 
          onClick={handleRadarClick}
          cursorText="SCAN"
          className="md:col-span-2 bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-highland p-6 sm:p-8 flex flex-col justify-between overflow-hidden group"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-md">
                <Radio className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-wider">
                  TELEMETRY // V4.2
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-on-surface">
                  360° Real-Time Hazard Radar
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              RADAR ACTIVE
            </span>
          </div>

          <p className="text-sm text-on-surface-variant max-w-lg mb-8 leading-relaxed">
            Continuous microwave sensor sweep detecting rockfalls, fog thickness below 30 meters, and escarpment erosion before your vehicle reaches the mountain pass.
          </p>

          {/* Graphical Animated Radar HUD Strip */}
          <div className="bg-stone-900 rounded-2xl p-4 text-emerald-400 font-mono text-xs border border-emerald-900 shadow-inner flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-emerald-500 animate-spin flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <p className="text-[10px] text-stone-400">TARGET BEACON SCAN:</p>
                <p className="text-emerald-300 font-bold">A2 HIGHLAND TUNNEL // 0 HAZARDS</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-stone-400 text-[11px]">
              <span>SWEEP FREQ: 9.4 GHz</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">CLICK TO PING RADAR</span>
            </div>
          </div>
        </TiltCard>

        {/* Card 2: Offline Zero-Rated Mesh */}
        <TiltCard 
          cursorText="SIGNAL"
          className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-highland p-6 sm:p-8 flex flex-col justify-between overflow-hidden group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-700 text-white flex items-center justify-center font-bold shadow-md mb-4">
              <WifiOff className="w-6 h-6 text-cyan-200" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-800 uppercase tracking-wider">
              OFFLINE PROTOCOL
            </span>
            <h3 className="text-lg font-display font-bold text-on-surface mt-1">
              Zero-Rated SMS Fallback
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              When mountain cellular data drops to zero in deep gorges, critical coordinates, weather, and SOS beacons transmit via zero-rated SMS networks.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs font-mono text-ash">
            <span>OFFLINE CACHE: 100%</span>
            <span className="text-primary font-bold">DATA FREE</span>
          </div>
        </TiltCard>

        {/* Card 3: Trilingual Parity Engine */}
        <TiltCard 
          onClick={handleWordMorph}
          cursorText="MORPH"
          className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-highland p-6 sm:p-8 flex flex-col justify-between overflow-hidden group cursor-pointer"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center font-bold shadow-md mb-4">
              <Languages className="w-6 h-6 text-amber-200" />
            </div>
            <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-wider">
              CULTURAL PARITY
            </span>
            <h3 className="text-lg font-display font-bold text-on-surface mt-1">
              Trilingual Optical Harmony
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Optical metric line-height expansion ensures Latin, Ge'ez, and Qubee scripts render with mathematical and typographic equilibrium.
            </p>
          </div>

          {/* Interactive Word Morpher */}
          <div className="mt-6 p-3 rounded-2xl bg-primary text-white text-center shadow-md">
            <p className="text-xs font-mono text-emerald-200 font-bold mb-1">
              [{words[wordIdx].lang}]:
            </p>
            <p className="text-sm font-bold truncate">
              "{words[wordIdx].text}"
            </p>
            <span className="text-[9px] text-emerald-300 opacity-75 mt-1 block">
              Tap to cycle language
            </span>
          </div>
        </TiltCard>

        {/* Card 4: Emergency Lifeline (2-col span on medium+) */}
        <TiltCard 
          cursorText="DISPATCH"
          className="md:col-span-2 bg-gradient-to-r from-red-900 to-primary text-white rounded-3xl border border-red-500/50 shadow-highland p-6 sm:p-8 flex flex-col justify-between overflow-hidden group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg">
                <PhoneCall className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-red-200 uppercase tracking-wider">
                  24/7 FIRST RESPONDERS
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                  Direct Toll-Free Emergency Dispatch
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-red-100 bg-red-800/80 px-3 py-1 rounded-full border border-red-400">
              PRIORITY DIRECT DIAL
            </span>
          </div>

          <p className="text-sm text-red-100 max-w-lg mb-6 leading-relaxed">
            One-touch automated coordinate broadcast to Federal Police (991), Medical Trauma Ambulances (907), and Mountain Search &amp; Rescue units.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <a
              href="tel:991"
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-center transition-colors"
            >
              <span className="text-[10px] text-red-200 block">Federal Police</span>
              <span className="text-lg font-display font-extrabold text-white">991</span>
            </a>
            <a
              href="tel:907"
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-center transition-colors"
            >
              <span className="text-[10px] text-red-200 block">Ambulance</span>
              <span className="text-lg font-display font-extrabold text-white">907</span>
            </a>
            <a
              href="tel:922"
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-center transition-colors"
            >
              <span className="text-[10px] text-red-200 block">Red Cross</span>
              <span className="text-lg font-display font-extrabold text-white">922</span>
            </a>
          </div>
        </TiltCard>

      </div>

    </section>
  );
};
