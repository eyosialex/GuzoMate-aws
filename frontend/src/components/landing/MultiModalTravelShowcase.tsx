import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Car, 
  Footprints, 
  Train, 
  Bus, 
  Gauge, 
  Mountain, 
  Heart, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  Compass, 
  Clock, 
  Coins,
  ShieldCheck
} from 'lucide-react';

type TravelMode = 'car' | 'walking' | 'train' | 'bus';

export const MultiModalTravelShowcase: React.FC = () => {
  const { language } = useAppStore();
  const [activeMode, setActiveMode] = useState<TravelMode>('car');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [simulatedObstacle, setSimulatedObstacle] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(15);
  const [isDetouring, setIsDetouring] = useState<boolean>(false);

  // Dynamic progress loop
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const step = 0.4 * speedMultiplier;
        const next = prev + step;
        if (next > 95) return 5;
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [speedMultiplier]);

  // Handle simulated detour obstacle
  const handleToggleObstacle = () => {
    setSimulatedObstacle(true);
    setIsDetouring(true);
    setTimeout(() => {
      setIsDetouring(false);
      setSimulatedObstacle(false);
    }, 4500);
  };

  // Telemetry computations based on progress and active mode
  const currentAltitude = Math.round(
    activeMode === 'walking'
      ? 2800 + Math.sin(progress * 0.08) * 320
      : activeMode === 'train'
      ? 2355 + Math.sin(progress * 0.03) * 80
      : 2355 + Math.sin(progress * 0.05) * 450
  );

  const currentSpeed = 
    activeMode === 'car' ? Math.round(68 * speedMultiplier) :
    activeMode === 'walking' ? Math.round(4.8 * speedMultiplier) :
    activeMode === 'train' ? Math.round(110 * speedMultiplier) :
    Math.round(55 * speedMultiplier);

  return (
    <section 
      id="multimodal-simulator" 
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
          <Compass className="w-3.5 h-3.5 text-secondary animate-spin" style={{ animationDuration: '8s' }} />
          <span>Interactive Multi-Modal Highland Simulator</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-on-surface tracking-tight">
          {language === 'am'
            ? 'በተለያዩ መንገዶች የከፍታ ጉዞን ይለማመዱ'
            : language === 'om'
            ? 'Balleesaa Imala Tulluu Adda Addaatiin'
            : 'Traveling in Every Dimension.'}
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-xl mx-auto">
          Switch modes below and watch the vehicle, hiker, or train adapt to high-altitude elevation, terrain gradient, and path contours in real-time.
        </p>
      </div>

      {/* Main Interactive Stage Container */}
      <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 shadow-highland overflow-hidden">
        
        {/* Top Mode Selector Bar */}
        <div className="bg-surface-low/80 border-b border-outline-variant/30 p-2 sm:p-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveMode('car')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeMode === 'car'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/70 text-on-surface hover:bg-white border border-outline-variant/30'
              }`}
            >
              <Car className="w-4 h-4 text-secondary-light" />
              <span>Highland 4WD / Car</span>
            </button>

            <button
              onClick={() => setActiveMode('walking')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeMode === 'walking'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/70 text-on-surface hover:bg-white border border-outline-variant/30'
              }`}
            >
              <Footprints className="w-4 h-4 text-emerald-300" />
              <span>Mountain Hiking / Walking</span>
            </button>

            <button
              onClick={() => setActiveMode('train')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeMode === 'train'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/70 text-on-surface hover:bg-white border border-outline-variant/30'
              }`}
            >
              <Train className="w-4 h-4 text-cyan-300" />
              <span>Electric Light Rail (LRT)</span>
            </button>

            <button
              onClick={() => setActiveMode('bus')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeMode === 'bus'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/70 text-on-surface hover:bg-white border border-outline-variant/30'
              }`}
            >
              <Bus className="w-4 h-4 text-amber-300" />
              <span>Selam Intercity Coach</span>
            </button>
          </div>

          {/* Speed & Obstacle Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-white px-2 py-1 rounded-xl border border-outline-variant/40 text-xs font-semibold gap-1">
              <span className="text-ash text-[10px]">Speed:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                    speedMultiplier === spd ? 'bg-primary text-white' : 'text-ash hover:text-on-surface'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={handleToggleObstacle}
              disabled={isDetouring}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isDetouring 
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-white hover:bg-orange-50 text-orange-800 border-orange-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
              <span>{isDetouring ? 'Rerouting Around Hazard...' : 'Simulate Road Blockage'}</span>
            </button>
          </div>

        </div>

        {/* Visual Animated SVG Stage */}
        <div className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-[#eaf3ed] via-[#f4f7f2] to-[#fafaf4] overflow-hidden select-none">
          
          {/* Ambient Parallax Mountain Ridge Background Layers */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
            {/* Distant Ridge */}
            <path
              d="M0,240 Q200,160 450,220 T800,180 Q920,200 1000,210 L1000,400 L0,400 Z"
              fill="#cbe3d5"
              opacity="0.45"
            />
            {/* Mid Ridge */}
            <path
              d="M0,280 Q250,200 550,260 T850,230 Q940,250 1000,260 L1000,400 L0,400 Z"
              fill="#adc8b8"
              opacity="0.35"
            />
            {/* Foreground Terrain Mesh */}
            <path
              d="M0,320 Q280,260 600,310 T900,290 L1000,300 L1000,400 L0,400 Z"
              fill="#e2ece5"
              opacity="0.8"
            />
          </svg>

          {/* Animated Waypoint Trail & Vehicle Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
            {/* Base Highway / Path Line */}
            <path
              d={
                isDetouring
                  ? "M 50,330 C 250,310 400,220 500,260 C 600,300 780,240 950,280"
                  : activeMode === 'train'
                  ? "M 50,330 L 950,290"
                  : "M 50,330 C 250,310 450,250 600,280 C 750,310 850,260 950,280"
              }
              fill="none"
              stroke={activeMode === 'train' ? '#717973' : isDetouring ? '#d97706' : '#1b4332'}
              strokeWidth={activeMode === 'train' ? '4' : '6'}
              strokeDasharray={isDetouring ? '8,8' : 'none'}
              className="transition-all duration-700"
            />

            {/* Glowing Active Trail Vector */}
            <path
              d={
                isDetouring
                  ? "M 50,330 C 250,310 400,220 500,260 C 600,300 780,240 950,280"
                  : activeMode === 'train'
                  ? "M 50,330 L 950,290"
                  : "M 50,330 C 250,310 450,250 600,280 C 750,310 850,260 950,280"
              }
              fill="none"
              stroke={isDetouring ? '#f59e0b' : '#34d399'}
              strokeWidth="3"
              strokeDasharray="12,12"
              className="animate-dash-flow opacity-80"
            />

            {/* Waypoint Markers */}
            <g transform="translate(180, 315)">
              <circle r="7" fill="#ffffff" stroke="#1b4332" strokeWidth="2.5" />
              <text x="0" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1b4332">Bole Meskel (2,355m)</text>
            </g>

            <g transform="translate(480, 260)">
              <circle r="7" fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
              <text x="0" y="-14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d97706">Entoto Pass (3,020m)</text>
            </g>

            <g transform="translate(780, 280)">
              <circle r="7" fill="#ffffff" stroke="#0e7490" strokeWidth="2.5" />
              <text x="0" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0e7490">Rift Escarpment (1,840m)</text>
            </g>
          </svg>

          {/* Dynamic Hazard Drop (When Detour is Active) */}
          {simulatedObstacle && (
            <div 
              className="absolute left-[47%] top-[56%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce z-20"
            >
              <div className="bg-red-600 text-white p-2 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold border-2 border-white">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>ROCKFALL DETECTED (A2 Km 98.4)</span>
              </div>
              <div className="w-8 h-3 bg-stone-700 rounded-full mt-1 opacity-60" />
            </div>
          )}

          {/* Dynamic Traveling Character / Vehicle (Calculated via progress %) */}
          <div 
            className="absolute z-30 transition-all duration-75"
            style={{
              left: `${progress}%`,
              top: isDetouring
                ? `${65 - Math.sin((progress / 100) * Math.PI) * 20}%`
                : activeMode === 'train'
                ? `${72 - (progress / 100) * 10}%`
                : `${70 - Math.sin((progress / 100) * Math.PI * 1.5) * 12}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Mode 1: 4WD Vehicle */}
            {activeMode === 'car' && (
              <div className="relative group cursor-pointer">
                <div className="w-16 h-10 bg-primary text-white rounded-xl shadow-2xl flex items-center justify-between px-2.5 border border-primary-light/40 relative">
                  {/* Headlight beam */}
                  <div className="absolute -right-10 top-1 w-12 h-8 bg-gradient-to-r from-amber-200/50 to-transparent pointer-events-none rounded-r-full" />
                  <Car className="w-6 h-6 text-white" />
                  <div className="text-[10px] font-mono font-bold text-emerald-300">4WD</div>
                  {/* Rotating Wheels */}
                  <div className="absolute -bottom-2 left-2 w-4 h-4 rounded-full bg-stone-900 border-2 border-stone-300 animate-spin" />
                  <div className="absolute -bottom-2 right-2 w-4 h-4 rounded-full bg-stone-900 border-2 border-stone-300 animate-spin" />
                </div>
                {/* Floating vehicle telemetry pill */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary-dark text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  ▲ {currentAltitude} m
                </div>
              </div>
            )}

            {/* Mode 2: Hiker */}
            {activeMode === 'walking' && (
              <div className="relative group cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 bg-white text-primary rounded-2xl shadow-xl flex items-center justify-center border-2 border-primary">
                  <Footprints className="w-6 h-6 text-primary" />
                </div>
                {/* Trekking Altitude tag */}
                <div className="absolute -top-6 whitespace-nowrap bg-emerald-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  Hiker • {currentAltitude} m
                </div>
              </div>
            )}

            {/* Mode 3: Electric Light Rail Train */}
            {activeMode === 'train' && (
              <div className="relative group cursor-pointer">
                <div className="w-24 h-10 bg-gradient-to-r from-cyan-900 to-primary text-white rounded-xl shadow-2xl flex items-center justify-between px-3 border border-cyan-400/40 relative">
                  {/* Pantograph with electric spark */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-3 border-t-2 border-cyan-400">
                    <Zap className="w-3 h-3 text-cyan-300 absolute -top-1.5 -left-1" />
                  </div>
                  <Train className="w-5 h-5 text-cyan-300" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-200">LRT-1</span>
                  {/* Wheels */}
                  <div className="absolute -bottom-1.5 left-3 w-3 h-3 rounded-full bg-stone-900 animate-spin" />
                  <div className="absolute -bottom-1.5 right-3 w-3 h-3 rounded-full bg-stone-900 animate-spin" />
                </div>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-cyan-950 text-cyan-200 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  Smooth Rail • {currentSpeed} km/h
                </div>
              </div>
            )}

            {/* Mode 4: Selam Bus */}
            {activeMode === 'bus' && (
              <div className="relative group cursor-pointer">
                <div className="w-20 h-11 bg-amber-600 text-white rounded-xl shadow-2xl flex items-center justify-between px-2.5 border border-amber-300 relative">
                  {/* Luggage rack */}
                  <div className="absolute -top-2 left-2 right-2 h-2 bg-amber-800 rounded-t border border-amber-400" />
                  <Bus className="w-5 h-5 text-white" />
                  <div className="text-[9px] font-bold text-amber-100">SELAM</div>
                  {/* Wheels */}
                  <div className="absolute -bottom-2 left-3 w-4 h-4 rounded-full bg-stone-900 border-2 border-stone-200 animate-spin" />
                  <div className="absolute -bottom-2 right-3 w-4 h-4 rounded-full bg-stone-900 border-2 border-stone-200 animate-spin" />
                </div>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-900 text-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  Selam Bus • Fare: 380 ETB
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Graphical Telemetry Dashboard Bottom Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-lowest border-t border-outline-variant/30 text-xs">
          
          {/* Velocity Telemetry */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-low border border-outline-variant/30">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ash font-medium">Current Speed</p>
              <p className="text-sm font-bold font-display text-primary">{currentSpeed} km/h</p>
            </div>
          </div>

          {/* Real-time Altitude Meter */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-low border border-outline-variant/30">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-secondary flex items-center justify-center font-bold">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ash font-medium">Elevation Climb</p>
              <p className="text-sm font-bold font-display text-secondary">{currentAltitude} m a.s.l.</p>
            </div>
          </div>

          {/* Mode Specific Dynamic Telemetry */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-low border border-outline-variant/30">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-tertiary flex items-center justify-center font-bold">
              {activeMode === 'walking' ? (
                <Heart className="w-4 h-4 text-red-500" />
              ) : activeMode === 'train' ? (
                <Zap className="w-4 h-4 text-cyan-600" />
              ) : (
                <Coins className="w-4 h-4 text-secondary" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-ash font-medium">
                {activeMode === 'walking' ? 'Heart Rate' : activeMode === 'train' ? 'Grid Telemetry' : 'Toll / Transit Fare'}
              </p>
              <p className="text-sm font-bold font-display text-on-surface">
                {activeMode === 'walking' ? '124 bpm (Optimal)' : activeMode === 'train' ? '600V DC • Low Carbon' : '380 ETB (Toll Pass)'}
              </p>
            </div>
          </div>

          {/* Safety & Guild Verification Status */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-low border border-outline-variant/30">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ash font-medium">Corridor Status</p>
              <p className="text-sm font-bold font-display text-emerald-700">
                {isDetouring ? 'Dynamic Detour Active' : 'Path Clear & Verified'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
