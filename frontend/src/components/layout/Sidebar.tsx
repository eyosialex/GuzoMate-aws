import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, MapPin, Route, CloudSun, AlertTriangle } from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { useI18n } from '../../hooks/useI18n';
import { ChatInterface } from '../chat/ChatInterface';
import { PlacesList } from '../places/PlacesList';
import { RouteTimeline } from '../routes/RouteTimeline';
import { WeatherWidget } from '../weather/WeatherWidget';
import { IncidentsList } from '../incidents/IncidentsList';
import { springTactile, springGentle, tactilePress } from '../../lib/motion';

interface SidebarProps {
  hideIncidents?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ hideIncidents = false }) => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const allTabs: { id: ActiveTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'places', labelKey: 'nav.places', icon: <MapPin className="w-4 h-4" /> },
    { id: 'assistant', labelKey: 'nav.assistant', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'routes', labelKey: 'nav.routes', icon: <Route className="w-4 h-4" /> },
    { id: 'weather', labelKey: 'nav.weather', icon: <CloudSun className="w-4 h-4" /> },
    { id: 'incidents', labelKey: 'nav.incidents', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const tabs = hideIncidents ? allTabs.filter(tab => tab.id !== 'incidents') : allTabs;

  const renderContent = () => {
    switch (activeTab) {
      case 'assistant':
        return <ChatInterface key="assistant" />;
      case 'places':
        return <PlacesList key="places" />;
      case 'routes':
        return <RouteTimeline key="routes" />;
      case 'weather':
        return <WeatherWidget key="weather" />;
      case 'incidents':
        return <IncidentsList key="incidents" />;
      default:
        return <PlacesList key="default" />;
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-full md:w-[420px] lg:w-[460px] h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/70 shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Frosted Glass Sub-navigation Bar */}
      <div className="p-3 border-b border-gray-100/80 bg-gray-50/70 backdrop-blur-md shrink-0">
        <div className={`grid ${tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-1 bg-gray-200/60 p-1 rounded-xl`}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                transition={springTactile}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-1 py-1.5 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
                  isActive
                    ? 'bg-white text-primary font-bold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                aria-label={t(tab.labelKey)}
                title={t(tab.labelKey)}
              >
                {tab.icon}
                <span className="truncate max-w-full text-[10px] leading-none">
                  {t(tab.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main panel body with Fluid Spring Transitions */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 6 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98, y: -4 }}
            transition={springGentle}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
};
