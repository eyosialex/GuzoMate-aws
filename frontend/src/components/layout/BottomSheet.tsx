import React, { useRef } from 'react';
import { motion, PanInfo, useReducedMotion } from 'framer-motion';
import { ChevronUp, ChevronDown, MapPin, Sparkles, Route, CloudSun, AlertTriangle } from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { useI18n } from '../../hooks/useI18n';
import { ChatInterface } from '../chat/ChatInterface';
import { PlacesList } from '../places/PlacesList';
import { RouteTimeline } from '../routes/RouteTimeline';
import { WeatherWidget } from '../weather/WeatherWidget';
import { IncidentsList } from '../incidents/IncidentsList';
import { springSheet, springTactile } from '../../lib/motion';

interface BottomSheetProps {
  hideIncidents?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ hideIncidents = false }) => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const bottomSheetSnap = useAppStore((state) => state.bottomSheetSnap);
  const setBottomSheetSnap = useAppStore((state) => state.setBottomSheetSnap);

  const containerRef = useRef<HTMLDivElement>(null);

  const snapHeights = {
    collapsed: '108px',
    half: '54vh',
    expanded: '88vh',
  };

  const allTabs: { id: ActiveTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'places', labelKey: 'nav.places', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'assistant', labelKey: 'nav.assistant', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'routes', labelKey: 'nav.routes', icon: <Route className="w-3.5 h-3.5" /> },
    { id: 'weather', labelKey: 'nav.weather', icon: <CloudSun className="w-3.5 h-3.5" /> },
    { id: 'incidents', labelKey: 'nav.incidents', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ];

  const tabs = hideIncidents ? allTabs.filter(tab => tab.id !== 'incidents') : allTabs;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 280 || offset > 70) {
      if (bottomSheetSnap === 'expanded') setBottomSheetSnap('half');
      else if (bottomSheetSnap === 'half') setBottomSheetSnap('collapsed');
    } else if (velocity < -280 || offset < -70) {
      if (bottomSheetSnap === 'collapsed') setBottomSheetSnap('half');
      else if (bottomSheetSnap === 'half') setBottomSheetSnap('expanded');
    }
  };

  const toggleSnap = () => {
    if (bottomSheetSnap === 'collapsed') setBottomSheetSnap('half');
    else if (bottomSheetSnap === 'half') setBottomSheetSnap('expanded');
    else setBottomSheetSnap('collapsed');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'assistant':
        return <ChatInterface />;
      case 'places':
        return <PlacesList />;
      case 'routes':
        return <RouteTimeline />;
      case 'weather':
        return <WeatherWidget />;
      case 'incidents':
        return hideIncidents ? <PlacesList /> : <IncidentsList />;
      default:
        return <PlacesList />;
    }
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-20 flex flex-col justify-end pointer-events-none">
      <motion.div
        ref={containerRef}
        animate={{ height: snapHeights[bottomSheetSnap] }}
        transition={shouldReduceMotion ? { duration: 0.01 } : springSheet}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        className="pointer-events-auto backdrop-blur-2xl bg-white/95 rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] border-t border-white/60 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Grab Handle Header */}
        <motion.div
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={springTactile}
          onClick={toggleSnap}
          className="w-full pt-3 pb-2 px-4 flex items-center justify-between cursor-pointer select-none border-b border-gray-100/70 shrink-0 bg-white/50"
          role="button"
          tabIndex={0}
          aria-label="Toggle sheet height"
        >
          <div className="w-6" /> {/* Spacer */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors" />
          </div>

          <div className="w-6 flex justify-end text-gray-400">
            {bottomSheetSnap === 'expanded' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </motion.div>

        {/* Mobile Sub-Tab Bar */}
        <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-around gap-1 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (bottomSheetSnap === 'collapsed') setBottomSheetSnap('half');
                }}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span className="text-[11px]">{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};
