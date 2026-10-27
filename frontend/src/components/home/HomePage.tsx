import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../features/useAppStore';
import { StaticHighlandBackground } from './StaticHighlandBackground';
import { AppNavbar } from '../layout/AppNavbar';
import { weatherService } from '../../services/weatherService';
import { incidentsService } from '../../services/incidentsService';
import { placesService } from '../../services/placesService';
import { assistantService } from '../../services/assistantService';
import { Place, Incident, WeatherData } from '../../types';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight, 
  PhoneCall, 
  CheckCircle2, 
  Navigation, 
  Clock, 
  CloudSun, 
  ShieldCheck, 
  Building2,
  Bookmark,
  Trash2,
  Droplets,
  Eye,
  Sun,
  Wind,
  Send,
  Loader2,
  X,
  Bot
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { 
    setPageView,
    setActiveTab,
    savedPlaceIds,
    toggleSavePlace,
    setSelectedPlace,
    language,
    userLocation,
    addMessage
  } = useAppStore();

  // Ask GuzoMate pull-down state
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [assistantPlaces, setAssistantPlaces] = useState<Place[]>([]);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const askInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAskOpen) {
      const timer = setTimeout(() => {
        askInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isAskOpen]);

  const handleAssistantSubmit = async (queryText?: string) => {
    const textToSend = (queryText || askQuery).trim();
    if (!textToSend || isAsking) return;

    setIsAsking(true);
    setAssistantError(null);
    setAssistantAnswer(null);
    setAssistantPlaces([]);

    // Save user message to global chat history
    addMessage({
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    try {
      const response = await assistantService.query({
        query: textToSend,
        language,
        location: userLocation,
      });

      setAssistantAnswer(response.answer);
      if (response.places && response.places.length > 0) {
        setAssistantPlaces(response.places);
      }

      // Save assistant message to global chat history
      addMessage({
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        places: response.places,
        weather: response.weather,
        incidents: response.incidents,
        sources: response.sources,
      });
      setAskQuery('');
    } catch {
      setAssistantError('Unable to connect to assistant service right now. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  // Saved Places state
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Weather state (real backend data)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Incidents state (real backend data)
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);

  // Fetch saved places
  useEffect(() => {
    let active = true;
    if (savedPlaceIds.length === 0) {
      setSavedPlaces([]);
      return;
    }

    setLoadingSaved(true);
    Promise.allSettled(savedPlaceIds.map((id) => placesService.getPlaceById(id))).then((results) => {
      if (active) {
        const places = results
          .filter((r): r is PromiseFulfilledResult<Place> => r.status === 'fulfilled')
          .map((r) => r.value);
        setSavedPlaces(places);
        setLoadingSaved(false);
      }
    });

    return () => {
      active = false;
    };
  }, [savedPlaceIds]);

  // Fetch real weather
  useEffect(() => {
    let active = true;
    weatherService.getFullWeather(userLocation.lat, userLocation.lon, undefined, language)
      .then((data) => {
        if (active) {
          setWeatherData(data);
          setWeatherLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setWeatherData(null);
          setWeatherLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userLocation.lat, userLocation.lon, language]);

  // Fetch real nearby incidents
  useEffect(() => {
    let active = true;
    incidentsService.getNearby({
      lat: userLocation.lat,
      lon: userLocation.lon,
      radiusMeters: 15000,
    })
      .then((res) => {
        if (active) {
          setIncidents(res.items || []);
          setIncidentsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setIncidents([]);
          setIncidentsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userLocation.lat, userLocation.lon]);

  return (
    <div className="relative min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      
      {/* 3D Static Highland Terrain & Core Background */}
      <StaticHighlandBackground />

      {/* Application Navigation Bar */}
      <AppNavbar activePage="home" />

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-grow">
        
        {/* 1. HERO SECTION */}
        <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center justify-center overflow-hidden py-14 px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-primary mb-4 tracking-tight drop-shadow-sm">
              Explore with confidence.
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed font-normal">
              Discover places nearby, plan your journey, and get trusted travel guidance in your language.
            </p>

            {/* Hero CTAs: Ask GuzoMate with Pull-Down Text Field */}
            <div className="w-full flex flex-col items-center justify-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setIsAskOpen(!isAskOpen)}
                className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer border ${
                  isAskOpen
                    ? 'bg-primary text-white border-primary shadow-highland'
                    : 'bg-surface-lowest/95 backdrop-blur-md text-primary border-outline-variant/40 hover:bg-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Ask GuzoMate</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isAskOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Pull-Down Assistant Text Field & Response Panel */}
              <AnimatePresence>
                {isAskOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="w-full max-w-2xl text-left overflow-hidden mt-1"
                  >
                    <div className="bg-surface-lowest rounded-2xl border border-outline-variant/50 p-4 sm:p-5 shadow-highland backdrop-blur-md">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAssistantSubmit();
                        }}
                        className="flex items-center gap-2"
                      >
                        <div className="relative flex-1">
                          <Bot className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            ref={askInputRef}
                            type="text"
                            value={askQuery}
                            onChange={(e) => setAskQuery(e.target.value)}
                            placeholder="Ask GuzoMate anything about routes, places, weather, and safe travel..."
                            className="w-full pl-10 pr-4 py-3 bg-surface-low/80 border border-outline-variant/40 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-ash focus:outline-none focus:border-primary focus:bg-white transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!askQuery.trim() || isAsking}
                          className="px-4 py-3 bg-primary text-white font-bold text-xs rounded-xl shadow-xs hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {isAsking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Ask</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAskOpen(false);
                            setAssistantAnswer(null);
                            setAssistantError(null);
                          }}
                          className="p-3 text-ash hover:text-on-surface rounded-xl hover:bg-surface-low transition-colors cursor-pointer"
                          title="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Quick Prompt Chips */}
                      {!assistantAnswer && !isAsking && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20 text-xs">
                          <span className="text-[11px] font-semibold text-ash">Try asking:</span>
                          {[
                            'Safe route to Debre Birhan',
                            'Best traditional coffee in Bole',
                            '24/7 hospitals near me',
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setAskQuery(chip);
                                handleAssistantSubmit(chip);
                              }}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface-low hover:bg-primary/10 text-on-surface hover:text-primary border border-outline-variant/30 transition-colors cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Loading State */}
                      {isAsking && (
                        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-3">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          <span className="text-xs font-medium text-primary">
                            GuzoMate is retrieving highland intelligence & local telemetry...
                          </span>
                        </div>
                      )}

                      {/* Error State */}
                      {assistantError && (
                        <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center justify-between">
                          <span>{assistantError}</span>
                          <button
                            type="button"
                            onClick={() => handleAssistantSubmit()}
                            className="font-bold underline hover:text-red-900 cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Assistant Answer Box */}
                      {assistantAnswer && (
                        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                              <Bot className="w-4 h-4 text-secondary" />
                              <span>GuzoMate AI Response</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('assistant');
                                setPageView('explore');
                              }}
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open in Assistant</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                            {assistantAnswer}
                          </p>

                          {/* Related Places Chips */}
                          {assistantPlaces.length > 0 && (
                            <div className="pt-2 border-t border-primary/15 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-ash">
                                Recommended Places:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {assistantPlaces.slice(0, 3).map((place) => (
                                  <button
                                    key={place.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPlace(place);
                                      setActiveTab('places');
                                      setPageView('explore');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-lowest border border-primary/20 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                  >
                                    <MapPin className="w-3 h-3 text-secondary" />
                                    <span>{place.name}</span>
                                    {place.distanceMeters !== null && place.distanceMeters !== undefined && (
                                      <span className="text-[10px] opacity-75">
                                        ({place.distanceMeters > 1000 ? `${(place.distanceMeters / 1000).toFixed(1)}km` : `${place.distanceMeters}m`})
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                setAssistantAnswer(null);
                                setAssistantPlaces([]);
                                setAskQuery('');
                                setTimeout(() => askInputRef.current?.focus(), 50);
                              }}
                              className="text-ash hover:text-primary font-medium hover:underline cursor-pointer"
                            >
                              Ask another question
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* 2. QUICK ACTIONS HUB (4 CARDS MAPPING DIRECTLY TO 4 SUBPAGES) */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-16 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Card 1: Discover Places */}
            <div 
              onClick={() => {
                setActiveTab('places');
                setPageView('explore');
              }}
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  Discover Places
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Search nearby health facilities, cafes, dining, and guaranteed fuel points across Addis Ababa.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>Open Discover</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 2: AI Travel Assistant */}
            <div 
              onClick={() => {
                setActiveTab('assistant');
                setPageView('explore');
              }}
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>AI Assistant</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                    Voice &amp; Text
                  </span>
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Real-time travel guide fluent in English, አማርኛ, and Afaan Oromoo with instant voice assistance.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>Start Assistant</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 3: Route & Transit */}
            <div 
              onClick={() => {
                setActiveTab('routes');
                setPageView('explore');
              }}
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <Navigation className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  Plan Route &amp; Transit
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bus corridors, LRT train links, driving directions, and multi-modal transit timing across corridors.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>Calculate Routes</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 4: Road Incidents */}
            <div 
              onClick={() => {
                setPageView('incidents');
              }}
              className="group bg-surface-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <AlertTriangle className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                  Report &amp; View Incidents
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Crowdsourced safety alerts: traffic slowdowns, road damage, flooded underpasses, and hazards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-bold text-primary">
                <span>View Incident Radar</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>
        </section>

        {/* 3. SAVED PLACES SECTION (SCROLLABLE LIST LAYOUT) */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <Bookmark className="w-4 h-4 text-secondary" />
                <span>Your Bookmarks</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-primary tracking-tight">
                Saved Places
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Your quick-access locations, emergency points, and favorite highland stops.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => {
                setActiveTab('places');
                setPageView('explore');
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore more places</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List or Empty State */}
          {savedPlaces.length === 0 ? (
            <div className="bg-surface-lowest rounded-2xl p-8 sm:p-10 border border-outline-variant/30 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Bookmark className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-base font-bold text-on-surface mb-1">
                Save places to get them quickly
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mb-5 leading-relaxed">
                You haven't saved any locations yet. Bookmark your favorite hospitals, cafes, and fuel stops across Addis Ababa for fast one-tap access.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('places');
                  setPageView('explore');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
              >
                <Compass className="w-4 h-4 text-secondary-light" />
                <span>Explore &amp; Save Places</span>
              </button>
            </div>
          ) : (
            <div className="bg-surface-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/20 p-2 sm:p-3">
                {savedPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="p-3 hover:bg-surface-low/70 rounded-xl transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                            {place.name}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant shrink-0">
                            {place.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          {place.address || 'Addis Ababa'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlace(place);
                          setActiveTab('places');
                          setPageView('explore');
                        }}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span>View on Map</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSavePlace(place.id)}
                        className="p-1.5 text-ash hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove bookmark"
                        aria-label="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* 4. REAL WEATHER & MICROCLIMATE + RECENT ROAD INCIDENTS */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20" id="road-incidents">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Weather & Microclimate (5 Cols) */}
            <div className="lg:col-span-5 bg-surface-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-primary">
                  Addis Ababa
                </h3>
                <p className="text-xxs text-on-surface-variant">
                  At Your Current Location.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-low rounded-2xl mb-5 border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface-lowest flex items-center justify-center text-primary shadow-sm">
                    <CloudSun className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <div className="text-3xl font-display font-extrabold text-primary">
                      {weatherData?.current ? (
                        <>
                          {Math.round(weatherData.current.temperatureC)}°C{' '}
                          <span className="text-sm font-normal text-on-surface-variant">
                            / {Math.round((weatherData.current.temperatureC * 9) / 5 + 32)}°F
                          </span>
                        </>
                      ) : (
                        <span>--°C</span>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant font-medium">
                      {weatherData?.current?.condition || (weatherLoading ? 'Loading weather...' : 'Weather data unavailable')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clothing Advice Callout */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 mb-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                  dry_cleaning
                </span>
                <div>
                  <h4 className="text-xs font-bold text-primary mb-0.5">
                    Highland Travel Clothing Advice
                  </h4>
                  <p className="text-xs text-on-surface leading-snug">
                    {weatherData?.arrivalAdvice?.suggestions?.find((s) => s.type === 'clothing')?.text ||
                     weatherData?.arrivalAdvice?.suggestions?.[0]?.text ||
                     (weatherLoading
                       ? 'Calculating atmospheric clothing recommendation...'
                       : 'Weather advisories currently unavailable — please check back shortly.')}
                  </p>
                </div>
              </div>

              {/* Climate Telemetry */}
              <div className="grid grid-cols-3 gap-3 text-center border-t border-outline-variant/20 pt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-low/60">
                  <div className="text-ash text-[10px] flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-primary" />
                    <span>Precipitation</span>
                  </div>
                  <div className="font-bold text-primary mt-0.5 text-sm">
                    {weatherData?.arrivalAdvice?.forecast?.precipitationProbability !== undefined && weatherData?.arrivalAdvice?.forecast?.precipitationProbability !== null
                      ? `${weatherData.arrivalAdvice.forecast.precipitationProbability}%`
                      : weatherData?.current?.precipitationMm !== undefined && weatherData?.current?.precipitationMm !== null
                      ? `${weatherData.current.precipitationMm} mm`
                      : '--'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-low/60">
                  <div className="text-ash text-[10px] flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 text-primary" />
                    <span>Wind Speed</span>
                  </div>
                  <div className="font-bold text-primary mt-0.5 text-sm">
                    {weatherData?.current?.windKph !== undefined && weatherData?.current?.windKph !== null
                      ? `${weatherData.current.windKph} km/h`
                      : '--'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-low/60">
                  <div className="text-ash text-[10px] flex items-center justify-center gap-1">
                    <Sun className="w-3 h-3 text-secondary" />
                    <span>Humidity</span>
                  </div>
                  <div className="font-bold text-primary mt-0.5 text-sm">
                    {weatherData?.current?.humidity !== undefined && weatherData?.current?.humidity !== null
                      ? `${weatherData.current.humidity}%`
                      : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Incidents (7 Cols) */}
            <div className="lg:col-span-7 bg-surface-lowest p-6 sm:p-7 rounded-3xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/30 gap-2 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-lg font-bold text-primary">
                        Recent Incidents
                      </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Real-time crowdsourced reports verified by local travelers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPageView('incidents')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Real Incidents List or Empty State */}
                {incidentsLoading ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    Checking active road alerts nearby...
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center bg-surface-low/60 rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h4 className="text-sm font-bold text-on-surface mb-1">
                      No incidents reported nearby
                    </h4>
                    <p className="text-xs text-on-surface-variant max-w-sm mb-4">
                      All major road corridors and transit routes in Addis Ababa are currently clear and operating normally.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPageView('incidents')}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Report a new hazard or incident</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {incidents.slice(0, 3).map((incident) => (
                      <div 
                        key={incident.id}
                        className="p-4 rounded-xl bg-surface-low/80 border border-outline-variant/30 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-secondary shrink-0" />
                            <span className="text-xs font-bold text-on-surface">
                              {incident.title || incident.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-primary text-white font-bold whitespace-nowrap rounded">
                            <CheckCircle2 className="w-3 h-3 text-secondary-light" />
                            <span>{incident.verification || 'Verified'}</span>
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span>{incident.locationName || `${incident.location.lat.toFixed(3)}, ${incident.location.lon.toFixed(3)}`}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                          </span>
                          <span>•</span>
                          <span className="font-medium text-primary">
                            {incident.confirmationsCount || 1} Confirmations
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>
        </section>

        {/* 5. ETHIOPIAN LINGUISTIC PARITY & EMERGENCY SECTION */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20" id="emergency-section">
          
          {/* Parity Banner */}
          <div className="bg-surface-low rounded-3xl p-6 sm:p-8 border border-outline-variant/40 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-secondary-dark font-bold text-xs uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">translate</span>
                  <span>National Language Parity</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-primary mb-2">
                  Three Official Languages, One Trusted Highland Journey.
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  GuzoMate does not rely on mechanical word-for-word translation. Every routing step, hazard advisory, and medical recommendation is checked with optical metric harmony for Latin, Ge'ez (Amharic), and Qubee (Afaan Oromo) typography.
                </p>
              </div>

              {/* Language Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 text-center shadow-sm">
                  <div className="text-sm font-bold text-primary">English</div>
                  <div className="text-[11px] text-ash">Full Latin Support</div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 text-center shadow-sm">
                  <div className="text-sm font-bold text-primary">አማርኛ</div>
                  <div className="text-[11px] text-ash">ግዕዝ ፊደላት</div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 text-center shadow-sm">
                  <div className="text-sm font-bold text-primary">Afaan Oromoo</div>
                  <div className="text-[11px] text-ash">Sirna Qubee</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Emergency Hotline Callout Grid */}
          <div className="bg-surface-lowest border-2 border-primary rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-0.5">
                  <PhoneCall className="w-4 h-4 text-red-600" />
                  <span>Emergency Hotlines — Direct Dial</span>
                </div>
                <h3 className="text-lg font-bold text-primary">
                  Instant contact with Ethiopian emergency responders
                </h3>
              </div>
              <span className="text-xs text-primary bg-primary/10 px-3 py-1 font-bold rounded-md self-start sm:self-auto border border-primary/20">
                Available toll-free 24/7 across Ethiopia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="tel:991"
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/40 shadow-sm hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center text-white rounded-xl shadow-sm">
                    <span className="material-symbols-outlined">local_police</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ash font-medium">Federal &amp; Traffic Police</div>
                    <div className="text-base font-extrabold text-primary group-hover:text-primary-dark transition-colors">
                      991
                    </div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-primary" />
              </a>

              <a
                href="tel:907"
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/40 shadow-sm hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-700 flex items-center justify-center text-white rounded-xl shadow-sm">
                    <span className="material-symbols-outlined">emergency</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ash font-medium">Medical Ambulance</div>
                    <div className="text-base font-extrabold text-red-700 transition-colors">
                      907
                    </div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-red-700" />
              </a>

              <a
                href="tel:922"
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-low border border-outline-variant/40 shadow-sm hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-dark flex items-center justify-center text-white rounded-xl shadow-sm">
                    <span className="material-symbols-outlined">health_and_safety</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ash font-medium">Ethiopian Red Cross</div>
                    <div className="text-base font-extrabold text-secondary-dark transition-colors">
                      922
                    </div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-secondary-dark" />
              </a>
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-surface-low border-t border-outline-variant/40 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="text-sm font-bold text-primary flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center text-[11px] font-bold">
                G
              </div>
              <span>GuzoMate</span>
            </div>
            <span className="hidden sm:inline text-outline-variant">|</span>
            <p className="text-xs text-on-surface-variant">
              © 2026 GuzoMate Ethiopia — Verified Highland Travel Intelligence. Latin, አማርኛ &amp; Afaan Oromoo parity.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-on-surface-variant">
            <a href="tel:991" className="hover:text-primary transition-colors">Police 991</a>
            <a href="tel:907" className="hover:text-primary transition-colors">Medical 907</a>
            <a href="tel:922" className="hover:text-primary transition-colors">Red Cross 922</a>
            <a href="#emergency-section" className="hover:text-primary transition-colors">Emergency Dial</a>
            <a href="#road-incidents" className="hover:text-primary transition-colors">Road Verification Guild</a>
          </nav>

        </div>
      </footer>

    </div>
  );
};

export default HomePage;
