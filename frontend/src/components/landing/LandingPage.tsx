import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { Language, Incident } from '../../types';
import { incidentsService } from '../../services/incidentsService';
import { weatherService } from '../../services/weatherService';
import logoImg from '../../assets/logo.png';
import { Globe, ChevronDown, Check } from 'lucide-react';
import '../../styles/landing.css';
import {
  landingTranslations,
  LandingCopy,
  SceneTranslation,
} from './landingTranslations';

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
  copy,
}: {
  scene: number;
  incident: IncidentSnapshot;
  copy: LandingCopy;
}) {
  return (
    <div
      className="map-canvas"
      data-scene={scene}
      role="img"
      aria-label={copy.stage.ariaLabel}
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
        <div className="map-label origin-label">{copy.map.origin}</div>
        <div className="origin-dot" />
        <div className="map-label destination-label">{copy.map.destination}</div>
        <div className="destination-pin">
          <Icon name="mapPin" size={22} />
        </div>
        <div className="arrival-tag">
          <span>{copy.map.estimatedArrival}</span>
          <strong>{copy.map.arrivalTime}</strong>
        </div>
        <div className="map-greetings">
          <div className="greeting greeting-en">
            <small>{copy.map.greetings.enLabel}</small>
            <strong lang="en">{copy.map.greetings.enText}</strong>
          </div>
          <div className="greeting greeting-am">
            <small>{copy.map.greetings.amLabel}</small>
            <strong lang="am">{copy.map.greetings.amText}</strong>
          </div>
          <div className="greeting greeting-om">
            <small>{copy.map.greetings.omLabel}</small>
            <strong lang="om">{copy.map.greetings.omText}</strong>
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
              {incident.isLive ? copy.map.liveReport : copy.map.communityReport} · {incident.timeAgo}
            </small>
            <strong>{copy.map.incidentReported}</strong>
            <span>{incident.label}</span>
            <em>{incident.isLive ? copy.map.verifiedCommunity : copy.map.unverifiedReport}</em>
          </div>
        </div>
        <span className="demo-label">
          {incident.isLive ? copy.map.liveSpatialLabel : copy.map.illustrativeLabel}
        </span>
      </div>
    </div>
  );
}

