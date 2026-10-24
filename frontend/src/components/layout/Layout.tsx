import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomSheet } from './BottomSheet';
import { GuzoMap } from '../map/GuzoMap';
import { IncidentModal } from '../incidents/IncidentModal';

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      {/* 
        Top Application Header:
        - On Desktop (md+): Clean, minimal header with Logo, User Profile, Language Selector (Navigation icons hidden)
        - On Mobile (<md): Houses the 5 primary navigation icons with 44px tap targets
      */}
      <Header />

      {/* Main Canvas: Responsive Split-View */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Desktop Side Panel (1/3 width, md+ only): Houses the 5 primary navigation tabs */}
        <Sidebar />

        {/* Persistent Map Container (2/3 width on Desktop, Full Bleed on Mobile) */}
        <section 
          className="flex-1 h-full relative overflow-hidden" 
          aria-label="Geospatial Map Canvas"
        >
          <GuzoMap />
        </section>

        {/* Mobile Bottom Sheet (Draggable Layered Architecture, <md only) */}
        <BottomSheet />
      </main>

      {/* Global Incident Reporting Modal Overlay */}
      <IncidentModal />
    </div>
  );
};

export default Layout;
