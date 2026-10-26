import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { Language, PageView } from '../../types';
import { Menu, X } from 'lucide-react';

export const LandingHeader: React.FC = () => {
  const { 
    pageView, 
    setPageView, 
    language, 
    setLanguage, 
    currentUser, 
    setCurrentUser, 
    openAuthModal 
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: PageView) => {
    setPageView(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface/85 border-b border-outline-variant/30 transition-all duration-300">
        <div className="w-full px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Far Top Left Side: GuzoMate Logo and Name */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-highland group-hover:bg-primary-dark transition-all duration-300 group-hover:scale-105 border border-primary-light/20">
              <span className="material-symbols-outlined text-[22px]">landscape</span>
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-primary group-hover:text-primary-dark transition-colors">
              GuzoMate
            </span>
          </div>

          {/* Far Top Right Side: Language Switcher, Log In & Sign Up Buttons */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Trilingual Segmented Switcher */}
            <div className="flex items-center p-1 bg-surface-low rounded-full border border-outline-variant/40 text-xs font-bold">
              {(['en', 'am', 'om'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                    language === lang
                      ? 'bg-white text-primary shadow-sm font-extrabold'
                      : 'text-ash hover:text-on-surface'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'am' ? 'አማ' : 'OM'}
                </button>
              ))}
            </div>

            {/* Authentication Buttons (Replacing profile name) */}
            {currentUser ? (
              <button
                onClick={() => setCurrentUser(null)}
                className="px-4 py-2 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors shadow-sm"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-full text-xs font-bold text-primary hover:bg-primary/10 border border-primary/30 transition-all duration-200"
                >
                  {language === 'am' ? 'ይግቡ' : language === 'om' ? 'Seenaa' : 'Log In'}
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-4.5 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-highland transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {language === 'am' ? 'ይመዝገቡ' : language === 'om' ? 'Galmaa\'aa' : 'Sign Up'}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Actions: Language & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center p-1 bg-surface-low rounded-full border border-outline-variant/40 text-[11px] font-bold">
              {(['en', 'am', 'om'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    language === lang
                      ? 'bg-white text-primary shadow-sm font-extrabold'
                      : 'text-ash'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'am' ? 'አማ' : 'OM'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-surface-low border border-outline-variant/40 text-on-surface hover:text-primary"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-lg px-6 py-4 space-y-3 animate-in slide-in-from-top-4">
            {currentUser ? (
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold text-center hover:bg-red-50"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-bold text-center hover:bg-primary/10"
                >
                  {language === 'am' ? 'ይግቡ' : language === 'om' ? 'Seenaa' : 'Log In'}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-highland text-center"
                >
                  {language === 'am' ? 'ይመዝገቡ' : language === 'om' ? 'Galmaa\'aa' : 'Sign Up'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Far Bottom Left Side: Clickable Text Navigation (Contact Us & About Us) */}
      <nav 
        aria-label="Footer and Editorial Navigation"
        className="fixed bottom-6 left-6 sm:left-10 z-40 flex items-center gap-5 select-none bg-surface/80 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 shadow-sm"
      >
        <button
          onClick={() => handleNavClick('about')}
          className={`text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 ${
            pageView === 'about'
              ? 'text-primary font-bold underline underline-offset-4'
              : 'text-ash hover:text-primary hover:underline hover:underline-offset-4'
          }`}
        >
          {language === 'am' ? 'ስለ እኛ' : language === 'om' ? "Waa'ee Keenya" : 'About Us'}
        </button>

        <span className="w-1 h-1 rounded-full bg-outline-variant" />

        <button
          onClick={() => handleNavClick('contact')}
          className={`text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 ${
            pageView === 'contact'
              ? 'text-primary font-bold underline underline-offset-4'
              : 'text-ash hover:text-primary hover:underline hover:underline-offset-4'
          }`}
        >
          {language === 'am' ? 'ያግኙን' : language === 'om' ? 'Nu Quunnamaa' : 'Contact Us'}
        </button>
      </nav>
    </>
  );
};