// ─── WeatherCard ───────────────────────────────────────────────────────────────
function WeatherCard({
  weather,
  copy,
}: {
  weather: WeatherSnapshot;
  copy: LandingCopy;
}) {
  return (
    <div className="weather-card">
      <div className="weather-top">
        <div>
          <small>{copy.weather.destinationForecast}</small>
          <strong>{copy.weather.destinationCity}</strong>
        </div>
        <span>
          <Icon name="rain" size={28} />
        </span>
      </div>
      <div className="arrival-weather">
        <div>
          <small>{copy.weather.atArrival}</small>
          <strong>{copy.weather.arrivalTime}</strong>
        </div>
        <div>
          <small>{copy.weather.temperature}</small>
          <strong>{weather.temperature}</strong>
        </div>
        <div>
          <small>{copy.weather.rainChance}</small>
          <strong>{weather.rainChance}</strong>
        </div>
      </div>
      <div className="weather-advice">
        <Icon name="spark" size={16} />
        <p>
          <strong>{copy.weather.aiRecommends}</strong>
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
  scene: SceneTranslation;
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
        <span className="scene-number">{scene.number}</span>
        <p className="eyebrow">{scene.kicker}</p>
        {index === 0 ? <h1>{scene.title}</h1> : <h2>{scene.title}</h2>}
        <p className="scene-body">{scene.body}</p>
        {index === 0 && scene.foundationNote && (
          <p className="foundation-note">
            <Icon name="road" size={17} /> {scene.foundationNote}
          </p>
        )}
        {index === 1 && scene.badges && (
          <p className="feature-line">
            {scene.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </p>
        )}
        {index === 2 && scene.reportNote && (
          <p className="report-note">{scene.reportNote}</p>
        )}
        {index === 3 && scene.exitLink && (
          <a className="story-exit" href="#features">
            {scene.exitLink}
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

  const copy = landingTranslations[language] || landingTranslations.en;

  // Live state overrides (if real API data is fetched)
  const [liveIncident, setLiveIncident] = useState<{
    label: string;
    mins: number;
  } | null>(null);

  const [liveWeather, setLiveWeather] = useState<{
    temperature: string;
    rainChance: string;
    advice: string;
  } | null>(null);

  // Computed snapshot incorporating active language copy & live data
  const incidentData: IncidentSnapshot = liveIncident
    ? {
        label: liveIncident.label,
        timeAgo: copy.map.formatTimeAgo(liveIncident.mins),
        isLive: true,
      }
    : {
        label: copy.map.incidentDefaultLabel,
        timeAgo: copy.map.formatTimeAgo(18),
        isLive: false,
      };

  const weatherData: WeatherSnapshot = liveWeather
    ? {
        temperature: liveWeather.temperature,
        rainChance: liveWeather.rainChance,
        advice: liveWeather.advice,
        isLive: true,
      }
    : {
        temperature: '17°C',
        rainChance: '72%',
        advice: copy.weather.defaultAdvice,
        isLive: false,
      };

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
          setLiveIncident({
            label: top.description
              ? top.description.slice(0, 60)
              : `${top.type || 'Incident'} reported`,
            mins,
          });
        }
      })
      .catch(() => {
        /* Keep fallback */
      });
  }, []);

  // Fetch real weather forecast advice if available
  useEffect(() => {
    const lat = destinationLocation?.lat ?? 9.005401;
    const lon = destinationLocation?.lon ?? 38.763611;
    weatherService
      .getArrivalAdvice(lat, lon, copy.map.arrivalTime)
      .then((advice) => {
        if (advice) {
          const forecast = advice.forecastAtArrival;
          const suggestion =
            advice.suggestions?.[0]?.text || copy.weather.defaultAdvice;
          setLiveWeather({
            temperature:
              forecast?.temperatureC != null
                ? `${Math.round(forecast.temperatureC)}°C`
                : '17°C',
            rainChance:
              forecast?.precipitationProbability != null
                ? `${Math.round(forecast.precipitationProbability)}%`
                : '72%',
            advice: suggestion,
          });
        }
      })
      .catch(() => {
        /* Keep fallback */
      });
  }, [destinationLocation, copy.map.arrivalTime, copy.weather.defaultAdvice]);

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
    <div className="app-shell" lang={language}>
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
          {copy.header.taglineLead}
          <strong>{copy.header.taglineEmphasis}</strong>
        </p>

        <div className="header-right">
          {/* Multilingual Selector */}
          <div className="header-lang-wrapper" ref={langDropdownRef}>
            <button
              type="button"
              className="header-lang-trigger"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label={copy.header.selectLanguage}
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
                    {language === l.code && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explore Map Link */}
          <a className="header-action" href="#story">
            {copy.header.explore} <Icon name="arrow" size={15} />
          </a>

          {/* Rewired Authentication / App Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageView('home')}
                className="header-btn header-btn-outline"
              >
                {copy.header.openApp}
              </button>
              <button
                type="button"
                onClick={() => setCurrentUser(null)}
                className="header-btn header-btn-ghost text-red-600"
              >
                {copy.header.signOut}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="header-btn header-btn-ghost"
              >
                {copy.header.logIn}
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="header-btn header-btn-primary"
              >
                {copy.header.signUp}
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
            <p className="stage-caption">{copy.stage.caption}</p>
            <MapCanvas scene={activeScene} incident={incidentData} copy={copy} />
            <div className="stage-narrative">
              {copy.scenes.map((scene, index) => (
                <SceneCopy
                  index={index}
                  scene={scene}
                  active={activeScene === index}
                  key={scene.number}
                />
              ))}
            </div>
            <div className="weather-wrap">
              <WeatherCard weather={weatherData} copy={copy} />
            </div>
            <nav className="chapter-nav" aria-label={copy.stage.chapterNavLabel}>
              {copy.scenes.map((scene, index) => (
                <a
                  key={scene.number}
                  className={activeScene === index ? 'active' : ''}
                  href={`#scene-${index + 1}`}
                  aria-current={activeScene === index ? 'step' : undefined}
                  aria-label={`${copy.stage.chapterAriaPrefix} ${index + 1}: ${scene.kicker}`}
                >
                  <span>{scene.number.split(' ')[0]}</span>
                  <i />
                </a>
              ))}
            </nav>
          </div>
          <div className="scene-track">
            {copy.scenes.map((scene, index) => (
              <div
                className="scroll-chapter"
                id={`scene-${index + 1}`}
                key={scene.number}
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
            <p className="eyebrow">{copy.features.eyebrow}</p>
            <h2 id="features-title">
              {copy.features.titleLead}
              <br />
              <em>{copy.features.titleEmphasis}</em>
            </h2>
            <p>
              {copy.features.subtitleLead}
              <br />
              {copy.features.subtitleHighlight}
            </p>
          </div>
          <div className="feature-grid">
            {copy.features.cards.map((feature, index) => (
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
            <p className="eyebrow">{copy.closing.eyebrow}</p>
            <h2 id="closing-title">
              {copy.closing.titleLead}
              <br />
              <em>{copy.closing.titleEmphasis}</em>
            </h2>
            <p>{copy.closing.body}</p>

            <div className="final-actions" aria-describedby="auth-note">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPageView('home')}
                    className="primary-action"
                  >
                    {copy.closing.openApp} <Icon name="arrow" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageView('explore')}
                    className="secondary-action"
                  >
                    {copy.closing.exploreMap} <Icon name="arrow" size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="primary-action"
                  >
                    {copy.closing.signUp} <Icon name="arrow" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="secondary-action"
                  >
                    {copy.closing.logIn} <Icon name="arrow" size={18} />
                  </button>
                </>
              )}
            </div>

            <small id="auth-note">
              {currentUser
                ? copy.closing.authNoteLoggedIn(currentUser.name || currentUser.email)
                : copy.closing.authNoteLoggedOut}
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
                {copy.footer.aboutUs}
              </button>
              <button type="button" onClick={() => setPageView('contact')}>
                {copy.footer.contactUs}
              </button>
              <button type="button" onClick={() => setPageView('explore')}>
                {copy.footer.exploreMap}
              </button>
            </div>
          </div>

          <p>
            {copy.footer.quoteLead}
            <br />
            {copy.footer.quoteEmphasis}
          </p>
        </div>

        <div className="footer-meta">
          <span>{copy.footer.metaPill}</span>
          <span>{copy.footer.location}</span>
          <span>© {new Date().getFullYear()} GuzoMate</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
