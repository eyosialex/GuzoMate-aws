import React, { useEffect } from 'react';
import { AppNavbar } from '../layout/AppNavbar';
import { Sidebar } from '../layout/Sidebar';
import { BottomSheet } from '../layout/BottomSheet';
import { GuzoMap } from '../map/GuzoMap';
import { useAppStore } from '../../features/useAppStore';

export const ExplorePage: React.FC = () => {
  const pageView = useAppStore((state) => state.pageView);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  // If navigating via routes pageView, switch activeTab to 'routes'; if 'incidents', default to 'places'
  useEffect(() => {
    if (pageView === 'routes') {
      setActiveTab('routes');
    } else if (activeTab === 'incidents') {
      setActiveTab('places');
    }
  }, [pageView, activeTab, setActiveTab]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-on-surface font-sans">
      {/* Reusable App Navbar: Identical to Homepage Navbar */}
      <AppNavbar activePage="explore" />

      {/* Main Canvas: Responsive Split-View */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Desktop Side Panel: Places Search, AI Assistant, Routes, Weather */}
        <Sidebar hideIncidents={true} />

        {/* Real Interactive Geospatial Map (Leaflet) */}
        <section 
          className="flex-1 h-full relative overflow-hidden" 
          aria-label="Geospatial Map Canvas"
        >
          <GuzoMap showIncidents={false} />
        </section>

        {/* Mobile Bottom Sheet: Places Search, AI Assistant, Routes, Weather */}
        <BottomSheet hideIncidents={true} />
      </main>
    </div>
  );
};

export default ExplorePage;
