import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Car, 
  Footprints, 
  Train, 
  Bot, 
  Zap, 
  Sun, 
  CloudFog, 
  CloudLightning, 
  Sparkles, 
  ShieldAlert, 
  Flame,
  Lightbulb,
  CornerDownRight
} from 'lucide-react';
import { soundFX } from '../../lib/audioEffects';

type Mode = 'car' | 'train' | 'walking' | 'ai';
type Weather = 'sunny' | 'fog' | 'storm';

export const InteractiveTravelArcade: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('car');
  const [weather, setWeather] = useState<Weather>('sunny');
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [trackSwitch, setTrackSwitch] = useState<'trackA' | 'trackB'>('trackA');
  const [inclineSlope, setInclineSlope] = useState(12);
  const [obstacleDropped, setObstacleDropped] = useState(false);
  const [aiLaserScanning, setAiLaserScanning] = useState(false);
  const [aiBypassLocked, setAiBypassLocked] = useState(false);

  // Speedometer calculation
  const [speed, setSpeed] = useState(65);

  useEffect(() => {
    let interval: number;
    if (isAccelerating) {
      interval = window.setInterval(() => {
        setSpeed((prev) => Math.min(prev + 4, 145));
      }, 50);
    } else {
      interval = window.setInterval(() => {
        setSpeed((prev) => {
          const base = activeMode === 'car' ? 65 : activeMode === 'train' ? 110 : activeMode === 'walking' ? 5 : 80;
          return prev > base ? prev - 2 : prev < base ? prev + 1 : base;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAccelerating, activeMode]);

  // Handle Drop Obstacle in AI Mode
  const handleDropObstacle = () => {
    soundFX.playClick();
    setObstacleDropped(true);
    setAiLaserScanning(true);
    setAiBypassLocked(false);

    // AI scans obstacle and calculates bypass splines automatically
    setTimeout(() => {
      soundFX.playRadarPing();
      setAiLaserScanning(false);
      setAiBypassLocked(true);
      soundFX.playNeuralSuccess();
    }, 1100);
  };

  const handleClearObstacle = () => {
    soundFX.playClick();
    setObstacleDropped(false);
    setAiLaserScanning(false);
    setAiBypassLocked(false);
  };

  return (
    <section 
      id="interactive-travel-arcade" 
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
          <span>Interactive Multi-Modal Travel Arcade</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-display font-extrabold text-on-surface tracking-tight">
          How Do You Journey?
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-xl mx-auto">
          Test interactive physics, vehicle mechanics, and real-time AI obstacle avoidance. Choose a mode below and take control.
        </p>
      </div>

      {/* Main Arcade Frame */}
      <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-floating overflow-hidden">
        
        {/* Top Control Bar: Mode Selector & Weather Switcher */}
        <div className="bg-surface-low border-b border-outline-variant/40 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Mode Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'car', label: '🚗 4WD Vehicle', icon: <Car className="w-4 h-4 text-emerald-600" /> },
              { id: 'train', label: '🚆 Electric Train', icon: <Train className="w-4 h-4 text-cyan-600" /> },
              { id: 'walking', label: '🚶 Mountain Trekker', icon: <Footprints className="w-4 h-4 text-amber-600" /> },
              { id: 'ai', label: '🤖 Intelligent AI', icon: <Bot className="w-4 h-4 text-purple-600" /> },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  soundFX.playClick();
                  setActiveMode(m.id as Mode);
                }}
                data-interactive="true"
                data-cursor-text={m.id.toUpperCase()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeMode === m.id
                    ? 'bg-primary text-white shadow-highland scale-105'
                    : 'bg-white hover:bg-surface-high text-on-surface border border-outline-variant/40'
                }`}
              >
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Environmental Weather Switcher */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-outline-variant/40 text-xs font-semibold">
            <span className="text-[10px] text-ash px-1.5">Weather:</span>
            {[
              { id: 'sunny', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
              { id: 'fog', icon: <CloudFog className="w-3.5 h-3.5 text-stone-500" /> },
              { id: 'storm', icon: <CloudLightning className="w-3.5 h-3.5 text-blue-500" /> },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  soundFX.playClick();
                  setWeather(w.id as Weather);
                }}
                className={`p-1.5 rounded-xl transition-all ${
                  weather === w.id ? 'bg-primary/10 text-primary scale-110' : 'text-ash hover:text-on-surface'
                }`}
              >
                {w.icon}
              </button>
            ))}
          </div>

        </div>

        {/* Animated Interactive Stage Viewport */}
        <div className={`relative w-full h-80 sm:h-[420px] overflow-hidden transition-colors duration-700 select-none ${
          weather === 'sunny' ? 'bg-gradient-to-b from-[#e3f2fd] via-[#f1f8e9] to-[#fafaf4]' :
          weather === 'fog' ? 'bg-gradient-to-b from-[#cfd8dc] via-[#eceff1] to-[#f5f5f5]' :
          'bg-gradient-to-b from-[#263238] via-[#37474f] to-[#455a64]'
        }`}>
          
          {/* Weather Particles (Fog / Lightning / Rain) */}
          {weather === 'fog' && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] pointer-events-none animate-pulse" />
          )}

          {weather === 'storm' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-blue-950/20" />
              <div className="w-full h-full opacity-60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-300/20 via-transparent to-transparent animate-ping" />
            </div>
          )}

          {/* Animated SVG Mountain Ridges in Parallax */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
            {/* Distant mountains */}
            <path d="M0,220 Q200,120 450,200 T850,150 L1000,190 L1000,400 L0,400 Z" fill="#93c5fd" opacity="0.25" />
            {/* Mid mountain peaks */}
            <path d="M0,260 Q300,180 600,240 T1000,220 L1000,400 L0,400 Z" fill="#86efac" opacity="0.3" />
            {/* Foreground terrain */}
            <path d="M0,320 Q350,250 700,300 T1000,280 L1000,400 L0,400 Z" fill="#1b4332" opacity="0.15" />
          </svg>

          {/* Road / Railway / Trail Vector Paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
            {/* Mode 1 & 4 Road / AI Path */}
            {(activeMode === 'car' || activeMode === 'ai') && (
              <>
                {/* Standard Road */}
                <path
                  d={
                    aiBypassLocked
                      ? "M 40,330 C 200,320 380,180 500,240 C 620,300 780,210 960,260"
                      : "M 40,330 C 250,310 450,250 600,280 C 750,310 850,260 960,260"
                  }
                  fill="none"
                  stroke={aiBypassLocked ? '#10b981' : '#1b4332'}
                  strokeWidth="8"
                  className="transition-all duration-700"
                />
                <path
                  d={
                    aiBypassLocked
                      ? "M 40,330 C 200,320 380,180 500,240 C 620,300 780,210 960,260"
                      : "M 40,330 C 250,310 450,250 600,280 C 750,310 850,260 960,260"
                  }
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray="16,16"
                  className="animate-dash-flow"
                />
              </>
            )}

            {/* Mode 2: Train Tracks (Track A & Track B Switch) */}
            {activeMode === 'train' && (
              <>
                {/* Dual Track Lines */}
                <path
                  d={
                    trackSwitch === 'trackA'
                      ? "M 40,330 L 960,270"
                      : "M 40,330 C 300,330 450,210 960,210"
                  }
                  fill="none"
                  stroke="#475569"
                  strokeWidth="6"
                  className="transition-all duration-700"
                />
                <path
                  d={
                    trackSwitch === 'trackA'
                      ? "M 40,330 L 960,270"
                      : "M 40,330 C 300,330 450,210 960,210"
                  }
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="8,8"
                  className="animate-dash-flow"
                />
              </>
            )}

            {/* Mode 3: Mountain Trail Incline */}
            {activeMode === 'walking' && (
              <path
                d={`M 40,340 C 300,${340 - inclineSlope * 5} 600,${280 - inclineSlope * 4} 960,${220 - inclineSlope * 3}`}
                fill="none"
                stroke="#b45309"
                strokeWidth="5"
                strokeDasharray="6,6"
                className="transition-all duration-500"
              />
            )}

            {/* AI Candidate Beziers when Laser Scanning */}
            {activeMode === 'ai' && aiLaserScanning && (
              <>
                <path d="M 250,310 Q 500,100 750,310" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.8" />
                <path d="M 250,310 Q 500,180 750,310" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.8" />
                <path d="M 250,310 Q 500,260 750,310" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.8" />
              </>
            )}
          </svg>

          {/* Obstacle on Road (For AI Mode) */}
          {activeMode === 'ai' && obstacleDropped && (
            <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center animate-in zoom-in-75">
              <div className="relative">
                {/* Holographic scanning bounding box */}
                {aiLaserScanning && (
                  <div className="absolute -inset-4 border-2 border-red-500 rounded-xl animate-ping opacity-75" />
                )}
                <div className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-2xl border-2 border-white">
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  <span>OBSTACLE: BOULDER KM 98.4</span>
                </div>
              </div>
              <div className="text-[10px] font-mono font-bold text-red-600 mt-1 bg-white/90 px-2 py-0.5 rounded shadow">
                {aiLaserScanning ? 'AI CALCULATING DETOUR SPLINES...' : 'AI GREEN PATH LOCKED'}
              </div>
            </div>
          )}

          {/* ACTIVE TRAVELING VEHICLE / HIKER / AI PROBE */}
          <div 
            className="absolute left-1/3 top-[65%] -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300"
          >
            {/* Mode 1: 4WD Vehicle with Headlights & Spinning Wheels */}
            {activeMode === 'car' && (
              <div className="relative flex flex-col items-center">
                <div className={`w-28 h-16 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-between px-3 border-2 border-primary-light relative transition-all ${
                  isAccelerating ? 'scale-110 -rotate-2' : ''
                }`}>
                  {/* Headlights projection cone */}
                  {headlightsOn && (
                    <div className="absolute -right-24 top-2 w-28 h-12 bg-gradient-to-r from-amber-300/60 to-transparent pointer-events-none rounded-r-full blur-[2px]" />
                  )}

                  <Car className="w-9 h-9 text-white" />
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-emerald-300 font-bold block">4WD-TURBO</span>
                    <span className="text-xs font-mono font-extrabold text-white">{speed} km/h</span>
                  </div>

                  {/* Rotating Wheels */}
                  <div 
                    className="absolute -bottom-3 left-4 w-6 h-6 rounded-full bg-stone-900 border-2 border-amber-400 flex items-center justify-center animate-spin"
                    style={{ animationDuration: `${Math.max(0.1, 100 / speed)}s` }}
                  >
                    <div className="w-2 h-2 bg-stone-400 rounded-full" />
                  </div>
                  <div 
                    className="absolute -bottom-3 right-4 w-6 h-6 rounded-full bg-stone-900 border-2 border-amber-400 flex items-center justify-center animate-spin"
                    style={{ animationDuration: `${Math.max(0.1, 100 / speed)}s` }}
                  >
                    <div className="w-2 h-2 bg-stone-400 rounded-full" />
                  </div>

                  {/* Exhaust flames when accelerating */}
                  {isAccelerating && (
                    <div className="absolute -left-6 bottom-2 flex items-center">
                      <Flame className="w-6 h-6 text-orange-500 animate-pulse -rotate-90" />
                    </div>
                  )}
                </div>

                <div className="mt-2 bg-stone-900/80 text-white font-mono text-[9px] px-2 py-0.5 rounded-full backdrop-blur-md">
                  Highland Incline: +8%
                </div>
              </div>
            )}

            {/* Mode 2: Electric Light Rail Train */}
            {activeMode === 'train' && (
              <div className="relative flex flex-col items-center">
                <div className="w-40 h-16 bg-gradient-to-r from-cyan-900 to-primary text-white rounded-2xl shadow-2xl flex items-center justify-between px-4 border-2 border-cyan-400 relative">
                  {/* Pantograph with electric spark */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-4 border-t-2 border-cyan-400">
                    <Zap className="w-4 h-4 text-cyan-300 animate-ping absolute -top-2 -left-2" />
                  </div>

                  <Train className="w-8 h-8 text-cyan-300" />
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-cyan-200 font-bold block">ETHIO-LRT // SPEED</span>
                    <span className="text-sm font-mono font-extrabold text-white">{speed} km/h</span>
                  </div>

                  {/* Steel Wheels */}
                  <div className="absolute -bottom-2 left-6 w-4 h-4 rounded-full bg-stone-900 border border-cyan-300 animate-spin" />
                  <div className="absolute -bottom-2 right-6 w-4 h-4 rounded-full bg-stone-900 border border-cyan-300 animate-spin" />
                </div>
                <div className="mt-2 bg-cyan-950 text-cyan-200 font-mono text-[9px] px-2 py-0.5 rounded-full">
                  Zero Emission • Dual Track Active
                </div>
              </div>
            )}

            {/* Mode 3: Mountain Trekker / Hiker */}
            {activeMode === 'walking' && (
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-white text-primary rounded-3xl shadow-2xl flex items-center justify-center border-3 border-primary relative">
                  <Footprints className="w-8 h-8 text-secondary animate-bounce" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shadow">
                    ▲
                  </span>
                </div>
                <div className="mt-2 bg-emerald-900 text-emerald-100 font-mono text-[9px] px-2 py-0.5 rounded-full">
                  Altitude: 2,840 m // Grade: {inclineSlope}%
                </div>
              </div>
            )}

            {/* Mode 4: Holographic AI Probe */}
            {activeMode === 'ai' && (
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-purple-950/80 border-2 border-purple-400 shadow-2xl flex items-center justify-center backdrop-blur-md relative">
                  <div className="absolute inset-0 rounded-full border border-purple-300 animate-ping opacity-60" />
                  <Bot className="w-9 h-9 text-purple-300 animate-pulse" />
                  {/* Rotating sensor halo */}
                  <div className="absolute inset-2 border-2 border-dashed border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="mt-2 bg-purple-950 text-purple-200 font-mono text-[9px] px-2.5 py-0.5 rounded-full shadow">
                  Neural Pathfinder Active
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Interactive Dashboard Controller */}
        <div className="p-4 sm:p-6 bg-surface-lowest border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-4">
          
          {/* Mode-Specific Playable Interactive Controls */}
          {activeMode === 'car' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onMouseDown={() => {
                  soundFX.playClick();
                  setIsAccelerating(true);
                }}
                onMouseUp={() => setIsAccelerating(false)}
                onTouchStart={() => setIsAccelerating(true)}
                onTouchEnd={() => setIsAccelerating(false)}
                data-interactive="true"
                data-cursor-text="HOLD"
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-display font-extrabold text-xs shadow-highland flex items-center gap-2 select-none active:scale-95 transition-all"
              >
                <Flame className="w-4 h-4 fill-stone-900" />
                <span>HOLD TO ACCELERATE (GAS PEDAL)</span>
              </button>

              <button
                onClick={() => setHeadlightsOn(!headlightsOn)}
                data-interactive="true"
                className="px-4 py-3 rounded-2xl bg-surface-low hover:bg-surface-high border border-outline-variant/40 text-xs font-bold text-on-surface flex items-center gap-1.5"
              >
                <Lightbulb className={`w-4 h-4 ${headlightsOn ? 'text-amber-500' : 'text-ash'}`} />
                <span>Headlights: {headlightsOn ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}

          {activeMode === 'train' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setTrackSwitch(trackSwitch === 'trackA' ? 'trackB' : 'trackA');
                }}
                data-interactive="true"
                data-cursor-text="SWITCH"
                className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-display font-extrabold text-xs shadow-highland flex items-center gap-2"
              >
                <CornerDownRight className="w-4 h-4" />
                <span>SWITCH TRACK: {trackSwitch === 'trackA' ? 'VALLEY LINE' : 'MOUNTAIN BRIDGE'}</span>
              </button>
            </div>
          )}

          {activeMode === 'walking' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-ash whitespace-nowrap">Mountain Incline:</span>
              <input
                type="range"
                min="0"
                max="30"
                value={inclineSlope}
                onChange={(e) => setInclineSlope(Number(e.target.value))}
                className="accent-primary w-36 h-2 bg-surface-high rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-primary">{inclineSlope}%</span>
            </div>
          )}

          {activeMode === 'ai' && (
            <div className="flex flex-wrap items-center gap-3">
              {!obstacleDropped ? (
                <button
                  onClick={handleDropObstacle}
                  data-interactive="true"
                  data-cursor-text="DROP"
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-display font-extrabold text-xs shadow-highland flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>DROP ROAD BLOCKAGE (WATCH AI SOLVE IN REAL-TIME)</span>
                </button>
              ) : (
                <button
                  onClick={handleClearObstacle}
                  data-interactive="true"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-xs shadow-highland flex items-center gap-2"
                >
                  <span>✓ CLEAR OBSTACLE &amp; RESET PATH</span>
                </button>
              )}
            </div>
          )}

          {/* Real-time Telemetry Readout */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-ash block">TELEMETRY SPEED</span>
              <span className="font-extrabold text-base text-primary">{speed} KM/H</span>
            </div>
            <div className="h-8 w-px bg-outline-variant/50" />
            <div className="text-right">
              <span className="text-[10px] text-ash block">SURFACE GRADIENT</span>
              <span className="font-extrabold text-base text-secondary">{inclineSlope}° HIGHLAND</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
