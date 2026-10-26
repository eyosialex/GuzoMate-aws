import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { Language, PageView } from '../../types';
import { 
  Compass, 
  MapPin, 
  PhoneCall, 
  ShieldCheck, 
  User as UserIcon, 
  Menu, 
  X, 
  LogOut, 
  Info, 
  Mail,
  Sparkles
} from 'lucide-react';

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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems: { id: PageView; labelEn: string; labelAm: string; labelOm: string; icon: React.ReactNode }[] = [
    { id: 'landing', labelEn: 'Explore', labelAm: 'ዳሰሳ', labelOm: 'Qorannoo', icon: <Compass className="w-4 h-4" /> },
    { id: 'app', labelEn: 'Interactive Map', labelAm: 'ካርታና መስመሮች', labelOm: 'Kaartaa', icon: <MapPin className="w-4 h-4" /> },
    { id: 'about', labelEn: 'About Us', labelAm: 'ስለ እኛ', labelOm: 'Waa\'ee Keenya', icon: <Info className="w-4 h-4" /> },
    { id: 'contact', labelEn: 'Contact Us', labelAm: 'ያግኙን', labelOm: 'Nu Quunnamaa', icon: <Mail className="w-4 h-4" /> },
  ];

  const getLabel = (item: typeof navItems[0]) => {
    if (language === 'am') return item.labelAm;
    if (language === 'om') return item.labelOm;
    return item.labelEn;
  };

  const handleNavClick = (view: PageView) => {
    setPageView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface/85 border-b border-outline-variant/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-highland group-hover:bg-primary-dark transition-all duration-300 group-hover:scale-105 border border-primary-light/20">
            <span className="material-symbols-outlined text-[24px]">landscape</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-2xl tracking-tight text-primary">
                GuzoMate
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                ጉዞሜት
              </span>
            </div>
            <p className="text-[11px] font-medium text-ash hidden sm:block tracking-wide">
              Verified Highland Travel Intelligence
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-low/80 p-1.5 rounded-full border border-outline-variant/40 shadow-sm">
          {navItems.map((item) => {
            const isActive = pageView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-high/60'
                }`}
              >
                {item.icon}
                <span>{getLabel(item)}</span>
                {item.id === 'app' && (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Lang Switcher, Emergency Dial & Auth */}
        <div className="hidden lg:flex items-center gap-3">
          
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

          {/* Emergency Direct Hotlines Trigger */}
          <a
            href="tel:991"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-sm"
            title="Toll-free Highway Emergency Hotline: 991"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-bounce" />
            <span>Emergency 991</span>
          </a>

          {/* User Authentication Pill / Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-lowest border border-outline-variant/50 hover:border-primary/50 text-xs font-semibold shadow-sm transition-all text-on-surface"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate">{currentUser.name}</span>
                {currentUser.isGuildVerified && (
                  <span title="Guild Verified Traveler">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  </span>
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-outline-variant/40 shadow-floating p-2 z-50 text-xs animate-in fade-in-50">
                  <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                    <p className="font-bold text-primary truncate">{currentUser.name}</p>
                    <p className="text-ash truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      Verified Highland Traveler
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setPageView('app');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-surface-low text-on-surface font-medium"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    Open Route Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-red-600 hover:bg-red-50 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow-highland hover:bg-primary-dark transition-all transform hover:-translate-y-0.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Trilingual Switcher for Mobile */}
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

      {/* Mobile Dropdown Menu Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${
                  pageView === item.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-lowest text-on-surface border-outline-variant/30'
                }`}
              >
                {item.icon}
                <span>{getLabel(item)}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
            <a
              href="tel:991"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              Emergency Highway Dispatch: 991 / 907
            </a>

            {currentUser ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-low border border-outline-variant/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">{currentUser.name}</p>
                    <p className="text-[10px] text-ash">Verified Traveler</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="text-xs text-red-600 font-semibold p-1.5 rounded-lg hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-highland flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-secondary-light" />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
