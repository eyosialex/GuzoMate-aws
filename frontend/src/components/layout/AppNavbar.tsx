import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { Language } from '../../types';
import logoImg from '../../assets/logo.png';
import { 
  Bell, 
  Globe, 
  ChevronDown, 
  Check, 
  Menu, 
  X 
} from 'lucide-react';

interface AppNavbarProps {
  activePage?: 'home' | 'explore' | 'incidents';
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ activePage }) => {
  const { 
    pageView, 
    setPageView, 
    language, 
    setLanguage, 
    currentUser, 
    setCurrentUser 
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        langDropdownRef.current && 
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: Array<{ code: Language; label: string; full: string }> = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'am', label: 'አማ', full: 'አማርኛ' },
    { code: 'om', label: 'OM', full: 'Afaan Oromoo' },
  ];
  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const handleSignOut = () => {
    setCurrentUser(null);
    setPageView('landing');
  };

  const handleHomeClick = () => {
    if (pageView === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPageView('home');
    }
    setMobileMenuOpen(false);
  };

  const handleExploreClick = () => {
    setPageView('explore');
    setMobileMenuOpen(false);
  };

  const handleIncidentsClick = () => {
    setPageView('incidents');
    setMobileMenuOpen(false);
  };

  const effectiveActive = activePage || (pageView === 'app' ? 'explore' : pageView);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface/85 border-b border-outline-variant/30 transition-all duration-300">
      <div className="w-full px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between">
        
        {/* Far Top Left Side: GuzoMate Logo and Name */}
        <div 
          onClick={handleHomeClick}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-highland transition-all duration-300 group-hover:scale-105 border border-primary-light/20">
            <img src={logoImg} alt="GuzoMate Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight text-primary group-hover:text-primary-dark transition-colors">
            GuzoMate
          </span>
        </div>

        {/* Center Navigation Links: Home, Explore, Incidents */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold">
          <button 
            onClick={handleHomeClick} 
            className={`pb-1 transition-colors flex items-center gap-1 ${
              effectiveActive === 'home'
                ? 'text-primary font-extrabold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {language === 'am' ? 'መነሻ' : language === 'om' ? 'Mana' : 'Home'}
          </button>
          
          <button 
            onClick={handleExploreClick} 
            className={`pb-1 transition-colors flex items-center gap-1 ${
              effectiveActive === 'explore'
                ? 'text-primary font-extrabold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {language === 'am' ? 'አስስ' : language === 'om' ? 'Daawwadhu' : 'Explore'}
          </button>

          <button 
            onClick={handleIncidentsClick} 
            className={`pb-1 transition-colors flex items-center gap-1.5 ${
              effectiveActive === 'incidents'
                ? 'text-primary font-extrabold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>{language === 'am' ? 'አደጋዎች' : language === 'om' ? 'Balaa' : 'Incidents'}</span>
            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded border border-primary-light/30">
              3
            </span>
          </button>
        </nav>

        {/* Far Top Right Side: Notifications, Language Dropdown & User Profile / Sign Out */}
        <div className="hidden md:flex items-center gap-3">
          {/* Notification Bell (In the position of the previous audio button) */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm relative ${
                notificationsOpen
                  ? 'bg-primary text-white border-primary shadow-glow-emerald'
                  : 'bg-surface-low text-ash hover:text-primary hover:bg-surface-high border-outline-variant/40'
              }`}
              aria-label="Highland Alerts & Notifications"
              title="Highland Travel Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse" />
            </button>

            {/* Notification Popover Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-outline-variant/40 shadow-xl p-3.5 z-50 animate-in fade-in-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2.5 font-bold text-primary">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">notifications_active</span>
                    Highland Travel Alerts
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">3 active</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-surface-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-on-surface">Gotera Interchange resurfacing</p>
                      <span className="text-[10px] text-ash">10m ago</span>
                    </div>
                    <p className="text-ash text-[11px] mt-0.5">1 lane reduced; traffic flowing steadily.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-on-surface">Entoto Pass fog advisory</p>
                      <span className="text-[10px] text-ash">25m ago</span>
                    </div>
                    <p className="text-ash text-[11px] mt-0.5">Heavy highland fog near mountain summit.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-on-surface">Meskel Square corridor</p>
                      <span className="text-[10px] text-ash">1h ago</span>
                    </div>
                    <p className="text-ash text-[11px] mt-0.5">All lanes open; normal traffic flow reported.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle Dropdown Menu */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low hover:bg-surface-high border border-outline-variant/40 text-xs font-bold text-on-surface transition-all shadow-sm select-none"
              aria-label="Language selector dropdown"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{currentLangObj.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-ash transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-outline-variant/40 shadow-xl p-1.5 z-50 animate-in fade-in-50 text-xs">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      language === l.code
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-on-surface hover:bg-surface-low'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{l.label}</span>
                      <span className="text-[11px] text-ash font-normal">({l.full})</span>
                    </span>
                    {language === l.code && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Sign Out Button */}
          <div className="flex items-center gap-2">
            {currentUser?.name && (
              <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-low border border-outline-variant/40 text-xs font-semibold text-primary">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="px-5 py-2 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors shadow-sm"
            >
              {language === 'am' ? 'ውጣ' : language === 'om' ? "Ba'i" : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Mobile Actions: Notifications, Language Dropdown & Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Notification Bell */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-surface-low border border-outline-variant/40 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse" />
          </button>

          {/* Mobile Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-low border border-outline-variant/40 text-[11px] font-bold text-on-surface"
            >
              <Globe className="w-3 h-3 text-primary" />
              <span>{currentLangObj.label}</span>
              <ChevronDown className="w-3 h-3 text-ash" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-outline-variant/40 shadow-xl p-1 z-50 text-xs">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left ${
                      language === l.code ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-surface-low'
                    }`}
                  >
                    <span>{l.label} ({l.full})</span>
                    {language === l.code && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            )}
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

      {/* Mobile Dropdown Sheet with Home, Explore, Incidents & Sign Out */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-lg px-6 py-4 space-y-3 animate-in slide-in-from-top-4">
          <div className="flex flex-col space-y-1 pb-2 border-b border-outline-variant/20">
            <button 
              onClick={handleHomeClick} 
              className={`w-full py-2.5 px-3 text-left font-bold rounded-xl transition-colors ${
                effectiveActive === 'home' ? 'text-primary bg-primary/10' : 'text-on-surface hover:bg-surface-low'
              }`}
            >
              {language === 'am' ? 'መነሻ' : language === 'om' ? 'Mana' : 'Home'}
            </button>
            <button 
              onClick={handleExploreClick} 
              className={`w-full py-2.5 px-3 text-left font-bold rounded-xl transition-colors ${
                effectiveActive === 'explore' ? 'text-primary bg-primary/10' : 'text-on-surface hover:bg-surface-low'
              }`}
            >
              {language === 'am' ? 'አስስ' : language === 'om' ? 'Daawwadhu' : 'Explore'}
            </button>
            <button 
              onClick={handleIncidentsClick} 
              className={`w-full py-2.5 px-3 text-left font-bold rounded-xl transition-colors flex items-center justify-between ${
                effectiveActive === 'incidents' ? 'text-primary bg-primary/10' : 'text-on-surface hover:bg-surface-low'
              }`}
            >
              <span>{language === 'am' ? 'አደጋዎች' : language === 'om' ? 'Balaa' : 'Incidents'}</span>
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3 new</span>
            </button>
          </div>

          <button
            onClick={() => {
              handleSignOut();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold text-center hover:bg-red-50"
          >
            {language === 'am' ? 'ውጣ' : language === 'om' ? "Ba'i" : 'Sign Out'}
          </button>
        </div>
      )}
    </header>
  );
};

export default AppNavbar;


