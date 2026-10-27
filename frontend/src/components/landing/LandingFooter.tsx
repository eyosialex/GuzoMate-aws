import React from 'react';
import { useAppStore } from '../../features/useAppStore';
import { ShieldCheck, Compass } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const { setPageView } = useAppStore();

  return (
    <footer className="w-full bg-surface-low border-t border-outline-variant/40 pt-14 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div 
              onClick={() => setPageView('landing')}
              className="flex items-center gap-2 cursor-pointer group w-fit"
            >
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                <Compass className="w-5 h-5 text-secondary-light" />
              </div>
              <span className="font-display font-bold text-xl text-primary">GuzoMate • ጉዞሜት</span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
              Verified Highland Travel Intelligence. Engineered with optical metric harmony for Latin, አማርኛ (Ge'ez), and Afaan Oromoo (Qubee) typography across every Ethiopian mountain corridor.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-ash font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Verified alongside Ethiopian Road Transport Guilds</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-primary uppercase tracking-wider text-[11px]">Explore System</h4>
            <ul className="space-y-1.5 text-on-surface-variant">
              <li>
                <button onClick={() => setPageView('landing')} className="hover:text-primary transition-colors">
                  Highland Radar Showcase
                </button>
              </li>
              <li>
                <button onClick={() => setPageView('app')} className="hover:text-primary transition-colors">
                  Interactive Geospatial Map
                </button>
              </li>
              <li>
                <button onClick={() => setPageView('about')} className="hover:text-primary transition-colors">
                  About Our Mission
                </button>
              </li>
              <li>
                <button onClick={() => setPageView('contact')} className="hover:text-primary transition-colors">
                  Contact Regional Hubs
                </button>
              </li>
            </ul>
          </div>

          {/* Emergency Direct Hotlines */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-red-800 uppercase tracking-wider text-[11px]">Emergency Hotline Dial</h4>
            <div className="space-y-1.5">
              <a href="tel:991" className="flex items-center gap-2 text-on-surface hover:text-red-700 transition-colors">
                <span className="font-bold font-mono text-red-700">991</span>
                <span>Federal &amp; Traffic Police</span>
              </a>
              <a href="tel:907" className="flex items-center gap-2 text-on-surface hover:text-red-700 transition-colors">
                <span className="font-bold font-mono text-red-700">907</span>
                <span>Medical Emergency Ambulance</span>
              </a>
              <a href="tel:922" className="flex items-center gap-2 text-on-surface hover:text-red-700 transition-colors">
                <span className="font-bold font-mono text-red-700">922</span>
                <span>Ethiopian Red Cross Society</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Baseline Bar */}
        <div className="pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ash">
          <p>© 2024 GuzoMate Ethiopia. All rights reserved. Addis Ababa, Ethiopia.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-primary cursor-pointer" onClick={() => setPageView('about')}>Highland Modern Style</span>
            <span>•</span>
            <span className="hover:text-primary cursor-pointer" onClick={() => setPageView('contact')}>Support &amp; Dispatch</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
