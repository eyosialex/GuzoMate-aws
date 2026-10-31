import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { Language, Incident } from '../../types';
import { incidentsService } from '../../services/incidentsService';
import { weatherService } from '../../services/weatherService';
import logoImg from '../../assets/logo.png';
import { Globe, ChevronDown, Check } from 'lucide-react';
import '../../styles/landing.css';

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
  | 'warning';

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

// ─── Four-Chapter Narrative Scenes ─────────────────────────────────────────────
const scenes = [
  {
    kicker: 'The map unfolds',
    title: 'Your journey starts with a map.',
    body: 'Open a little possibility. Discover the places, people and conditions that make every journey different.',
  },
  {
    kicker: 'A welcome in every language',
    title: 'Travel speaks every language.',
    body: 'A travel companion that understands you. Speak or type naturally in English, Amharic or Afaan Oromoo.',
  },
  {
    kicker: 'The road has a story',
    title: 'Know what lies ahead.',
    body: 'Accidents, closures, construction and hazards. See what fellow travelers have reported, right where it happened.',
  },
  {
    kicker: 'Weather that follows you',
    title: 'Arrive prepared, not surprised.',
    body: 'Not just the weather here and now. The conditions at your destination, when you expect to arrive.',
  },
];

// ─── SVG Map Artwork ───────────────────────────────────────────────────────────
function MapArtwork() {
  return (
    <svg
      className="map-art"
      viewBox="0 0 900 780"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="terrain">
        <path d="M-40 112C130 34 214 172 366 104s226-85 394-8 230 13 260-30" />
        <path d="M-44 612c156-86 258-43 370 23s245 74 346-10 218-67 286 7" />
        <path d="M74-50c36 145 5 232-33 348s-8 234 100 349 61 206 18 246" />
        <path d="M798-50c-94 133-59 243 4 321s84 177 17 273-104 199-5 303" />
      </g>
      <g className="minor-roads">
        <path d="M12 342c125-58 232-24 310 23s157 35 245-11 202-31 343 42" />
        <path d="M173 0c8 108 52 182 126 245s66 167 7 258-52 188 4 277" />
        <path d="M570-20c-11 104-62 174-104 252s-27 148 66 230 126 181 93 318" />
        <path d="M42 702c156-23 258-111 339-191s211-107 316-54 168 79 242 54" />
        <path d="M52 187c109 38 166 18 242-27s177-32 271 18 179 49 307-4" />
      </g>
      <g className="blocks">
        <path d="m95 235 73-30 43 52-66 39Z" />
        <path d="m240 112 91-22 25 61-76 28Z" />
        <path d="m613 123 103 14-18 72-94-20Z" />
        <path d="m675 523 112-14 12 83-99 17Z" />
        <path d="m155 548 76-38 48 71-84 34Z" />
        <path d="m384 605 95-21 23 87-104 18Z" />
      </g>
      <path
        className="journey-halo"
        d="M112 635C250 581 228 444 351 419S497 288 624 263s128-103 190-145"
      />
      <path
        className="journey-road"
        d="M112 635C250 581 228 444 351 419S497 288 624 263s128-103 190-145"
      />
      <path
        className="journey-progress"
        d="M112 635C250 581 228 444 351 419S497 288 624 263s128-103 190-145"
      />
    </svg>
  );
}

// ─── Interfaces for live context ───────────────────────────────────────────────
interface IncidentSnapshot {
  label: string;
  timeAgo: string;
  isLive: boolean;
}

interface WeatherSnapshot {
  temperature: string;
  rainChance: string;
  advice: string;
  isLive: boolean;
}

