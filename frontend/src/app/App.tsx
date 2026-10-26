import React from 'react';
import { useAppStore } from '../features/useAppStore';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingPage } from '../components/landing/LandingPage';
import { Layout } from '../components/layout/Layout';
import { AboutUsPage } from '../components/pages/AboutUsPage';
import { ContactUsPage } from '../components/pages/ContactUsPage';
import { LandingFooter } from '../components/landing/LandingFooter';
import { AuthModal } from '../components/auth/AuthModal';

export const App: React.FC = () => {
  const { pageView } = useAppStore();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
      {/* Global Authentication Modal */}
      <AuthModal />

      {pageView === 'landing' && (
        <>
          <LandingHeader />
          <LandingPage />
        </>
      )}

      {pageView === 'app' && (
        <Layout />
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
