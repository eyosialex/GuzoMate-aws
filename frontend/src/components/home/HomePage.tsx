import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import {
  Place,
  Incident,
  WeatherData,
  GeoLocation,
  DEFAULT_ADDIS_COORDINATES,
  Language,
} from '../../types';
import { weatherService } from '../../services/weatherService';
import { incidentsService } from '../../services/incidentsService';
import { placesService } from '../../services/placesService';
import { assistantService } from '../../services/assistantService';
import { AppNavbar } from '../layout/AppNavbar';
import logoImg from '../../assets/logo.png';
import { Globe, ChevronDown, Check } from 'lucide-react';
import '../../styles/home.css';

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
type IconName =
  | 'arrow'
  | 'cloud'
  | 'construction'
  | 'mapPin'
  | 'mic'
  | 'rain'
  | 'road'
  | 'send'
  | 'spark'
  | 'warning'
  | 'sun'
  | 'wind'
  | 'bookmark'
  | 'trash'
  | 'check';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    cloud: (
      <path d="M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.26 8.5 4.75 4.75 0 0 0 7 18Z" />
    ),
    construction: (
      <>
        <path d="m10 6 8 12M14 6 6 18M5 9h14M4 18h16" />
        <circle cx="12" cy="5" r="1.5" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </>
    ),
    rain: (
      <>
        <path d="M7 15h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.26 5.5 4.75 4.75 0 0 0 7 15Z" />
        <path d="m8 18-1 2M13 18l-1 2M18 18l-1 2" />
      </>
    ),
    road: <path d="M8 3 5 21M16 3l3 18M12 4v4M12 11v4M12 18v2" />,
    send: <path d="m3 11 18-8-8 18-2-8-8-2Zm8 2 4-4" />,
    spark: (
      <path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2ZM5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8L5 17Z" />
    ),
    warning: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v5M12 17.5v.1" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </>
    ),
    wind: <path d="M17.7 7.7A2.5 2.5 0 1 1 19 12H2M14.7 17.7A2.5 2.5 0 1 0 17 14H2" />,
    bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

