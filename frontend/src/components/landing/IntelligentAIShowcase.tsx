import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Cpu, 
  Radio, 
  Languages, 
  ThermometerSnowflake, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  Activity,
  Shield,
  RotateCw
} from 'lucide-react';
import { soundFX } from '../../lib/audioEffects';

export const IntelligentAIShowcase: React.FC = () => {
  const { language } = useAppStore();

  // LAB 1 STATE: Neural Radar & Obstacle Solver
  const [radarHazard, setRadarHazard] = useState<'none' | 'rockfall' | 'fog' | 'landslide'>('none');
  const [radarAngle, setRadarAngle] = useState<number>(0);
  const [isComputingPath, setIsComputingPath] = useState<boolean>(false);
  const [detourLocked, setDetourLocked] = useState<boolean>(false);

  // LAB 2 STATE: Neural Multilingual Synapse
  const [activeSpeechQuery, setActiveSpeechQuery] = useState<number>(0);
  const [isAudioTranscribing, setIsAudioTranscribing] = useState<boolean>(false);
  const [translationStep, setTranslationStep] = useState<'en' | 'am' | 'om'>('en');

  // LAB 3 STATE: Elevation Dial & Bio-Shield
  const [elevationSlider, setElevationSlider] = useState<number>(2355);

  // Radar continuous rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Handle Lab 1 Obstacle Trigger
  const triggerHazard = (type: 'rockfall' | 'fog' | 'landslide') => {
    soundFX.playClick();
    setRadarHazard(type);
    setIsComputingPath(true);
    setDetourLocked(false);

    // AI computes 3 candidate splines, locks optimal green vector in 1.2s
    setTimeout(() => {
      soundFX.playRadarPing();
      setIsComputingPath(false);
      setDetourLocked(true);
      soundFX.playNeuralSuccess();
    }, 1200);
  };

  const clearHazard = () => {
    soundFX.playClick();
    setRadarHazard('none');
    setIsComputingPath(false);
    setDetourLocked(false);
  };

  // Lab 2 Speech queries
  const speechSamples = [
    {
      id: 0,
      en: "Find 24/7 pharmacy near Bole with altitude relief (Acetazolamide)",
      am: "ቦሌ አቅራቢያ ለ24 ሰዓት ክፍት የሆነ የከፍታ ማስታገሻ መድኃኒት ያለው ፋርማሲ ፈልግ",
      om: "Boolee biratti faarmasii sa'aatii 24 banaa ta'ee fi qoricha olka'iinsaa qabu bari",
      tag: "Pharmacy & Health"
    },
    {
      id: 1,
      en: "Is Termaber Hairpin tunnel pass open and safe for travel today?",
      am: "የተርማበር መተላለፊያ ዋሻ መንገድ ዛሬ ክፍት እና ደህንነቱ የተጠበቀ ነው?",
      om: "Daandiin holqa Tarmaabar har'a banaa fi nageenyi isaa eegamaadha?",
      tag: "Mountain Pass"
    },
    {
      id: 2,
      en: "Where is the freshest single-origin Sidama traditional Buna roasted?",
      am: "ትኩስ የሲዳማ ባህላዊ የቡና ቁርስ የት ይገኛል?",
      om: "Buna aadaa Sidaamaa haaraa baqfamu eessatti arganna?",
      tag: "Cultural Cuisine"
    }
  ];

  const handleQueryTrigger = (idx: number) => {
    setActiveSpeechQuery(idx);
    setIsAudioTranscribing(true);
    setTranslationStep('en');

    // Morph EN -> AM -> OM visually
    setTimeout(() => setTranslationStep('am'), 700);
    setTimeout(() => setTranslationStep('om'), 1600);
    setTimeout(() => setIsAudioTranscribing(false), 2400);
  };

  // Lab 3 calculations based on elevationSlider (1600m to 3200m)
  const calcTemp = Math.round(30 - ((elevationSlider - 1600) / 1600) * 22);
  const calcOxygen = Math.round(99 - ((elevationSlider - 1600) / 1600) * 20);
  const isExtremeHighland = elevationSlider > 2750;

  return (
    <section id="ai-graphical-lab" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold mb-3 border border-secondary/30">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          <span>Interactive AI Graphical Telemetry &amp; Radar Engine</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-on-surface tracking-tight">
          {language === 'am'
            ? 'ብልህ የጉዞ ረዳት በምስልና በራዳር'
            : language === 'om'
            ? 'Gargaarsa Imalaa AI Agarsiisa Saayinsiitiin'
            : 'Intelligence in Motion.'}
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-xl mx-auto">
          Explore three interactive live simulations below. Test the 360° obstacle avoidance radar, observe neural script morphing, and dial elevation to see dynamic gear deployment.
        </p>
      </div>

      {/* Grid of 3 Interactive Graphical Labs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ========================================================
            LAB 1: 360° Neural Radar & Autonomous Detour Solver
            ======================================================== */}
        <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 shadow-highland p-5 flex flex-col justify-between relative overflow-hidden">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">
                  <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-primary">Neural Radar &amp; Detour</h3>
                  <p className="text-[10px] text-ash font-mono">RADAR-V3.8 // 360° SCAN</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                ACTIVE
              </span>
            </div>

            {/* Circular Radar Canvas / SVG Graphic */}
            <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-stone-900 rounded-full border-2 border-emerald-900 shadow-inner flex items-center justify-center overflow-hidden">
              
              {/* Concentric distance rings */}
              <div className="absolute inset-4 rounded-full border border-emerald-800/40" />
              <div className="absolute inset-12 rounded-full border border-emerald-800/40" />
              <div className="absolute inset-20 rounded-full border border-emerald-800/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-emerald-800/30" />
                <div className="h-full w-px bg-emerald-800/30 absolute" />
              </div>

              {/* Rotating Radar Beam */}
              <div 
                className="absolute inset-0 origin-center pointer-events-none"
                style={{ transform: `rotate(${radarAngle}deg)` }}
              >
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-emerald-500/25 origin-right" />
              </div>

              {/* Road Line Across Radar */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                {/* Normal Road */}
                <path 
                  d="M 20,100 L 180,100" 
                  stroke={radarHazard !== 'none' ? '#717973' : '#10b981'} 
                  strokeWidth="3" 
                  strokeDasharray={radarHazard !== 'none' ? '4,4' : 'none'}
                />

                {/* AI Candidate Splines (When Computing) */}
                {isComputingPath && (
                  <>
                    <path d="M 50,100 Q 100,40 150,100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
                    <path d="M 50,100 Q 100,160 150,100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
                  </>
                )}

                {/* Green Locked Optimal Bypass Spline */}
                {detourLocked && (
                  <path 
                    d="M 40,100 C 70,100 80,45 100,45 C 120,45 130,100 160,100" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3.5" 
                    className="animate-dash-flow"
                    strokeDasharray="6,6"
                  />
                )}

                {/* Hazard Target Lock Indicator on Radar */}
                {radarHazard !== 'none' && (
                  <g transform="translate(100, 100)">
                    <circle r="12" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping" />
                    <circle r="7" fill="#ef4444" />
                    <text x="0" y="-14" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {radarHazard.toUpperCase()}
                    </text>
                  </g>
                )}
              </svg>

              {/* Center Vehicle Beacon Dot */}
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg z-10" />
            </div>

            {/* Radar Telemetry Live Ticker */}
            <div className="mt-4 p-2.5 rounded-xl bg-surface-low border border-outline-variant/30 flex items-center justify-between text-[11px] font-mono">
              <span className="text-ash">OBSTACLE DIST:</span>
              <span className="font-bold text-on-surface">
                {radarHazard !== 'none' ? '120 m (LOCKED)' : '0 m (CLEAR)'}
              </span>
              <span className="text-ash">RISK INDEX:</span>
              <span className={`font-bold ${radarHazard !== 'none' && !detourLocked ? 'text-red-600' : 'text-emerald-700'}`}>
                {radarHazard !== 'none' && !detourLocked ? '0.84 HIGH' : '0.02 MINIMAL'}
              </span>
            </div>
          </div>

          {/* Interactive Trigger Buttons */}
          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-2">
            <p className="text-[10px] font-bold text-ash tracking-wider uppercase text-center">
              Tap To Trigger Hazard Simulation:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => triggerHazard('rockfall')}
                className="px-2 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold border border-red-200 transition-all flex flex-col items-center gap-0.5"
              >
                <span>🪨 Rockfall</span>
                <span className="text-[9px] text-red-600">A2 Pass</span>
              </button>
              <button
                onClick={() => triggerHazard('fog')}
                className="px-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 transition-all flex flex-col items-center gap-0.5"
              >
                <span>🌫️ Dense Fog</span>
                <span className="text-[9px] text-amber-600">&lt;30m Vis</span>
              </button>
              <button
                onClick={clearHazard}
                className="px-2 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-all flex flex-col items-center justify-center"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[9px]">Reset Road</span>
              </button>
            </div>
          </div>

        </div>


        {/* ========================================================
            LAB 2: Real-time Multilingual Neural Synapse
            ======================================================== */}
        <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 shadow-highland p-5 flex flex-col justify-between relative overflow-hidden">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-xs">
                  <Languages className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-primary">Multilingual Neural Morph</h3>
                  <p className="text-[10px] text-ash font-mono">LATIN ⇄ GE'EZ ⇄ QUBEE</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                SYNAPSE
              </span>
            </div>

            {/* Simulated Live Audio Waveform Bars */}
            <div className="bg-surface-low rounded-2xl p-4 border border-outline-variant/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Volume2 className="w-4 h-4 text-secondary animate-pulse" />
                  <span>Acoustic Waveform Input</span>
                </div>
                <span className="text-[10px] font-mono text-ash bg-white px-2 py-0.5 rounded border border-outline-variant/30">
                  44.1 kHz FLAC
                </span>
              </div>

              {/* Visual Dynamic Audio Frequency Spectrum */}
              <div className="h-10 flex items-end justify-between gap-1 px-1">
                {[40, 75, 90, 60, 100, 45, 80, 95, 30, 70, 85, 55, 90, 65, 40].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-secondary rounded-t transition-all duration-150"
                    style={{
                      height: isAudioTranscribing ? `${Math.max(15, (h * Math.random()) + 20)}%` : `${h * 0.4}%`,
                      opacity: isAudioTranscribing ? 1 : 0.45,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Dynamic Morphing Translation HUD Card */}
            <div className="mt-4 p-4 rounded-2xl bg-primary text-white space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-emerald-200 border-b border-white/15 pb-2">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-secondary-light" />
                  Active Neural Token:
                </span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded uppercase">
                  {translationStep === 'en' ? 'English (Latin)' : translationStep === 'am' ? 'አማርኛ (ግዕዝ)' : 'Afaan Oromoo (Qubee)'}
                </span>
              </div>

              {/* Dynamic Text Morph */}
              <p className="text-sm font-semibold leading-relaxed min-h-[4rem] transition-all duration-300">
                {translationStep === 'en' && speechSamples[activeSpeechQuery].en}
                {translationStep === 'am' && speechSamples[activeSpeechQuery].am}
                {translationStep === 'om' && speechSamples[activeSpeechQuery].om}
              </p>

              {/* Guild Verified Checkmark */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-200">
                <span className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary-light" />
                  Highland Guild Verified
                </span>
                <span className="font-mono opacity-75">Confidence: 99.8%</span>
              </div>
            </div>
          </div>

          {/* Interactive Query Triggers */}
          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-2">
            <p className="text-[10px] font-bold text-ash tracking-wider uppercase text-center">
              Select Query To Test Neural Morph:
            </p>
            <div className="space-y-1.5">
              {speechSamples.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleQueryTrigger(idx)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${
                    activeSpeechQuery === idx
                      ? 'bg-secondary/15 text-secondary-dark border-secondary/40 font-bold'
                      : 'bg-surface-low text-on-surface hover:bg-surface-high border-outline-variant/30'
                  }`}
                >
                  <span className="truncate">{item.tag}</span>
                  <span className="text-[10px] opacity-75">▶ Morph</span>
                </button>
              ))}
            </div>
          </div>

        </div>


        {/* ========================================================
            LAB 3: Dynamic Altitude & Microclimate Acclimatization Dial
            ======================================================== */}
        <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 shadow-highland p-5 flex flex-col justify-between relative overflow-hidden">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-tertiary text-white flex items-center justify-center font-bold text-xs">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-primary">Altitude Bio-Shield</h3>
                  <p className="text-[10px] text-ash font-mono">1,600m — 3,200m a.s.l.</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isExtremeHighland ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-cyan-100 text-cyan-800'
              }`}>
                {isExtremeHighland ? 'HIGH ALTITUDE' : 'BALANCED'}
              </span>
            </div>

            {/* Interactive Elevation Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ash font-medium">Drag to change altitude:</span>
                <span className="text-base font-extrabold font-display text-primary">
                  {elevationSlider.toLocaleString()} m
                </span>
              </div>
              
              <input
                type="range"
                min="1600"
                max="3200"
                step="25"
                value={elevationSlider}
                onChange={(e) => setElevationSlider(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-high rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-ash font-mono">
                <span>1,600m (Rift Valley)</span>
                <span>2,355m (Addis)</span>
                <span>3,200m (Entoto Pass)</span>
              </div>
            </div>

            {/* Dynamic Environmental Meters */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              
              {/* Temperature Meter */}
              <div className="p-3 rounded-2xl bg-surface-low border border-outline-variant/40 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                  calcTemp < 12 ? 'bg-blue-600' : 'bg-amber-600'
                }`}>
                  <ThermometerSnowflake className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-ash font-medium">Temperature</p>
                  <p className="text-base font-bold font-display text-on-surface">{calcTemp}°C</p>
                </div>
              </div>

              {/* O2 Saturation Bar */}
              <div className="p-3 rounded-2xl bg-surface-low border border-outline-variant/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-ash font-medium">O2 Density</p>
                  <p className="text-base font-bold font-display text-on-surface">{calcOxygen}%</p>
                </div>
              </div>

            </div>

            {/* Dynamic Gear Auto-Dispenser */}
            <div className="mt-4 p-3 rounded-2xl bg-surface-low/80 border border-outline-variant/40 space-y-2">
              <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-secondary" />
                Auto-Dispensed Highland Survival Kit:
              </p>
              
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                {isExtremeHighland ? (
                  <>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <span>🧣 Traditional Gabi Wrap</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-900 border border-red-300 flex items-center gap-1">
                      <span>💊 Acetazolamide (Diamox)</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <span>☕ Steaming Sidama Buna</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <span>🧥 Lightweight Windbreaker</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-300 flex items-center gap-1">
                      <span>💧 Hydration Pack</span>
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>

          <div className="mt-4 pt-2 text-center text-[10px] text-ash">
            <span>Highland microclimate data refreshed with Ethiopian Meteorological Institute specs.</span>
          </div>

        </div>

      </div>

    </section>
  );
};
