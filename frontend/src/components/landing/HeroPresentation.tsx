import React from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Compass, 
  Sparkles, 
  Play, 
  Layers, 
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';
import { soundFX } from '../../lib/audioEffects';
import confetti from 'canvas-confetti';

export const HeroPresentation: React.FC = () => {
  const { language } = useAppStore();

  const handleLaunch3D = () => {
    soundFX.playNeuralSuccess();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1b4332', '#d97706', '#0e7490', '#c1ecd4'],
    });

    const el = document.getElementById('interactive-travel-arcade');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-between pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none select-none">
      
      {/* Top Floating Telemetry Bar */}
      <div className="w-full flex items-center justify-start pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-outline-variant/60 shadow-highland backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-primary uppercase">
            3D WebGL Engine Active
          </span>
          <span className="text-outline-variant">•</span>
          <span className="text-[10px] font-mono text-secondary font-bold">
            60 FPS // TERRAIN MESH
          </span>
        </div>
      </div>

      {/* Main Center Presentation Title */}
      <div className="text-center max-w-4xl mx-auto my-auto py-8 space-y-6">
        
        {/* Kinetic Badge */}
        <div className="inline-block pointer-events-auto">
          <span className="px-4 py-1.5 rounded-full bg-secondary/15 border border-secondary/40 text-secondary-dark text-xs font-extrabold tracking-widest uppercase shadow-sm">
            ✦ GUZOMATE PRESENTATION ✦
          </span>
        </div>

        {/* Grand Headline with Gradient Text */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-extrabold tracking-tight leading-[0.98] text-on-surface">
          TRAVELING IN <br />
          <span className="bg-gradient-to-r from-primary via-emerald-600 to-secondary bg-clip-text text-transparent">
            EVERY DIMENSION.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed">
          {language === 'am'
            ? 'ተራሮችን፣ ገደሎችን እና ከተሞችን በ3-ዲ ምስልና በብልህ ራዳር እያሰሱ ይጓዙ።'
            : language === 'om'
            ? 'Tulluuwwan, sululootaa fi magaalota agarsiisa 3D fi raadaarii beekaadhaan daawwadhaa.'
            : 'Explore procedural 3D highland terrains, multi-modal travel dynamics, and holographic AI radar guidance.'}
        </p>

        {/* Interactive CTA Controls */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
          <button
            onClick={handleLaunch3D}
            data-interactive="true"
            data-cursor-text="LAUNCH"
            className="px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-display font-extrabold text-sm shadow-highland hover:shadow-glow-emerald flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 group"
          >
            <Play className="w-4 h-4 fill-secondary text-secondary group-hover:scale-125 transition-transform" />
            <span>Launch Interactive Travel Arcade</span>
          </button>

          <a
            href="#ai-graphical-lab"
            data-interactive="true"
            data-cursor-text="EXPLORE"
            className="px-6 py-4 rounded-full bg-white/90 hover:bg-white text-on-surface border border-outline-variant/50 font-bold text-sm shadow-sm flex items-center gap-2 transition-all hover:border-primary/50"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Watch AI Radar Demo</span>
          </a>
        </div>

        {/* Instruction cue for user */}
        <div className="pt-2 text-xs text-ash font-mono flex items-center justify-center gap-2 opacity-80">
          <Maximize2 className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>Move mouse or click background to deform 3D terrain &amp; trigger radar shockwaves</span>
        </div>

      </div>

      {/* Bottom Floating Stats Cards */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pointer-events-auto">
        
        <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
            <Compass className="w-5 h-5 text-secondary-light" />
          </div>
          <div>
            <p className="text-[10px] text-ash font-mono uppercase">Elevation Range</p>
            <p className="text-sm font-extrabold font-display text-primary">1,600m – 3,200m</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-ash font-mono uppercase">Interactive Modes</p>
            <p className="text-sm font-extrabold font-display text-secondary-dark">4 Vehicles &amp; Hikes</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-ash font-mono uppercase">Obstacle Avoidance</p>
            <p className="text-sm font-extrabold font-display text-emerald-800">Real-time Splines</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-ash font-mono uppercase">Language Parity</p>
            <p className="text-sm font-extrabold font-display text-cyan-900">Latin • Ge'ez • Qubee</p>
          </div>
        </div>

      </div>

    </section>
  );
};
