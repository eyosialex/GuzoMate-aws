import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Compass, 
  Globe, 
  Sparkles, 
  MapPin, 
  Route, 
  CloudSun, 
  AlertTriangle, 
  User 
} from 'lucide-react';
import { Language, ActiveTab } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { useI18n } from '../../hooks/useI18n';
import { springTactile, tactilePress } from '../../lib/motion';

export const Header: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setBottomSheetSnap = useAppStore((state) => state.setBottomSheetSnap);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'am', label: 'አማ' },
    { code: 'om', label: 'OM' },
  ];

  const navItems: { id: ActiveTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'assistant', labelKey: 'nav.assistant', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'places', labelKey: 'nav.places', icon: <MapPin className="w-4 h-4" /> },
    { id: 'routes', labelKey: 'nav.routes', icon: <Route className="w-4 h-4" /> },
    { id: 'weather', labelKey: 'nav.weather', icon: <CloudSun className="w-4 h-4" /> },
    { id: 'incidents', labelKey: 'nav.incidents', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const handleMobileNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setBottomSheetSnap('half');
  };

  return (
    <header className="sticky top-0 backdrop-blur-xl bg-white/90 border-b border-gray-200/60 shrink-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* Primary Header Row */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <motion.div
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            transition={springTactile}
            className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Compass className="w-6 h-6 animate-[spin_16s_linear_infinite]" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">
                {t('app.title')}
              </h1>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                Addis Ababa
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed hidden sm:block mt-0.5">
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Desktop View Right Elements: Clean & Minimal (User Profile + Language Switcher) */}
        <div className="flex items-center gap-2.5">
          {/* User Profile Pill */}
          <motion.button
            whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
            transition={springTactile}
            className="hidden sm:inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-xl bg-gray-100/80 hover:bg-gray-200/70 border border-gray-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 select-none cursor-pointer"
            aria-label="User Profile"
          >
            <div className="relative">
              <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <span className="text-xs font-semibold text-gray-800 leading-none">
              Traveler
            </span>
          </motion.button>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-md p-1 rounded-xl border border-gray-200/40">
            <Globe className="w-4 h-4 text-gray-500 ml-1.5 hidden sm:block" />
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <motion.button
                  key={lang.code}
                  whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                  transition={springTactile}
                  onClick={() => setLanguage(lang.code)}
                  className={`min-h-[36px] min-w-[36px] px-2.5 py-1 rounded-lg text-xs font-bold leading-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isSelected
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label={`Switch language to ${lang.label}`}
                >
                  {lang.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile-Only Navigation Tier: Visible ONLY on mobile/narrow screens when Sidebar is hidden */}
      <nav 
        className="flex md:hidden px-2.5 py-2 border-t border-gray-100/80 bg-gray-50/70 backdrop-blur-md"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 gap-1 w-full bg-gray-200/60 p-1 rounded-2xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={() => handleMobileNavClick(item.id)}
                className={`min-h-[44px] min-w-[44px] px-1 py-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-none ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                aria-label={t(item.labelKey)}
                aria-pressed={isActive}
              >
                {item.icon}
                <span className="truncate max-w-full text-[10px] leading-tight">
                  {t(item.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
