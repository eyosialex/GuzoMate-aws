import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Compass, 
  PhoneCall, 
  Bell, 
  Globe, 
  LogOut, 
  Bookmark, 
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../features/AuthContext';
import { useAppStore } from '../../features/useAppStore';
import { Language } from '../../types';
import { springTactile } from '../../lib/motion';
import logoImg from '../../assets/logo.png';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const savedPlaceIds = useAppStore((state) => state.savedPlaceIds);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { path: '/app', label: 'Dashboard' },
        { path: '/explore', label: 'Explore Map' },
        { path: '/routes', label: 'Routes' },
        { path: '/incidents', label: 'Road Incidents' },
        { path: '/assistant', label: 'AI Assistant' },
        { path: '/about', label: 'About GuzoMate' },
      ]
    : [
        { path: '/', label: 'Overview' },
        { path: '/explore', label: 'Explore Map' },
        { path: '/routes', label: 'Routes' },
        { path: '/incidents', label: 'Road Incidents' },
        { path: '/emergency', label: 'Emergency 991' },
      ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'am', label: 'አማ' },
    { code: 'om', label: 'OM' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8e3] shadow-[0_1px_4px_rgba(0,0,0,0.03)] font-sans">
      <div className="max-w-[1560px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Highlands Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to={isAuthenticated ? "/app" : "/"} className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { rotate: 5, scale: 1.05 }}
              transition={springTactile}
              className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shadow-sm bg-white border border-[#d1e2d8]"
            >
              <img src={logoImg} alt="GuzoMate Logo" className="w-full h-full object-contain p-0.5" />
            </motion.div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-gray-900 group-hover:text-[#183a2b] transition-colors">
                  GuzoMate
                </span>
                <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-1.5 py-0.2 rounded-md">
                  Highlands
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || 
              (link.path !== '/' && link.path !== '/app' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#183a2b] bg-[#f0f7f3] font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#183a2b] rounded-full"
                    transition={springTactile}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Stack: Language + Emergency CTA + Alerts + User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multilingual Switcher */}
          <div className="flex items-center bg-gray-100/90 rounded-lg p-0.5 border border-gray-200/60">
            <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-0.5 hidden sm:block" />
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  language === l.code
                    ? 'bg-white text-[#183a2b] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Emergency Contacts Direct Dial CTA matching screen-2 & screen-6 */}
          <Link
            to="/emergency"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#183a2b] hover:bg-[#122e22] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer group"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span className="hidden sm:inline">Emergency Contacts</span>
            <span className="sm:hidden">991</span>
          </Link>

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            className="relative h-9 w-9 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/50 flex items-center justify-center text-gray-700 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Link>

          {/* User Profile & Menu or Sign In */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt={user?.fullName || "User"}
                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-[#183a2b]/20"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    {user?.fullName || 'Scout'}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-none">
                    {user?.scoutGuildBadge || 'Verified Driver'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 hidden md:block" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{user?.fullName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-[#eef5f1] text-[#183a2b] px-1.5 py-0.5 rounded">
                      Trust: {user?.trustRating || 98.4}%
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span>Scout Profile & Preferences</span>
                  </Link>

                  <Link
                    to="/saved"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bookmark className="w-4 h-4 text-gray-500" />
                      <span>Saved Places</span>
                    </div>
                    {savedPlaceIds.length > 0 && (
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.2 rounded-full font-bold">
                        {savedPlaceIds.length}
                      </span>
                    )}
                  </Link>

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="py-1.5 px-3 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="lg:hidden flex items-center justify-around px-2 py-1.5 bg-[#f8faf8] border-t border-gray-200/60 overflow-x-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || 
            (link.path !== '/' && link.path !== '/app' && location.pathname.startsWith(link.path));
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-[#183a2b] bg-[#e2efe7] font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;


