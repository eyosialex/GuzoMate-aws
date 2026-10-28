import React from 'react';
import { useAppStore } from '../features/useAppStore';
import { AuthProvider } from '../features/AuthContext';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingPage } from '../components/landing/LandingPage';
import { HomePage } from '../components/home/HomePage';
import { ExplorePage } from '../components/explore/ExplorePage';
import { IncidentsPage } from '../components/incidents/IncidentsPage';
import { AboutUsPage } from '../components/pages/AboutUsPage';
import { ContactUsPage } from '../components/pages/ContactUsPage';
import { LandingFooter } from '../components/landing/LandingFooter';
import { AuthModal } from '../components/auth/AuthModal';
import { UserProfileModal } from '../components/user/UserProfileModal';

export const App: React.FC = () => {
  const { pageView } = useAppStore();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
        {/* Global Authentication & User Profile Modals */}
        <AuthModal />
        <UserProfileModal />

        {pageView === 'landing' && (
          <>
            <LandingHeader />
            <LandingPage />
          </>
        )}

        {pageView === 'home' && (
          <HomePage />
        )}

        {(pageView === 'app' || pageView === 'explore' || pageView === 'routes') && (
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
    </AuthProvider>
  );
};

export default App;
