import React from 'react';
import { useAppStore } from '../../features/useAppStore';
import { 
  Compass, 
  ShieldCheck, 
  Users, 
  Languages, 
  Mountain, 
  HeartHandshake, 
  ArrowRight
} from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const { setPageView, language } = useAppStore();

  const stats = [
    { value: '1,400+ km', label: 'Audited Highland Corridors' },
    { value: '12,000+', label: 'Verified Local POIs' },
    { value: '48 Guilds', label: 'Transport Associations Linked' },
    { value: '99.4%', label: 'Incident Verification Accuracy' },
  ];

  const pillars = [
    {
      icon: <Languages className="w-6 h-6 text-secondary" />,
      title: 'Trilingual Parity',
      titleAm: 'የሶስትዮሽ ቋንቋ እኩልነት',
      desc: 'First-class optical metric harmony across English, አማርኛ (Ge\'ez script), and Afaan Oromoo (Qubee script). No machine gibberish — every route and advisory is crafted with cultural nuance.',
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: 'Transport Guild Verification',
      titleAm: 'የማህበራት ማረጋገጫ',
      desc: 'Crowdsourced reports undergo rigorous dual-verification with veteran minibus associations (Selam, Abay), intercity coaches, and local highway patrols.',
    },
    {
      icon: <Mountain className="w-6 h-6 text-tertiary" />,
      title: 'Terrain & Altitude Intelligence',
      titleAm: 'የከፍታና የመሬት አቀማመጥ መረጃ',
      desc: 'From the heat of the Great Rift Valley (1,600m) to the biting chill of the Termaber Tunnel pass (2,840m) and Entoto Ridges (3,020m), our routing adapts gear and transit advice dynamically.',
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-red-600" />,
      title: 'Rapid Emergency Dispatch',
      titleAm: 'አፋጣኝ የአደጋ ጊዜ ድጋፍ',
      desc: 'Direct, zero-rated tie-ins with the Ethiopian Federal Highway Police (991), Medical Emergency Ambulance (907), and the Ethiopian Red Cross Society (922).',
    },
  ];

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          <Compass className="w-3.5 h-3.5 text-secondary" />
          <span>The Story of GuzoMate • ጉዞሜት</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-on-surface tracking-tight">
          Rooted in the Ethiopian Highlands.
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed font-normal">
          We built GuzoMate because generic navigation apps fail on mountain hairpins, miss local minibus nuances, and lack the cultural and linguistic soul of Ethiopia.
        </p>
      </div>

      {/* Origin Story Section */}
      <div className="bg-surface-lowest rounded-3xl border border-outline-variant/50 p-8 sm:p-12 shadow-highland mb-16 space-y-6">
        <h2 className="text-2xl font-display font-bold text-primary">
          Where Cartography Meets Hospitality
        </h2>
        <div className="space-y-4 text-sm sm:text-base text-on-surface-variant leading-relaxed">
          <p>
            Traveling through Ethiopia is an encounter with stunning geographic drama — winding through ancient basalt escarpments, dense cloud forests, and sprawling urban centers like Addis Ababa. Yet, travelers, drivers, and commuters consistently navigate unpredictable terrain: seasonal mudslides on mountain passes, sudden fog in the Blue Nile Gorge, or finding an emergency oxygen supply at high altitude.
          </p>
          <p>
            <strong>GuzoMate</strong> bridges this gap. By fusing satellite radar telemetry with the generational street knowledge of local transport guilds, we offer real-time, verified travel intelligence that protects lives and honors the heritage of the highlands.
          </p>
        </div>
      </div>

      {/* Four Core Pillars Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-display font-bold text-on-surface text-center mb-8">
          Our Four Foundational Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-surface-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-low border border-outline-variant/30 flex items-center justify-center mb-4 shadow-sm">
                {pillar.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-on-surface">
                {pillar.title}
              </h3>
              <p className="text-xs font-semibold text-ash mb-2">{pillar.titleAm}</p>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Impact Stats */}
      <div className="bg-primary text-white rounded-3xl p-8 sm:p-12 shadow-highland mb-16">
        <h2 className="text-2xl font-display font-bold text-center mb-8 text-emerald-100">
          Highland Operational Milestones
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-display font-extrabold text-secondary-light">
                {stat.value}
              </div>
              <div className="text-xs text-emerald-200 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Exploration CTA */}
      <div className="text-center py-6">
        <button
          onClick={() => setPageView('app')}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-highland transition-all transform hover:scale-105"
        >
          <span>Launch Interactive Map &amp; Explore</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
