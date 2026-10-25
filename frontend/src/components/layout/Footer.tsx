import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PhoneCall, PlusSquare, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#f8faf8] border-t border-[#e2e8e3] text-gray-500 text-xs py-4 px-4 sm:px-6 shrink-0 font-sans">
      <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        {/* Left: Cache & Version Info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
            <Compass className="w-3.5 h-3.5 text-[#183a2b]" />
            <span>Addis & Sheger Corridor Map Cached (Offline ready)</span>
          </div>
          <span className="text-[10px] font-mono bg-gray-200/70 text-gray-700 px-1.5 py-0.5 rounded">
            v4.8-ET
          </span>
        </div>

        {/* Center: Legal & Parity statement */}
        <div className="text-[11px] text-gray-500">
          © 2024 GuzoMate Ethiopia — Verified Highland Travel Intelligence. Latin, አማርኛ & Afaan Oromo parity.
        </div>

        {/* Right: Quick Emergency Dials & Guild links */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
          <a
            href="tel:991"
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-[#183a2b] transition-colors"
          >
            <Shield className="w-3 h-3 text-[#183a2b]" /> Police 991
          </a>
          <a
            href="tel:907"
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
          >
            <PlusSquare className="w-3 h-3 text-emerald-600" /> Medical 907
          </a>
          <a
            href="tel:922"
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-red-700 transition-colors"
          >
            <PhoneCall className="w-3 h-3 text-red-600" /> Red Cross 922
          </a>
          <span className="text-gray-300">|</span>
          <Link to="/emergency" className="hover:text-gray-900 transition-colors font-medium">
            Emergency Dial
          </Link>
          <Link to="/incidents" className="hover:text-gray-900 transition-colors font-medium">
            Road Verification Guild
          </Link>
          <button
            type="button"
            onClick={() => alert('GuzoMate Highland Privacy & Telemetry Policy: GPS data is stored locally and hashed before transmission.')}
            className="hover:text-gray-900 transition-colors font-medium"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
