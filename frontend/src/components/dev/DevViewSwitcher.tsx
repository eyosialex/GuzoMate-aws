import React from 'react';
import { useAppStore } from '../../features/useAppStore';
import { PageView } from '../../types';
import { ArrowLeftRight, Terminal } from 'lucide-react';

export const DevViewSwitcher: React.FC = () => {
  const { pageView, setPageView, currentUser, setCurrentUser } = useAppStore();

  const handleToggle = () => {
    let nextView: PageView = 'landing';
    if (pageView === 'landing') {
      nextView = 'home';
    } else if (pageView === 'home') {
      nextView = 'explore';
    } else {
      nextView = 'landing';
    }

    if (nextView !== 'landing' && !currentUser) {
      setCurrentUser({
        id: 'dev-user-01',
        name: 'Developer',
        email: 'dev@guzomate.et',
        preferredLanguage: 'en',
        isGuildVerified: true,
      });
    }

    setPageView(nextView);
  };

  const currentLabel = pageView === 'explore' || pageView === 'app' 
    ? 'Explore' 
    : pageView === 'home' 
    ? 'Home' 
    : 'Landing';

  const nextLabel = currentLabel === 'Landing' 
    ? 'Home' 
    : currentLabel === 'Home' 
    ? 'Explore' 
    : 'Landing';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] select-none">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-900/95 hover:bg-black text-white text-xs font-mono font-bold shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
        title={`Development Shortcut: Currently on ${currentLabel}. Click to switch to ${nextLabel}`}
        aria-label="Development page view toggle"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Terminal className="w-3.5 h-3.5 text-secondary-light" />
        <span className="text-[11px] text-ash group-hover:text-white transition-colors">
          Dev: [{currentLabel}] → {nextLabel}
        </span>
        <ArrowLeftRight className="w-3 h-3 text-secondary group-hover:rotate-180 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default DevViewSwitcher;