// ─── MapCanvas ─────────────────────────────────────────────────────────────────
function MapCanvas({
  scene,
  incident,
}: {
  scene: number;
  incident: IncidentSnapshot;
}) {
  return (
    <div
      className="map-canvas"
      data-scene={scene}
      role="img"
      aria-label="An illustrative paper map of Bishoftu and Addis Ababa, with multilingual greetings, a community road incident and arrival-time rainfall"
    >
      <div className="paper-panels" aria-hidden="true">
        <div className="paper-panel panel-2">
          <div className="map-wash" />
          <MapArtwork />
        </div>
        <div className="paper-wing wing-left">
          <div className="paper-panel panel-1">
            <div className="map-wash" />
            <MapArtwork />
          </div>
          <div className="paper-wing wing-outer">
            <div className="paper-panel panel-0">
              <div className="map-wash" />
              <MapArtwork />
            </div>
          </div>
        </div>
        <div className="paper-wing wing-right">
          <div className="paper-panel panel-3">
            <div className="map-wash" />
            <MapArtwork />
          </div>
        </div>
      </div>
      <div className="map-annotations">
        <div className="map-label origin-label">Bishoftu</div>
        <div className="origin-dot" />
        <div className="map-label destination-label">Addis Ababa</div>
        <div className="destination-pin">
          <Icon name="mapPin" size={22} />
        </div>
        <div className="arrival-tag">
          <span>Estimated arrival</span>
          <strong>4:30 PM</strong>
        </div>
        <div className="map-greetings">
          <div className="greeting greeting-en">
            <small>English</small>
            <strong lang="en">Welcome</strong>
          </div>
          <div className="greeting greeting-am">
            <small>Amharic</small>
            <strong lang="am">እንኳን ደህና መጡ</strong>
          </div>
          <div className="greeting greeting-om">
            <small>Afaan Oromoo</small>
            <strong lang="om">Baga nagaan dhuftan</strong>
          </div>
        </div>

        <div className="weather-overlay" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, index) => (
            <i
              key={index}
              style={
                {
                  '--drop': index,
                  '--x': `${8 + ((index * 37) % 85)}%`,
                  '--y': `${(index * 23) % 87}%`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="wet-paper" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <i
              key={index}
              style={
                {
                  left: `${10 + ((index * 29) % 80)}%`,
                  top: `${12 + ((index * 37) % 75)}%`,
                  '--bead': index % 4,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="incident-marker marker-one">
          <div className="incident-base" />
          <div className="incident-sign">
            <Icon name="warning" size={42} />
          </div>
          <div className="marker-detail">
            <small>
              {incident.isLive ? 'Live report' : 'Community report'} · {incident.timeAgo}
            </small>
            <strong>Road incident reported</strong>
            <span>{incident.label}</span>
            <em>{incident.isLive ? 'Verified community' : 'Unverified report'}</em>
          </div>
        </div>
        <span className="demo-label">
          {incident.isLive ? 'GuzoMate Live Spatial · Addis Ababa' : 'Illustrative map · not live data'}
        </span>
      </div>
    </div>
  );
}

// ─── WeatherCard ───────────────────────────────────────────────────────────────
function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  return (
    <div className="weather-card">
      <div className="weather-top">
        <div>
          <small>Destination forecast</small>
          <strong>Addis Ababa</strong>
        </div>
        <span>
          <Icon name="rain" size={28} />
        </span>
      </div>
      <div className="arrival-weather">
        <div>
          <small>At arrival</small>
          <strong>4:30 PM</strong>
        </div>
        <div>
          <small>Temperature</small>
          <strong>{weather.temperature}</strong>
        </div>
        <div>
          <small>Rain chance</small>
          <strong>{weather.rainChance}</strong>
        </div>
      </div>
      <div className="weather-advice">
        <Icon name="spark" size={16} />
        <p>
          <strong>GuzoMate AI recommends</strong>
          {weather.advice}
        </p>
      </div>
    </div>
  );
}

// ─── SceneCopy ─────────────────────────────────────────────────────────────────
function SceneCopy({
  index,
  scene,
  active,
}: {
  index: number;
  scene: typeof scenes[number];
  active: boolean;
}) {
  return (
    <section
      className={`scene scene-${index}`}
      data-index={index}
      data-active={active}
      aria-hidden={!active}
    >
      <div className="scene-copy">
        <span className="scene-number">0{index + 1} / 04</span>
        <p className="eyebrow">{scene.kicker}</p>
        {index === 0 ? <h1>{scene.title}</h1> : <h2>{scene.title}</h2>}
        <p className="scene-body">{scene.body}</p>
        {index === 0 && (
          <p className="foundation-note">
            <Icon name="road" size={17} /> The map provides the geographical foundation.
            Travel intelligence adds the context.
          </p>
        )}
        {index === 1 && (
          <p className="feature-line">
            <span>Text</span>
            <span>Voice</span>
            <span>3 languages</span>
            <span>RAG-grounded</span>
          </p>
        )}
        {index === 2 && (
          <p className="report-note">
            Community reports are cross-verified by active scout consensus.
          </p>
        )}
        {index === 3 && (
          <a className="story-exit" href="#features">
            A little more about the intelligence <span>↓</span>
          </a>
        )}
      </div>
    </section>
  );
}

// ─── Main LandingPage Component ────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const [activeScene, setActiveScene] = useState(0);
  const storyRef = useRef<HTMLElement>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setPageView = useAppStore((state) => state.setPageView);
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const destinationLocation = useAppStore((state) => state.destinationLocation);

  const [incidentData, setIncidentData] = useState<IncidentSnapshot>({
    label: 'Bole Road · Debris reported',
    timeAgo: '18 min ago',
    isLive: false,
  });

  const [weatherData, setWeatherData] = useState<WeatherSnapshot>({
    temperature: '17°C',
    rainChance: '72%',
    advice: 'Rain is expected when you arrive. Bring an umbrella and a light jacket.',
    isLive: false,
  });

  // Languages supported by GuzoMate
  const languages: Array<{ code: Language; label: string; full: string }> = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'am', label: 'አማ', full: 'አማርኛ' },
    { code: 'om', label: 'OM', full: 'Afaan Oromoo' },
  ];
  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  // Fetch real incidents data if available
  useEffect(() => {
    incidentsService
      .getNearby({ lat: 9.005401, lon: 38.763611, radius: 10000, limit: 1 })
      .then((result) => {
        if (result && result.items && result.items.length > 0) {
          const top = result.items[0] as Incident;
          const timestamp = (top as any).occurredAt || top.createdAt || Date.now();
          const mins = Math.max(
            1,
            Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
          );
          setIncidentData({
            label: top.description
              ? top.description.slice(0, 60)
              : `${top.type || 'Incident'} reported`,
            timeAgo: mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)}h ago`,
            isLive: true,
          });
        }
      })
      .catch(() => {
        /* Keep initial fallback */
      });
  }, []);

  // Fetch real weather forecast advice if available
  useEffect(() => {
    const lat = destinationLocation?.lat ?? 9.005401;
    const lon = destinationLocation?.lon ?? 38.763611;
    weatherService
      .getArrivalAdvice(lat, lon, '4:30 PM')
      .then((advice) => {
        if (advice) {
          const forecast = advice.forecastAtArrival;
          const suggestion =
            advice.suggestions?.[0]?.text ||
            'Rain is expected when you arrive. Bring an umbrella and a light jacket.';
          setWeatherData({
            temperature:
              forecast?.temperatureC != null
                ? `${Math.round(forecast.temperatureC)}°C`
                : '17°C',
            rainChance:
              forecast?.precipitationProbability != null
                ? `${Math.round(forecast.precipitationProbability)}%`
                : '72%',
            advice: suggestion,
            isLive: true,
          });
        }
      })
      .catch(() => {
        /* Keep initial fallback */
      });
  }, [destinationLocation]);

  // Scroll-driven animation calculations
  useEffect(() => {
    const story = storyRef.current;
    if (!story) return;
    let frame = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const segment = (value: number, start: number, end: number) =>
      clamp((value - start) / (end - start));

    const updateScene = () => {
      const rect = story.getBoundingClientRect();
      const progress =
        clamp(-rect.top / Math.max(1, story.offsetHeight - window.innerHeight)) * 4;
      setActiveScene(Math.min(3, Math.floor(progress)));
      const foldInner = reduceMotion.matches ? 1 : segment(progress, 0.02, 0.42);
      const foldOuter = reduceMotion.matches ? 1 : segment(progress, 0.32, 0.82);
      const incident = segment(progress, 2.08, 2.48);
      const settling =
        incident < 0.85
          ? (incident / 0.85) * 1.04
          : 1.04 - ((incident - 0.85) / 0.15) * 0.04;

      const values: Record<string, number | string> = {
        '--fold-inner': `${(1 - foldInner) * 178}deg`,
        '--fold-outer': `${(1 - foldOuter) * 179}deg`,
        '--map-scale': reduceMotion.matches
          ? 1
          : 0.64 +
            segment(progress, 0, 0.95) * 0.36 -
            segment(progress, 3.8, 4) * 0.025,
        '--map-tilt': `${
          reduceMotion.matches ? 0 : (1 - segment(progress, 0, 0.95)) * 12
        }deg`,
        '--annotations': segment(progress, 0.45, 0.9),
        '--welcome-en': segment(progress, 1.04, 1.25),
        '--welcome-am': segment(progress, 1.28, 1.51),
        '--welcome-om': segment(progress, 1.54, 1.78),
        '--greetings-out': 1 - segment(progress, 1.9, 2.12),
        '--incident': incident,
        '--incident-rise': reduceMotion.matches ? 1 : settling,
        '--incident-label': segment(progress, 2.42, 2.68),
        '--rain': segment(progress, 3.04, 3.55),
        '--wet': segment(progress, 3.3, 3.86),
        '--forecast': segment(progress, 3.45, 3.72),
        '--advice': segment(progress, 3.68, 3.88),
        '--copy-0': 1 - segment(progress, 0.88, 1),
        '--copy-1':
          (0.25 + 0.75 * segment(progress, 1, 1.1)) *
          (1 - segment(progress, 1.88, 2)),
        '--copy-2':
          (0.25 + 0.75 * segment(progress, 2, 2.1)) *
          (1 - segment(progress, 2.88, 3)),
        '--copy-3': 0.25 + 0.75 * segment(progress, 3, 3.1),
      };

      Object.entries(values).forEach(([key, value]) =>
        story.style.setProperty(key, String(value))
      );
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateScene);
    };

    updateScene();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    reduceMotion.addEventListener('change', scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      reduceMotion.removeEventListener('change', scheduleUpdate);
    };
  }, []);

  return (
    <div className="app-shell">
      {/* ─── Site Header ──────────────────────────────────────────────────────── */}
      <header className="site-header">
        <div
          className="brand"
          onClick={() => {
            if (currentUser) {
              setPageView('home');
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="GuzoMate home"
        >
          <span className="brand-mark">
            <img src={logoImg} alt="GuzoMate Logo" />
          </span>
          <span className="font-extrabold text-xl tracking-tight">GuzoMate</span>
        </div>

        <p>
          A map shows you where.{' '}
          <strong>We help you know what to expect.</strong>
        </p>

        <div className="header-right">
          {/* Multilingual Selector */}
          <div className="header-lang-wrapper" ref={langDropdownRef}>
            <button
              type="button"
              className="header-lang-trigger"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Select application language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLangObj.label}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  langDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langDropdownOpen && (
              <div className="header-lang-menu">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`header-lang-option ${
                      language === l.code ? 'active' : ''
                    }`}
                  >
                    <span>
                      <strong>{l.label}</strong> ({l.full})
                    </span>
                    {language === l.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explore Map Link */}
          <a className="header-action" href="#story">
            Explore <Icon name="arrow" size={15} />
          </a>

          {/* Rewired Authentication / App Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageView('home')}
                className="header-btn header-btn-outline"
              >
                Open App
              </button>
              <button
                type="button"
                onClick={() => setCurrentUser(null)}
                className="header-btn header-btn-ghost text-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="header-btn header-btn-ghost"
              >
                {language === 'am' ? 'ይግቡ' : language === 'om' ? 'Seenaa' : 'Log in'}
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="header-btn header-btn-primary"
              >
                {language === 'am' ? 'ይመዝገቡ' : language === 'om' ? "Galmaa'aa" : 'Sign up'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <main id="top">
        {/* Four-Chapter Story Article */}
        <article className="story" id="story" ref={storyRef}>
          <div className="sticky-stage">
            <p className="stage-caption">
              Travel intelligence / a journey in four chapters
            </p>
            <MapCanvas scene={activeScene} incident={incidentData} />
            <div className="stage-narrative">
              {scenes.map((scene, index) => (
                <SceneCopy
                  index={index}
                  scene={scene}
                  active={activeScene === index}
                  key={scene.kicker}
                />
              ))}
            </div>
            <div className="weather-wrap">
              <WeatherCard weather={weatherData} />
            </div>
            <nav className="chapter-nav" aria-label="Story chapters">
              {scenes.map((scene, index) => (
                <a
                  key={scene.kicker}
                  className={activeScene === index ? 'active' : ''}
                  href={`#scene-${index + 1}`}
                  aria-current={activeScene === index ? 'step' : undefined}
                  aria-label={`Go to chapter ${index + 1}: ${scene.kicker}`}
                >
                  <span>0{index + 1}</span>
                  <i />
                </a>
              ))}
            </nav>
          </div>
          <div className="scene-track">
            {scenes.map((scene, index) => (
              <div
                className="scroll-chapter"
                id={`scene-${index + 1}`}
                key={scene.kicker}
                aria-hidden="true"
              />
            ))}
          </div>
        </article>

        {/* Features Section */}
        <section
          className="features"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="features-heading">
            <p className="eyebrow">05 / From the map to the journey</p>
            <h2 id="features-title">
              A little context.
              <br />
              <em>A better journey.</em>
            </h2>
            <p>
              The map is your geographical foundation.
              <br />
              These are the three layers we add.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                title: 'AI travel assistant',
                icon: 'spark' as const,
                text: 'Your personal travel companion, powered by AI and built to understand you.',
                items: [
                  'RAG-powered conversational assistance',
                  'English, Amharic and Afaan Oromoo',
                  'Voice and text interaction',
                  'Context-aware travel information',
                ],
              },
              {
                title: 'Arrival-time weather',
                icon: 'rain' as const,
                text: 'Know what the weather will be when you get there, and what to bring.',
                items: [
                  'Destination-specific forecasts',
                  'Estimated arrival-time weather',
                  'AI-powered clothing and preparation recommendations',
                ],
              },
              {
                title: 'Community road reports',
                icon: 'warning' as const,
                text: 'Stay aware of incidents and road conditions reported by other travelers.',
                items: [
                  'Accident reports',
                  'Road closures',
                  'Construction and hazards',
                  'Location-based incident information',
                ],
              },
            ].map((feature, index) => (
              <article
                className={`feature-card feature-${index}`}
                key={feature.title}
              >
                <div className="feature-card-top">
                  <span>0{index + 1}</span>
                  <Icon name={feature.icon} size={25} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <ul>
                  {feature.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Closing CTA Section */}
        <section className="closing" aria-labelledby="closing-title">
          <div className="closing-map" aria-hidden="true">
            <MapArtwork />
          </div>
          <div className="closing-copy">
            <p className="eyebrow">The journey continues</p>
            <h2 id="closing-title">
              Go beyond
              <br />
              <em>getting there.</em>
            </h2>
            <p>
              Understand your destination, anticipate the weather, stay informed
              about road incidents and travel with an assistant that speaks your
              language.
            </p>

            <div className="final-actions" aria-describedby="auth-note">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPageView('home')}
                    className="primary-action"
                  >
                    Open GuzoMate <Icon name="arrow" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageView('explore')}
                    className="secondary-action"
                  >
                    Explore Map <Icon name="arrow" size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="primary-action"
                  >
                    Sign up <Icon name="arrow" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="secondary-action"
                  >
                    Log in <Icon name="arrow" size={18} />
                  </button>
                </>
              )}
            </div>

            <small id="auth-note">
              {currentUser
                ? `Signed in as ${currentUser.name || currentUser.email}. Ready to explore routes and radar.`
                : 'Create a free account to bookmark locations, report road hazards, and unlock AI guidance.'}
            </small>
          </div>
        </section>
      </main>

      {/* ─── Site Footer ──────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-lead">
          <div>
            <div
              className="brand"
              onClick={() => {
                if (currentUser) {
                  setPageView('home');
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="GuzoMate home"
            >
              <span className="brand-mark">
                <img src={logoImg} alt="GuzoMate Logo" />
              </span>
              <span className="font-bold text-lg">GuzoMate</span>
            </div>

            <div className="footer-nav">
              <button type="button" onClick={() => setPageView('about')}>
                About Us
              </button>
              <button type="button" onClick={() => setPageView('contact')}>
                Contact Us
              </button>
              <button type="button" onClick={() => setPageView('explore')}>
                Explore Map
              </button>
            </div>
          </div>

          <p>
            Geography is the foundation.
            <br />
            Travel intelligence is the difference.
          </p>
        </div>

        <div className="footer-meta">
          <span>AI assistant · Arrival weather · Community reports</span>
          <span>Addis Ababa, Ethiopia</span>
          <span>© {new Date().getFullYear()} GuzoMate</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