// ─── Main HomePage Component ───────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const {
    setPageView,
    setActiveTab,
    savedPlaceIds,
    toggleSavePlace,
    setSelectedPlace,
    language,
    setLanguage,
    openAuthModal,
    openIncidentModal,
    openProfileModal,
    userLocation,
    setUserLocation,
    addMessage,
  } = useAppStore();

  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [assistantNotice, setAssistantNotice] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);

  // Saved Places state
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Weather state (real backend data)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherAdvice, setWeatherAdvice] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherLocation, setWeatherLocation] = useState<GeoLocation>(() => {
    try {
      const stored = localStorage.getItem('guzo_last_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        const coords = parsed?.coords || parsed;
        if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
          return coords;
        }
      }
    } catch {}
    return DEFAULT_ADDIS_COORDINATES;
  });
  const [locationSource, setLocationSource] = useState<'current' | 'last_known' | 'default'>('default');

  // Incidents state (real backend data)
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);

  // Supported Languages
  const languages: Array<{ code: Language; label: string; full: string }> = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'am', label: 'አማ', full: 'አማርኛ' },
    { code: 'om', label: 'OM', full: 'Afaan Oromoo' },
  ];
  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  // Navigation Links
  const homeNavigation = [
    { label: language === 'am' ? 'መነሻ' : language === 'om' ? 'Man' : 'Home', href: '#home' },
    {
      label: language === 'am' ? 'የተቀመጡ ቦታዎች' : language === 'om' ? "Bakkeewwan Olkaa'aman" : 'Saved Places',
      href: '#saved-places',
    },
    {
      label: language === 'am' ? 'የአየር ሁኔታ' : language === 'om' ? 'Haala Qilleensaa' : 'Weather',
      href: '#weather',
    },
    {
      label: language === 'am' ? 'ክስተቶች' : language === 'om' ? 'Balaawwan' : 'Incidents',
      href: '#incidents',
    },
  ];

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // IntersectionObserver for reveal animations and active nav spy
  useEffect(() => {
    const root = homeRef.current;
    if (!root) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    root.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        })
      },
      { rootMargin: '-15% 0px -55% 0px' }
    );

    root.querySelectorAll('main > section[id]').forEach((element) => sectionObserver.observe(element));

    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  // Focus input when Ask disclosure opens
  useEffect(() => {
    if (askOpen) inputRef.current?.focus({ preventScroll: true });
  }, [askOpen]);

  const openAssistant = () => {
    setAskOpen(true);
    window.location.hash = 'home';
    inputRef.current?.focus({ preventScroll: true });
  };

  // Rewired Ask GuzoMate submit handler
  const handleAskSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery || question).trim();
    if (!q || isAsking) return;

    setIsAsking(true);
    setAssistantReply(null);
    setAssistantNotice('');

    // Add user message to global chat store
    addMessage({
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    try {
      const res = await assistantService.query({
        query: q,
        language,
        location: userLocation || weatherLocation,
      });

      setAssistantReply(res.answer);

      // Add assistant reply to global chat store
      addMessage({
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        places: res.places as any,
        weather: res.weather as any,
        incidents: res.incidents as any,
      });

      setAssistantNotice(
        language === 'am'
          ? 'መረጃው በጄሚናይ AI እና አዲስ ትራንዚት የተደገፈ ነው'
          : language === 'om'
          ? 'Daataan Gemini AI fi Addis Transit tiin deeggarameera'
          : 'Answer grounded via Gemini AI & Addis Spatial RAG'
      );
    } catch {
      setAssistantNotice(
        language === 'am'
          ? 'አሁን ከAI ረዳት ጋር መገናኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
          : language === 'om'
          ? 'Tajaajila AI wajjin wal-qunnamuun hin danda’amne. Maaloo irra deebi’aa yaalaa.'
          : 'Unable to connect to AI assistant service right now. Please try again.'
      );
    } finally {
      setIsAsking(false);
    }
  };

  // ─── Fetch Saved Places ──────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');

    if (token) {
      setLoadingSaved(true);
      placesService
        .getSavedPlaces()
        .then((res) => {
          if (active) {
            if (res.items && res.items.length > 0) {
              const mapped: Place[] = res.items.map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                address: item.address,
                location: { lat: Number(item.latitude), lon: Number(item.longitude) },
                distanceMeters: null,
                tags: {},
                source: 'openstreetmap',
                osm: { type: 'node', id: item.id },
                isSaved: true,
              }));
              setSavedPlaces(mapped);
            } else {
              setSavedPlaces([]);
            }
            setLoadingSaved(false);
          }
        })
        .catch(() => {
          if (active) setLoadingSaved(false);
        });
      return () => {
        active = false;
      };
    }

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

  // ─── Weather Fallback Hierarchy & Hourly Auto-Refresh ───────────────────────
  // 1. Current user location (if permission granted). Auto-refreshes every 1 hour (3,600,000ms).
  // 2. User's last known location (from localStorage).
  // 3. Addis Ababa default coordinates (if neither current nor last known location available).
  useEffect(() => {
    let active = true;
    let hourlyIntervalId: ReturnType<typeof setInterval> | null = null;

    const fetchWeather = async (coords: GeoLocation, source: 'current' | 'last_known' | 'default') => {
      if (!active) return;
      setWeatherLoading(true);
      setWeatherLocation(coords);
      setLocationSource(source);

      try {
        const [data, advice] = await Promise.allSettled([
          weatherService.getFullWeather(coords.lat, coords.lon, undefined, language),
          weatherService.getArrivalAdvice(coords.lat, coords.lon, '4:30 PM'),
        ]);

        if (active) {
          if (data.status === 'fulfilled' && data.value) {
            setWeatherData(data.value);
          } else {
            setWeatherData(null);
          }

          if (advice.status === 'fulfilled' && advice.value) {
            const suggestion =
              advice.value.suggestions?.[0]?.text;
            setWeatherAdvice(suggestion);
          }
          setWeatherLoading(false);
        }
      } catch {
        if (active) {
          setWeatherData(null);
          setWeatherLoading(false);
        }
      }
    };

    const handleFallback = () => {
      // 2. Try user's last known location
      try {
        const stored = localStorage.getItem('guzo_last_location');
        if (stored) {
          const parsed = JSON.parse(stored);
          const coords = parsed?.coords || parsed;
          if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
            fetchWeather(coords, 'last_known');
            return;
          }
        }
      } catch (err) {
        console.warn('Could not read last known location from localStorage:', err);
      }

      // 3. Fallback to Addis Ababa default coordinates
      fetchWeather(DEFAULT_ADDIS_COORDINATES, 'default');
    };

    // 1. Check for location permission / get current location
    if (
      typeof navigator !== 'undefined' &&
      navigator.geolocation &&
      typeof navigator.geolocation.getCurrentPosition === 'function'
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return;
          const currentCoords: GeoLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          try {
            localStorage.setItem(
              'guzo_last_location',
              JSON.stringify({ coords: currentCoords, timestamp: Date.now() })
            );
          } catch {}

          setUserLocation(currentCoords);
          fetchWeather(currentCoords, 'current');

          const ONE_HOUR_MS = 60 * 60 * 1000;
          hourlyIntervalId = setInterval(() => {
            if (!active) return;
            if (navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
              navigator.geolocation.getCurrentPosition(
                (latestPos) => {
                  const updatedCoords: GeoLocation = {
                    lat: latestPos.coords.latitude,
                    lon: latestPos.coords.longitude,
                  };
                  try {
                    localStorage.setItem(
                      'guzo_last_location',
                      JSON.stringify({ coords: updatedCoords, timestamp: Date.now() })
                    );
                  } catch {}
                  setUserLocation(updatedCoords);
                  fetchWeather(updatedCoords, 'current');
                },
                () => {
                  fetchWeather(currentCoords, 'current');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            } else {
              fetchWeather(currentCoords, 'current');
            }
          }, ONE_HOUR_MS);
        },
        (err) => {
          if (!active) return;
          console.warn('Geolocation permission not given or unavailable:', err);
          handleFallback();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      handleFallback();
    }

    return () => {
      active = false;
      if (hourlyIntervalId) {
        clearInterval(hourlyIntervalId);
      }
    };
  }, [language, setUserLocation]);

  // ─── Fetch Real Nearby Incidents for the Active Location ────────────────────
  useEffect(() => {
    let active = true;
    incidentsService
      .getNearby({
        lat: weatherLocation.lat,
        lon: weatherLocation.lon,
        radiusMeters: 25000,
        limit: 5,
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
  }, [weatherLocation.lat, weatherLocation.lon]);

  // Helper to format incident time ago
  const formatTimeAgo = (dateStr?: string | number) => {
    if (!dateStr) return 'Recently';
    const mins = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
    if (language === 'am') {
      return mins < 60 ? `ከ${mins} ደቂቃ በፊት` : `ከ${Math.floor(mins / 60)} ሰዓት በፊት`;
    }
    if (language === 'om') {
      return mins < 60 ? `Daqiiqaa ${mins} dura` : `Sa'aatii ${Math.floor(mins / 60)} dura`;
    }
    return mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} hr ago`;
  };

  return (
    <div className="home-page" ref={homeRef} lang={language}>
      <a className="skip-link" href="#home">
        Skip to content
      </a>

      {/* ─── Shared App Navbar ─────────────────────────────────────────────────── */}
      <AppNavbar activePage="home" />

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <main>
        {/* ─── Hero Section ────────────────────────────────────────────────────── */}
        <section className="home-hero" id="home" aria-labelledby="home-title">
          <p className="eyebrow hero-enter">
            <span className="status-dot" />{' '}
            {language === 'am'
              ? 'ለንቁ ተጓዦች የተዘጋጀ የጉዞ መረጃ'
              : language === 'om'
              ? 'Odeeffannoo imalaa qophaa’e'
              : 'A little intelligence for the road ahead'}
          </p>
          <h1 className="hero-enter" id="home-title">
            {language === 'am' ? (
              <>
                አዳዲስ ቦታዎችን ይጎብኙ።
                <br />
                <em>በእርግጠኝነት እና በእርጋታ ይጓዙ።</em>
              </>
            ) : language === 'om' ? (
              <>
                Bakkeewwan haaraa daawwadhaa.
                <br />
                <em>Nageenyaan imalaa.</em>
              </>
            ) : (
              <>
                Go somewhere new.
                <br />
                <em>Feel a little more at home.</em>
              </>
            )}
          </h1>
          <p className="hero-description hero-enter">
            {language === 'am'
              ? 'የአካባቢ ዕውቀት። አስቀድሞ የሚያስብ የአየር ሁኔታ። በመንገዱ ላይ ካሉ ተጓዦች የሚገኝ ፈጣን ጥቆማ። የሚረዳዎት የጉዞ ጓደኛ።'
              : language === 'om'
              ? 'Beekumsa naannoo. Haala qilleensa fuuldura yaadu. Gargaarsa imaltoota daandii irraa. Hiriyaa imala keessanii.'
              : 'Local knowledge. Weather that thinks ahead. A little help from the people on the road. Your journey, with a companion that understands you.'}
          </p>

          <button
            className="ask-button hero-enter"
            onClick={() => setAskOpen((value) => !value)}
            aria-expanded={askOpen}
            aria-controls="home-assistant"
          >
            <Icon name="spark" size={19} />
            {language === 'am' ? 'ጉዞሜትን ይጠይቁ' : language === 'om' ? 'GuzoMate Gaafadhaa' : 'Ask GuzoMate'}
            <span className={`ask-chevron ${askOpen ? 'open' : ''}`}>
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>

          {/* Ask GuzoMate Disclosure Form (Rewired with real AI Assistant service) */}
          <div
            className={`ask-disclosure ${askOpen ? 'open' : ''}`}
            id="home-assistant"
            aria-hidden={!askOpen}
          >
            <div className="ask-disclosure-inner">
              <form className="ask-form" onSubmit={(e) => handleAskSubmit(e)}>
                <label htmlFor="travel-question">
                  {language === 'am'
                    ? 'ምን ማወቅ ይፈልጋሉ?'
                    : language === 'om'
                    ? 'Maal beekuu barbaaddu?'
                    : 'What’s on your mind?'}
                </label>
                <div className="ask-input-row">
                  <input
                    ref={inputRef}
                    id="travel-question"
                    type="text"
                    placeholder={
                      language === 'am'
                        ? 'ለምሳሌ፦ ወደ ቦሌ ስሄድ ምን ማወቅ አለብኝ? ወይም ዝናብ ይኖራል?'
                        : language === 'om'
                        ? "fkf., Finfinnee daawwachuu koo dura maal beekuun qaba?"
                        : 'What should I know before visiting Addis Ababa or Bole?'
                    }
                    value={question}
                    onChange={(event) => {
                      setQuestion(event.target.value);
                      setAssistantNotice('');
                    }}
                    maxLength={1000}
                    disabled={isAsking}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setAskOpen(false);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    aria-label="Send your travel question"
                    disabled={!question.trim() || isAsking}
                  >
                    {isAsking ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon name="arrow" size={20} />
                    )}
                  </button>
                </div>

                <div className="question-suggestions">
                  {[
                    language === 'am' ? 'የትኞቹን ቦታዎች መጎብኘት ይሻላል?' : language === 'om' ? "Bakkeewwan kamtu daawwatamuu qaba?" : "What's worth visiting?",
                    language === 'am' ? 'ምን ይዤ መጓዝ አለብኝ?' : language === 'om' ? 'Maal qabadhee deemuun qaba?' : 'What should I pack?',
                    language === 'am' ? 'መስቀል አደባባይ አቅራቢያ ያሉ ካፌዎች' : language === 'om' ? 'Kaaffee Masqala dhiyoo' : 'Cafes near Meskel Square',
                  ].map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => {
                        setQuestion(suggestion);
                        handleAskSubmit(undefined, suggestion);
                      }}
                    >
                      {suggestion} <span>↗</span>
                    </button>
                  ))}
                </div>

                {assistantReply && (
                  <div className="assistant-response-box">
                    <p className="font-semibold text-ink text-xs mb-1">
                      {language === 'am' ? 'የጉዞሜት AI ምላሽ፦' : language === 'om' ? 'Deebii GuzoMate AI:' : 'GuzoMate AI:'}
                    </p>
                    <p className="text-stone-700 text-xs leading-relaxed whitespace-pre-line">
                      {assistantReply}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('assistant');
                        setPageView('app');
                      }}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      {language === 'am' ? 'ሙሉውን ውይይት በረዳት ገጽ ክፈት →' : language === 'om' ? 'Marii guutuu bani →' : 'Open full conversation in Assistant →'}
                    </button>
                  </div>
                )}

                <p className="assistant-notice" role="status">
                  {assistantNotice ||
                    (language === 'am'
                      ? 'እንግሊዝኛ · አማርኛ · አፋን ኦሮሞ / የቀጥታ AI የጉዞ ረዳት'
                      : language === 'om'
                      ? 'Afaan Ingilizii · Afaan Amaaraa · Afaan Oromoo / AI Imalaa'
                      : 'English · Amharic · Afaan Oromoo / Grounded Gemini AI')}
                </p>
              </form>
            </div>
          </div>

          <div className="hero-footnote hero-enter">
            <span>{language === 'am' ? 'ለጉዞዎ የተዘጋጀ' : language === 'om' ? 'Imala keessaniif kan tolfame' : 'Built around your journey'}</span>
            <i />
            <span>{language === 'am' ? 'በእውነተኛ መረጃ የተደገፈ' : language === 'om' ? 'Daataa qabatamaan kan deeggarame' : 'Grounded in local context'}</span>
          </div>
          <a className="hero-scroll-link" href="#saved-places">
            <span>↓</span> {language === 'am' ? 'የተቀመጡ ቦታዎችን ይመልከቱ' : language === 'om' ? 'Bakkeewwan olkaa’aman ilaalaa' : 'Explore your journey'}
          </a>
        </section>

        {/* ─── Change 1: Saved Places Section ───────────────────────────────────── */}
        <section
          className="home-explore home-saved-places home-section"
          id="saved-places"
          aria-labelledby="saved-places-title"
        >
          <div className="section-topline" data-reveal>
            <p className="eyebrow">
              {language === 'am' ? '01 / የተቀመጡ ቦታዎች' : language === 'om' ? "01 / Bakkeewwan Olkaa'aman" : '01 / Saved places'}
            </p>
            <span>
              {language === 'am'
                ? 'የተመረጡ መዳረሻዎች እና የመንገድ ማረፊያዎች'
                : language === 'om'
                ? "Bakkeewwan filataman fi boqonnaa karaa"
                : 'Your curated destinations & route stops'}
            </span>
          </div>

          <div className="saved-places-header" data-reveal>
            <div className="saved-places-titles">
              <h2 id="saved-places-title">
                {language === 'am' ? (
                  <>
                    የተቀመጡ{' '}
                    <em>ቦታዎች።</em>
                  </>
                ) : language === 'om' ? (
                  <>
                    Bakkeewwan{' '}
                    <em>olkaa’aman.</em>
                  </>
                ) : (
                  <>
                    Saved{' '}
                    <em>places.</em>
                  </>
                )}
              </h2>
              <p className="saved-places-desc">
                {language === 'am'
                  ? 'በጉዞዎ ወቅት ለመጎብኘት ያስቀመጧቸው ሆቴሎች፣ ካፌዎች፣ ሆስፒታሎች እና የመንገድ ማቆሚያዎች ዝርዝር።'
                  : language === 'om'
                  ? 'Hootelota, kaaffeewwan, hospitaalotaa fi bakkeewwan boqonnaa imala keessaniif olkaa’attan.'
                  : 'Your personal collection of cafes, dining, hospitals and scenic stops bookmarked for seamless navigation.'}
              </p>
            </div>

            <div className="saved-places-header-meta">
              <div className="saved-places-pill">
                <Icon name="bookmark" size={15} />
                <span>
                  {savedPlaces.length}{' '}
                  {language === 'am'
                    ? 'የተቀመጡ ቦታዎች'
                    : language === 'om'
                    ? 'Bakkeewwan olkaa’aman'
                    : savedPlaces.length === 1
                    ? 'place bookmarked'
                    : 'places bookmarked'}
                </span>
              </div>
              {savedPlaces.length > 0 && (
                <a
                  className="text-link"
                  href="#route"
                  onClick={(e) => {
                    e.preventDefault();
                    setPageView('explore');
                  }}
                >
                  {language === 'am' ? 'ሁሉንም በካርታው ላይ ይመልከቱ' : language === 'om' ? 'Kaartaa guutuu ilaali' : 'Explore all on interactive map'}{' '}
                  <Icon name="arrow" size={16} />
                </a>
              )}
            </div>
          </div>

          <div className="saved-places-main" data-reveal>
            {loadingSaved ? (
              <div className="py-12 text-center text-xs text-muted">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading saved places...</span>
              </div>
            ) : savedPlaces.length > 0 ? (
              <div className="saved-places-content">
                <div className="saved-places-list saved-places-grid">
                  {savedPlaces.slice(0, 6).map((place) => (
                    <article className="saved-place-item" key={place.id}>
                      <div className="saved-place-meta">
                        <span className="saved-place-icon">
                          <Icon name="mapPin" size={18} />
                        </span>
                        <div className="saved-place-info">
                          <h4>{place.name}</h4>
                          <p>
                            {place.category && (
                              <span className="saved-place-category">{place.category}</span>
                            )}
                            {place.address || 'Addis Ababa'}
                          </p>
                        </div>
                      </div>
                      <div className="saved-place-actions">
                        <button
                          type="button"
                          className="saved-place-btn cursor-pointer"
                          onClick={() => {
                            setSelectedPlace(place);
                            setPageView('explore');
                          }}
                        >
                          {language === 'am' ? 'በካርታ ላይ እይ' : language === 'om' ? 'Kaartaa' : 'View'}
                          <Icon name="arrow" size={13} />
                        </button>
                        <button
                          type="button"
                          className="saved-place-delete cursor-pointer"
                          title="Remove from saved"
                          onClick={() => toggleSavePlace(place.id)}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {savedPlaces.length > 6 && (
                  <p className="text-xs text-muted mt-3">
                    + {savedPlaces.length - 6} more places saved in your profile.
                  </p>
                )}
              </div>
            ) : (
              <div className="saved-empty-state">
                <div className="saved-empty-icon">
                  <Icon name="bookmark" size={24} />
                </div>
                <h4>{language === 'am' ? 'ምንም የተቀመጠ ቦታ የለም' : language === 'om' ? 'Bakki olkaa’ame hin jiru' : 'No saved places yet'}</h4>
                <p>
                  {language === 'am'
                    ? 'በአዲስ አበባ ውስጥ ያሉ ካፌዎችን፣ ሆቴሎችን እና መዳረሻዎችን በካርታው ላይ ፈልገው ያስቀምጡ።'
                    : language === 'om'
                    ? 'Bakkeewwan Finfinnee keessaa kaartaa irratti barbaadanii olkaa’aa.'
                    : 'Explore mapped cafes, cultural sites and route waypoints, then tap save to keep them handy.'}
                </p>
                <button
                  type="button"
                  className="saved-place-btn font-semibold text-blue-600 border-blue-600/30 cursor-pointer"
                  onClick={() => setPageView('explore')}
                >
                  <Icon name="mapPin" size={15} />
                  {language === 'am' ? 'ካርታውን ያስሱ' : language === 'om' ? 'Kaartaa Daawwadhaa' : 'Explore Map to Save'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ─── Change 2: Live Real Weather Section ──────────────────────────────── */}
        <section
          className="home-essentials home-section"
          id="weather"
          aria-labelledby="essentials-title"
        >
          <div className="essentials-heading" data-reveal>
            <div>
              <p className="eyebrow">
                {language === 'am' ? '02 / የእውነተኛ ጊዜ የአየር ሁኔታ' : language === 'om' ? '02 / Qilleensa Yeroo Ammaa' : '02 / Real-time atmosphere'}
              </p>
              <h2 id="essentials-title">
                {language === 'am' ? (
                  <>
                    ያለ ስጋት።
                    <br />
                    <em>በእርግጠኝነት ይጓዙ።</em>
                  </>
                ) : language === 'om' ? (
                  <>
                    Shakkii malee.
                    <br />
                    <em>Nageenyaan deemaa.</em>
                  </>
                ) : (
                  <>
                    Less guesswork.
                    <br />
                    <em>More going.</em>
                  </>
                )}
              </h2>
            </div>
            <p>
              {language === 'am'
                ? 'በአካባቢዎ ያለ እውነተኛ የአየር ሁኔታ መረጃ፣ የሙቀት መጠን እና በAI የተደገፈ የጉዞ ዝግጅት ምክር።'
                : language === 'om'
                ? 'Haala qilleensa yeroo ammaa bakka jirtanii, ho’ina qilleensaa fi gorsa AI.'
                : 'Live atmospheric readings, arrival forecasts, and contextual AI recommendations for your coordinates.'}
            </p>
          </div>

          {/* Real Weather Layout Grid */}
          <div className="weather-layout-grid" data-reveal>
            {/* Primary Live Weather Hero Card */}
            <div className="weather-hero-card">
              <div className="weather-card-header">
                <div>
                  <span className="weather-location-badge">
                    <Icon name="mapPin" size={12} />
                    {locationSource === 'current'
                      ? 'Live GPS Location'
                      : locationSource === 'last_known'
                      ? 'Recent Known Location'
                      : 'Addis Ababa (Default)'}
                  </span>
                  <h3>
                    {locationSource === 'current'
                      ? 'Your Current Location'
                      : 'Addis Ababa, Ethiopia'}
                    {weatherLoading && (
                      <span
                        className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse align-middle"
                        title="Updating live weather..."
                      />
                    )}
                  </h3>
                  <p className="weather-desc">
                    {weatherData?.current?.condition || 'Mild highland conditions'}
                  </p>
                </div>
                <span className="text-blue-700">
                  <Icon
                    name={
                      (weatherData?.current?.precipitationMm || 0) > 0
                        ? 'rain'
                        : 'cloud'
                    }
                    size={38}
                  />
                </span>
              </div>

              <div className="weather-main-temp">
                <strong>
                  {weatherData?.current?.temperatureC != null
                    ? `${Math.round(weatherData.current.temperatureC)}°C`
                    : '18°C'}
                </strong>
                <span>
                  {weatherData?.current?.condition ||
                    ((weatherData?.current?.precipitationMm || 0) > 0
                      ? 'Rain likely'
                      : 'Fair sky')}
                </span>
              </div>

              <div className="weather-metrics-row">
                <div className="weather-metric-item">
                  <small>{language === 'am' ? 'የሚሰማው' : 'Feels like'}</small>
                  <strong>
                    {weatherData?.current?.temperatureC != null
                      ? `${Math.round(weatherData.current.temperatureC)}°C`
                      : '19°C'}
                  </strong>
                </div>
                <div className="weather-metric-item">
                  <small>{language === 'am' ? 'ዝናብ (ሚሜ)' : 'Precipitation'}</small>
                  <strong>
                    {weatherData?.current?.precipitationMm != null
                      ? `${weatherData.current.precipitationMm} mm`
                      : '0.0 mm'}
                  </strong>
                </div>
                <div className="weather-metric-item">
                  <small>{language === 'am' ? 'ንፋስ' : 'Wind'}</small>
                  <strong>
                    {weatherData?.current?.windKph != null
                      ? `${Math.round(weatherData.current.windKph)} km/h`
                      : '12 km/h'}
                  </strong>
                </div>
                <div className="weather-metric-item">
                  <small>{language === 'am' ? 'እርጥበት' : 'Humidity'}</small>
                  <strong>
                    {weatherData?.current?.humidity != null
                      ? `${Math.round(weatherData.current.humidity)}%`
                      : '58%'}
                  </strong>
                </div>
              </div>
            </div>

            {/* AI Recommendation & Preparation Column */}
            <div className="flex flex-col gap-4">
              <div className="weather-advice-banner">
                <Icon name="spark" size={20} />
                <div>
                  <strong>
                    {language === 'am'
                      ? 'ጉዞሜት AI ይመክራል፦'
                      : language === 'om'
                      ? 'GuzoMate AI Ni Gorsa:'
                      : 'GuzoMate AI recommends'}
                  </strong>
                  <p>{weatherAdvice || 'Pleasant afternoon expected. Light clothing and sunglasses recommended.'}</p>
                </div>
              </div>

              {/* Upcoming Atmospheric Hours */}
              <div className="p-5 rounded-2xl bg-ivory border border-line flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[20px] uppercase text-muted tracking-wide">
                    {language === 'am' ? 'የሚቀጥሉት ሰዓታት' : 'Upcoming Hours'}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="hourly-weather-scroll">
                  {(weatherData?.forecast?.[0]?.hourly && weatherData.forecast[0].hourly.length > 0
                    ? weatherData.forecast[0].hourly.slice(0, 4)
                    : [
                        { time: '12:00', temperatureC: 19, precipitationProbability: 20 },
                        { time: '14:00', temperatureC: 20, precipitationProbability: 35 },
                        { time: '16:00', temperatureC: 17, precipitationProbability: 70 },
                        { time: '18:00', temperatureC: 15, precipitationProbability: 65 },
                      ]
                  ).map((h, i: number) => (
                    <div className="hourly-card" key={i}>
                      <span className="hour">
                        {h.time
                          ? typeof h.time === 'string' && h.time.includes('T')
                            ? new Date(h.time).toLocaleTimeString([], { hour: 'numeric' })
                            : h.time
                          : `+${i + 1}h`}
                      </span>
                      <Icon
                        name={
                          (h.precipitationProbability || 0) > 40
                            ? 'rain'
                            : 'cloud'
                        }
                        size={18}
                      />
                      <span className="temp">
                        {h.temperatureC != null ? `${Math.round(h.temperatureC)}°` : '18°'}
                      </span>
                      <span className="rain">
                        {h.precipitationProbability != null
                          ? `${Math.round(h.precipitationProbability)}%`
                          : '20%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Change 3: Real Incidents Section ─────────────────────────────────── */}
        <section
          className="home-incidents home-section"
          id="incidents"
          aria-labelledby="incidents-title"
        >
          <div className="incidents-copy" data-reveal>
            <p className="eyebrow">
              {language === 'am'
                ? '03 / ከመንገደኞች የተገኘ መረጃ'
                : language === 'om'
                ? '03 / Imaltoota Daandii Irraa'
                : '03 / From people on the road'}
            </p>
            <h2 id="incidents-title">
              {language === 'am' ? (
                <>
                  ቅድመ ጥቆማ።
                  <br />
                  <em>አነስተኛ መዘግየት።</em>
                </>
              ) : language === 'om' ? (
                <>
                  Hubannoo dursaa.
                  <br />
                  <em>Rakkina malee.</em>
                </>
              ) : (
                <>
                  A little heads-up.
                  <br />
                  <em>A lot less uncertainty.</em>
                </>
              )}
            </h2>
            <p>
              {language === 'am'
                ? 'ጉዞ ባልተጠበቁ ክስተቶች የተሞላ ነው። ሌሎች መንገደኞች ሪፖርት ያደረጉትን የመንገድ ሁኔታዎች አስቀድመው ይወቁ።'
                : language === 'om'
                ? 'Imalli wantoota hin eegamne qabaachuu danda’a. Gabaasaaleen hawaasaa akka of eeggattan isin gargaaru.'
                : 'Real journeys have unexpected moments. Community reports help you understand what others have encountered, before you head out.'}
            </p>

            <span className="report-disclaimer">
              <Icon name="warning" size={15} />{' '}
              {language === 'am'
                ? 'በተጠቃሚዎች ሪፖርት የተደረገ። በማህበረሰብ የተረጋገጠ።'
                : 'User-reported.'}
            </span>

            <button
              type="button"
              className="report-now-btn cursor-pointer"
              onClick={() => openIncidentModal()}
            >
              <Icon name="warning" size={15} />
              <span>
                {language === 'am'
                  ? 'የመንገድ ክስተት ሪፖርት ያድርጉ'
                  : language === 'om'
                  ? 'Balaa Daandii Gabaasaa'
                  : 'Report an incident'}
              </span>
            </button>
          </div>

          {/* Real Incidents List Column */}
          <div className="home-report-list" data-reveal>
            <div className="report-list-heading">
              <span>{language === 'am' ? 'በመንገድ ላይ ያሉ ሁኔታዎች' : 'On the road'}</span>
              <span>
                {locationSource === 'current'
                  ? 'Nearby reports (25 km radius)'
                  : 'Addis Ababa reports'}
              </span>
            </div>

            {incidentsLoading ? (
              <div className="py-12 text-center text-xs text-muted">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Checking nearby road conditions...</span>
              </div>
            ) : incidents.length > 0 ? (
              <div>
                {incidents.slice(0, 4).map((report, index) => {
                  const typeUpper = (report.type || '').toUpperCase();
                  const isConstruction = typeUpper.includes('CONSTRUCTION');
                  const isWeather =
                    typeUpper.includes('RAIN') ||
                    typeUpper.includes('FLOOD') ||
                    typeUpper.includes('WATER');

                  return (
                    <article className="home-report" key={report.id || index}>
                      <span
                        className={`report-icon ${
                          isConstruction ? 'construction' : isWeather ? 'weather' : ''
                        }`}
                      >
                        <Icon
                          name={
                            isConstruction
                              ? 'construction'
                              : isWeather
                              ? 'rain'
                              : 'warning'
                          }
                          size={19}
                        />
                      </span>
                      <div>
                        <h3>
                          {report.type ? report.type.replace(/_/g, ' ') : 'Road report'}
                          {report.locationName && <span> · {report.locationName}</span>}
                        </h3>
                        <p>{report.description || 'Incident reported by fellow traveler.'}</p>
                        <small>
                          Community report · {formatTimeAgo((report as any).occurredAt || report.createdAt)}
                        </small>
                      </div>
                      <span
                        className={`report-status ${
                          report.status === 'ACTIVE' ||
                          report.verification === 'COMMUNITY_CONFIRMED' ||
                          report.verification === 'OFFICIALLY_VERIFIED'
                            ? 'verified'
                            : ''
                        }`}
                      >
                        {report.status === 'ACTIVE' ? 'Active' : 'Reported'}
                      </span>
                    </article>
                  );
                })}
                <p className="report-list-footnote">
                  {language === 'am'
                    ? 'ውሳኔዎችዎን ለማገዝ የሚቀርብ መረጃ። ደህንነቱ የተጠበቀ ጉዞ ይሁንልዎ!'
                    : 'Awareness to inform your decisions. Not automatic rerouting.'}
                </p>
              </div>
            ) : (
              /* Happily tell the user that there is no incident! */
              <div className="clear-roads-card my-4">
                <span className="clear-roads-badge">
                  <Icon name="check" size={14} />
                  <span>{language === 'am' ? 'መንገዱ ክፍት ነው ☀️' : 'All Clear on the Road! ☀️'}</span>
                </span>
                <h4>
                  {language === 'am'
                    ? 'ምንም የተዘገበ የመንገድ ክስተት የለም'
                    : language === 'om'
                    ? 'Balaan gabaafame hin jiru'
                    : 'No incidents or road hazards reported'}
                </h4>
                <p>
                  {language === 'am'
                    ? 'በጣም ጥሩ ዜና! በአካባቢዎ ምንም ዓይነት የመንገድ መዘጋት ወይም አደጋ አልተመዘገበም። መልካም እና ሰላማዊ ጉዞ ይሁንልዎ!'
                    : language === 'om'
                    ? 'Oduu gammachiisaa! Naannoo keessanitti balaan daandii hin jiru. Imala gaarii qabaadhaa!'
                    : 'Great news! Fellow travelers report clear roads and smooth sailing across your route. Have a wonderful and safe journey!'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Closing Call To Action ─────────────────────────────────────────── */}
        <section className="home-closing" aria-labelledby="home-closing-title" data-reveal>
          <p className="eyebrow">
            {language === 'am' ? 'ወደ የትኛውም ቦታ ሲጓዙ' : 'Wherever you’re headed'}
          </p>
          <h2 id="home-closing-title">
            {language === 'am' ? (
              <>
                ከመድረስ ባለፈ <em>ጉዞዎን ያቅዱ።</em>
              </>
            ) : (
              <>
                Go beyond <em>getting there.</em>
              </>
            )}
          </h2>
          <p>
            {language === 'am'
              ? 'ጥያቄ፣ መዳረሻ ወይም አዲስ ቦታ የመጎብኘት ፍላጎት። ለመጀመር ምርጥ አጋጣሚ ነው።'
              : 'A question, a destination, a little curiosity. That’s a good place to start.'}
          </p>
          <button className="ask-button cursor-pointer" onClick={openAssistant}>
            <Icon name="spark" size={18} />{' '}
            {language === 'am' ? 'ስለ ጉዞዎ እንነጋገር' : 'Let’s talk about your journey'}{' '}
            <Icon name="arrow" size={18} />
          </button>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div>
          <a className="brand" href="#home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="brand-mark">
              <img src={logoImg} alt="GuzoMate Logo" />
            </span>
            GuzoMate.
          </a>
          <p>
            {language === 'am'
              ? 'የተሟላ ዕውቀት። የተሻለ ጉዞ።'
              : language === 'om'
              ? 'Beekumsa guutuu. Imala wayyaa.'
              : 'A little knowledge. A better journey.'}
          </p>
        </div>
        <nav aria-label="Footer navigation">
          {homeNavigation.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => setPageView('explore')}
            className="text-xs text-muted hover:text-blue-600 transition-colors text-left"
          >
            {language === 'am' ? 'ካርታ' : 'Map'}
          </button>
        </nav>
        <div className="home-footer-bottom">
          <span>
            {language === 'am'
              ? 'ለመድረሻው ብቻ ሳይሆን፣ ለሙሉ ጉዞው የተዘጋጀ።'
              : 'Made for the journey, not just the destination.'}
          </span>
          <span>© {new Date().getFullYear()} GuzoMate</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
