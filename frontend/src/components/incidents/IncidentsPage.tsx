import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ListFilter, Plus, Crosshair, X } from 'lucide-react';
import { AppNavbar } from '../layout/AppNavbar';
import { GuzoMap } from '../map/GuzoMap';
import { IncidentsList } from './IncidentsList';
import { IncidentSubmitForm } from './IncidentSubmitForm';
import { useIncidents } from '../../hooks/useIncidents';
import { GeoLocation } from '../../types';
import { springGentle } from '../../lib/motion';
import { useAppStore } from '../../features/useAppStore';

export const IncidentsPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { incidents, reportIncident, isSubmitting } = useIncidents();

  // Subpage switcher state synced with store: 'list' (default) | 'submit'
  const subpage = useAppStore((state) => state.incidentSubpage);
  const setSubpage = useAppStore((state) => state.setIncidentSubpage);

  // Map picking state
  const [draftLocation, setDraftLocation] = useState<GeoLocation | null>(null);
  const [isMapPickingActive, setIsMapPickingActive] = useState(false);

  // When user clicks anywhere on the map
  const handleMapClick = (loc: GeoLocation) => {
    setDraftLocation(loc);
    if (isMapPickingActive) {
      setIsMapPickingActive(false);
      // If currently on list, switch to submit with the location
      if (subpage === 'list') {
        setSubpage('submit');
      }
    }
  };

  const handleReportSubmit = async (payload: any): Promise<{ success: boolean; duplicate?: boolean; error?: string } | boolean> => {
    const res = await reportIncident(payload);
    if (res.success) {
      setDraftLocation(null);
      setIsMapPickingActive(false);
      // Switch back to list of incidents posted
      setSubpage('list');
      return true;
    }
    return res;
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-on-surface font-sans">
      {/* Reusable App Navbar with active indicator on 'incidents' */}
      <AppNavbar activePage="incidents" />

      {/* Main Canvas: Responsive Split-View matching Explore Page layout */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Side Panel: Contains the 2 Subpages (Desktop & Tablet) */}
        <aside className="w-full md:w-[420px] lg:w-[460px] h-full bg-white/95 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(27,67,50,0.03)] overflow-hidden">
          {/* Subpage Switcher Bar */}
          <div className="p-3 border-b border-outline-variant/30 bg-surface-low/80 backdrop-blur-md shrink-0">
            <div className="grid grid-cols-2 gap-1 bg-surface-container p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSubpage('list')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 select-none ${
                  subpage === 'list'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/40'
                }`}
              >
                <ListFilter className="w-4 h-4 text-primary" />
                <span>Incident Reports ({incidents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubpage('submit')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                  subpage === 'submit'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/40'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Report Incident</span>
              </button>
            </div>
          </div>

          {/* Subpages Body */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {subpage === 'list' ? (
                <motion.div
                  key="subpage-list"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: -6 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, x: -6 }}
                  transition={springGentle}
                  className="w-full h-full"
                >
                  <IncidentsList onGoToSubmit={() => setSubpage('submit')} />
                </motion.div>
              ) : (
                <motion.div
                  key="subpage-submit"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: 6 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, x: 6 }}
                  transition={springGentle}
                  className="w-full h-full"
                >
                  <IncidentSubmitForm
                    draftLocation={draftLocation}
                    isMapPickingActive={isMapPickingActive}
                    onActivateMapPicker={() => setIsMapPickingActive(true)}
                    onSubmit={handleReportSubmit}
                    isSubmitting={isSubmitting}
                    onCancel={() => setSubpage('list')}
                    onViewExisting={() => setSubpage('list')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Right Side Canvas: Interactive Leaflet Map Canvas */}
        <section
          className="hidden md:flex flex-1 h-full relative overflow-hidden"
          aria-label="Geospatial Map Canvas"
        >
          {/* Active Map Picker Floating Banner */}
          {isMapPickingActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-stone-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-floating border border-white/20 flex items-center gap-3 text-xs font-bold animate-bounce">
              <Crosshair className="w-4 h-4 text-secondary-light" />
              <span>Click anywhere on the map to place incident pin</span>
              <button
                type="button"
                onClick={() => setIsMapPickingActive(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                aria-label="Cancel map picker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <GuzoMap
            showIncidents={true}
            draftLocation={draftLocation}
            onMapClick={handleMapClick}
            onReportIncidentClick={() => setSubpage('submit')}
          />
        </section>
      </main>
    </div>
  );
};

export default IncidentsPage;
