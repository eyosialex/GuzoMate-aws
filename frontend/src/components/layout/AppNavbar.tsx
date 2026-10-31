import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Language } from '../../types';
import logoImg from '../../assets/logo.png';
import { 
  Bell, 
  Globe, 
  ChevronDown, 
  Check, 
  Menu, 
  X,
  Compass,
  LogOut
} from 'lucide-react';
import '../../styles/home.css';

interface AppNavbarProps {
  activePage?: 'home' | 'explore' | 'incidents' | 'about' | 'contact';
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ activePage }) => {
  const { 
    pageView, 
    setPageView, 
    setActiveTab,
    language, 
    setLanguage, 
    currentUser, 
    setCurrentUser,
    openAuthModal,
    openProfileModal 
  } = useAppStore();
  const activeUser = currentUser;
  const displayedName = activeUser?.name ? activeUser.name.split(' ')[0] : 'Profile';
  const { unreadCount } = useNotifications();

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

  const t = {
    en: {
      home: 'Home',
      savedPlaces: 'Saved Places',
      weather: 'Weather',
      incidents: 'Incidents',
      exploreMap: 'Explore Map',
      login: 'Log in',
      signup: 'Sign up',
      logout: 'Logout',
      alerts: 'Travel Alerts',
    },
    am: {
      home: 'መነሻ',
      savedPlaces: 'የተቀመጡ ቦታዎች',
      weather: 'የአየር ሁኔታ',
      incidents: 'ክስተቶች',
      exploreMap: 'ካርታ ያስሱ',
      login: 'ይግቡ',
      signup: 'ይመዝገቡ',
      logout: 'ውጣ',
      alerts: 'የጉዞ ማስጠንቀቂያዎች',
    },
    om: {
      home: 'Mana',
      savedPlaces: 'Bakkeewwan Olkaa’aman',
      weather: 'Qilleensa',
      incidents: 'Balaa Daandii',
      exploreMap: 'Kaartaa Daawwadhaa',
      login: 'Seenaa',
      signup: "Galmaa'aa",
      logout: "Ba'aa",
      alerts: 'Akeekkachiisa Imalaa',
    },
  }[language] || {
    home: 'Home',
    savedPlaces: 'Saved Places',
    weather: 'Weather',
    incidents: 'Incidents',
    exploreMap: 'Explore Map',
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Logout',
    alerts: 'Travel Alerts',
  };

  const handleHomeClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pageView === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPageView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleSavedPlacesClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pageView === 'home') {
      const el = document.getElementById('saved-places');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setPageView('home');
      setTimeout(() => {
        const el = document.getElementById('saved-places');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
    setMobileMenuOpen(false);
  };

  const handleWeatherClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pageView === 'home') {
      const el = document.getElementById('weather');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (pageView === 'explore' || pageView === 'app') {
      setActiveTab('weather');
    } else {
      setPageView('home');
      setTimeout(() => {
        const el = document.getElementById('weather');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
    setMobileMenuOpen(false);
  };

  const handleIncidentsClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pageView === 'home') {
      const el = document.getElementById('incidents');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setPageView('incidents');
    }
    setMobileMenuOpen(false);
  };

  const handleExploreClick = () => {
    setPageView('explore');
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('guzomate_token');
    localStorage.removeItem('guzo_access_token');
    setPageView('landing');
    setMobileMenuOpen(false);
  };

  const effectiveActive = activePage || (pageView === 'app' ? 'explore' : pageView);

  return (
    <header className="home-header sticky top-0 z-50 bg-[#f8f7f2]/90 backdrop-blur-md border-b border-[rgba(32,34,31,0.12)] transition-all">
      {/* Brand Identity */}
      <a
        className="brand cursor-pointer"
        href="#home"
        onClick={handleHomeClick}
        aria-label="GuzoMate home"
      >
        <span className="brand-mark">
          <img src={logoImg} alt="GuzoMate Logo" />
        </span>
        <span>
          GuzoMate<span className="brand-period">.</span>
        </span>
      </a>

      {/* Center Desktop Navigation */}
      <nav className="home-nav hidden md:flex items-center gap-7 text-xs font-medium" aria-label="Main navigation">
        <a
          href="#home"
          onClick={handleHomeClick}
          className={effectiveActive === 'home' ? 'active' : ''}
        >
          {t.home}
        </a>
        <a
          href="#saved-places"
          onClick={handleSavedPlacesClick}
        >
          {t.savedPlaces}
        </a>
        <a
          href="#weather"
          onClick={handleWeatherClick}
        >
          {t.weather}
        </a>
        <a
          href="#incidents"
          onClick={handleIncidentsClick}
          className={effectiveActive === 'incidents' ? 'active' : ''}
        >
          {t.incidents}
        </a>

        {/* Explore Map: Bright lucid button */}
        <button
          type="button"
          onClick={handleExploreClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs border ${
            effectiveActive === 'explore'
              ? 'bg-white text-blue-600 border-blue-600/35 ring-2 ring-blue-600/15 shadow-sm font-bold'
              : 'bg-white hover:bg-stone-50 text-blue-600 border-black/10 hover:border-blue-600/30'
          }`}
          title="Explore interactive map"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>{t.exploreMap}</span>
        </button>
      </nav>

      {/* Far Right Desktop Controls */}
      <div className="home-header-right flex items-center gap-3">
        {/* Notification Alert Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`w-8 h-8 rounded-full border transition-all duration-200 flex items-center justify-center shadow-xs cursor-pointer ${
              notificationsOpen
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-stone-700 hover:text-blue-600 hover:bg-stone-50 border-black/10'
            }`}
            aria-label={t.alerts}
            title={unreadCount > 0 ? `${unreadCount} unread alerts` : t.alerts}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 z-50">
              <NotificationCenter onClose={() => setNotificationsOpen(false)} />
            </div>
          )}
        </div>

        {/* Multilingual Selector */}
        <div className="relative" ref={langDropdownRef}>
          <button
            type="button"
            className="home-lang-trigger cursor-pointer"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-label="Select language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentLangObj.label}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                langDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-38 bg-white rounded-2xl shadow-xl border border-black/10 p-1.5 z-50 animate-in fade-in duration-150">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
                    language === l.code
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold">{l.label}</span>
                    <span className="text-[11px] text-stone-400">({l.full})</span>
                  </span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Authentication & Profile Controls */}
        {activeUser ? (
          <div className="flex items-center gap-2">
            {/* <button
              type="button"
              onClick={openProfileModal}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-black py-1.5 px-3 rounded-full border border-black/10 bg-white shadow-xs cursor-pointer hover:border-black/20 transition-all"
              title="Open Profile"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="max-w-[100px] truncate">{displayedName}</span>
            </button> */}
            <button
              type="button"
              className="logout-button cursor-pointer"
              onClick={handleSignOut}
              title={t.logout}
            >
              <span>{t.logout}</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold text-stone-700 hover:text-black py-1.5 px-3 cursor-pointer transition-colors"
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 py-1.5 px-3.5 rounded-full shadow-xs cursor-pointer transition-all"
            >
              {t.signup}
            </button>
          </div>
        )}

        {/* Mobile Menu Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden col-span-3 pt-3 pb-4 border-t border-[rgba(32,34,31,0.08)] flex flex-col gap-2 bg-[#f8f7f2] animate-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={handleHomeClick}
            className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
              effectiveActive === 'home' ? 'bg-blue-50 text-blue-600' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t.home}
          </button>
          <button
            type="button"
            onClick={handleSavedPlacesClick}
            className="w-full text-left py-2 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            {t.savedPlaces}
          </button>
          <button
            type="button"
            onClick={handleWeatherClick}
            className="w-full text-left py-2 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            {t.weather}
          </button>
          <button
            type="button"
            onClick={handleIncidentsClick}
            className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
              effectiveActive === 'incidents' ? 'bg-blue-50 text-blue-600' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            {t.incidents}
          </button>
          <button
            type="button"
            onClick={handleExploreClick}
            className="w-full text-left py-2.5 px-3 text-xs font-bold text-blue-600 bg-white border border-blue-600/30 rounded-xl shadow-xs flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>{t.exploreMap}</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Live</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default AppNavbar;
