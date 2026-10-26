import React from 'react';
import { useAppStore } from '../features/useAppStore';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingPage } from '../components/landing/LandingPage';
import { HomePage } from '../components/home/HomePage';
import { ExplorePage } from '../components/explore/ExplorePage';
import { IncidentsPage } from '../components/incidents/IncidentsPage';
import { AboutUsPage } from '../components/pages/AboutUsPage';
import { ContactUsPage } from '../components/pages/ContactUsPage';
import { LandingFooter } from '../components/landing/LandingFooter';
import { AuthModal } from '../components/auth/AuthModal';
import { DevViewSwitcher } from '../components/dev/DevViewSwitcher';

export const App: React.FC = () => {
  const { pageView } = useAppStore();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
      {/* Development View Switcher: Bottom Right Corner */}
      <DevViewSwitcher />

      {/* Global Authentication Modal */}
      <AuthModal />

      {pageView === 'landing' && (
        <>
          <LandingHeader />
          <LandingPage />
        </>
      )}

      {pageView === 'home' && (
        <HomePage />
      )}

      {(pageView === 'app' || pageView === 'explore') && (
        <ExplorePage />
      )}

      {pageView === 'incidents' && (
        <IncidentsPage />
      )}

      {pageView === 'about' && (
        <>
          <LandingHeader />
          <main className="flex-1">
            <AboutUsPage />
          </main>
          <LandingFooter />
        </>
      )}

      {pageView === 'contact' && (
        <>
          <LandingHeader />
          <main className="flex-1">
            <ContactUsPage />
          </main>
          <LandingFooter />
        </>
      )}
    </div>
  );
};

export default App;
