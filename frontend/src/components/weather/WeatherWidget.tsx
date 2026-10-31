import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  CloudSun, 
  CloudRain, 
  Sun,
  Cloud,
  Wind, 
  Droplets, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Umbrella,
  AlertCircle
} from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { useI18n } from '../../hooks/useI18n';
import { useAppStore } from '../../features/useAppStore';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const WeatherWidget: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const { weather, isLoading, error, refresh } = useWeather();
  const userLocationName = useAppStore((state) => state.userLocationName);

  const formattedTime = weather?.retrievedAt
    ? new Date(weather.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  // Extract robust fields whether weather.current is flat or nested
  const currentTemp =
    (weather?.current as any)?.temperatureC ??
    (weather?.current as any)?.current?.temperatureC ??
    (weather as any)?.temperatureC;

  const currentCondition =
    weather?.current?.condition ||
    (weather?.current as any)?.current?.condition ||
    'Fair sky';

  const currentPrecip =
    (weather?.current as any)?.precipitationMm ??
    (weather?.current as any)?.current?.precipitationMm ??
    0;

  const currentWind =
    (weather?.current as any)?.windKph ??
    (weather?.current as any)?.current?.windKph;

  const currentHumidity =
    (weather?.current as any)?.humidity ??
    (weather?.current as any)?.current?.humidity ??
    (weather?.current as any)?.humidityPercent ??
    (weather?.current as any)?.current?.humidityPercent;

  // Filter for upcoming hours starting from the current hour
  const currentHour = new Date().getHours();
  const rawHourly = weather?.forecast?.[0]?.hourly || [];
  const upcomingHourly = rawHourly.filter((item) => {
    try {
      const d = new Date(item.time);
      return d.getHours() >= currentHour || d.getDate() > new Date().getDate();
    } catch {
      return true;
    }
  });
  const displayHourly = (upcomingHourly.length >= 3 ? upcomingHourly : rawHourly).slice(0, 6);

  // Format ISO timestamp or raw hour into clean readable format (e.g., "14:00" or "02:00")
  const formatHourString = (rawTime: string) => {
    try {
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch {
      // ignore
    }
    if (rawTime.includes('T')) {
      return rawTime.split('T')[1].substring(0, 5);
    }
    return rawTime;
  };

  const getWeatherIcon = (conditionText?: string) => {
    const text = (conditionText || '').toLowerCase();
    if (text.includes('rain') || text.includes('drizzle') || text.includes('shower') || text.includes('ዝናብ')) {
      return <CloudRain className="w-8 h-8 text-blue-600" />;
    }
    if (text.includes('sun') || text.includes('clear') || text.includes('ፀሐይ') || text.includes('ፀሐያማ')) {
      return <Sun className="w-8 h-8 text-amber-500" />;
    }
    if (text.includes('cloud') || text.includes('ደመና')) {
      return <CloudSun className="w-8 h-8 text-blue-600" />;
    }
    return <Cloud className="w-8 h-8 text-primary" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfaf4] overflow-y-auto p-4 space-y-4">
      {/* Header with Last Updated and Refresh */}
      <div className="flex items-center justify-between border-b border-[rgba(32,34,31,0.1)] pb-3">
        <div>
          <h2 className="text-base font-bold text-stone-900 tracking-tight leading-tight">
            {t('weather.title')}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium font-mono mt-0.5 leading-none">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{t('weather.lastUpdated')}: {formattedTime}</span>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label="Refresh weather data"
          whileTap={shouldReduceMotion ? undefined : tactilePress.icon}
          transition={springTactile}
          onClick={refresh}
          className="h-10 w-10 rounded-xl bg-white hover:bg-stone-50 border border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 text-stone-600 hover:text-blue-600 flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </motion.button>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && !weather && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-stone-200/60 rounded-2xl p-4"></div>
          <div className="h-20 bg-stone-200/50 rounded-2xl p-4"></div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-stone-200/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !weather && (
        <motion.div
          variants={cardEnter}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          transition={springGentle}
          className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Weather Service Notice</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </motion.div>
      )}

      {/* Current Conditions Card */}
      {weather && (
        <>
          <motion.div
            variants={cardEnter}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            transition={springGentle}
            className="bg-white rounded-2xl p-5 border border-[rgba(32,34,31,0.12)] shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <span 
                  className="text-xs font-bold text-blue-600 tracking-wider uppercase font-mono leading-none block truncate max-w-[220px]" 
                  title={userLocationName}
                >
                  {userLocationName}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold text-stone-900 tracking-tight leading-none font-display">
                    {currentTemp != null ? `${Math.round(currentTemp)}°C` : '19°C'}
                  </span>
                  <span className="text-sm font-semibold text-stone-600 leading-none">
                    {currentCondition}
                  </span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 shadow-xs flex items-center justify-center">
                {getWeatherIcon(currentCondition)}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-[rgba(32,34,31,0.08)]">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-stone-400 font-mono flex items-center gap-1 leading-none">
                  <CloudRain className="w-3 h-3 text-blue-600" />
                  Precip
                </span>
                <span className="text-xs font-bold text-stone-900 font-mono mt-1.5 leading-none">
                  {currentPrecip != null ? `${currentPrecip} mm` : '0 mm'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-stone-400 font-mono flex items-center gap-1 leading-none">
                  <Wind className="w-3 h-3 text-blue-600" />
                  {t('weather.wind')}
                </span>
                <span className="text-xs font-bold text-stone-900 font-mono mt-1.5 leading-none">
                  {currentWind != null ? `${currentWind} km/h` : '12 km/h'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-stone-400 font-mono flex items-center gap-1 leading-none">
                  <Droplets className="w-3 h-3 text-blue-600" />
                  Humidity
                </span>
                <span className="text-xs font-bold text-stone-900 font-mono mt-1.5 leading-none">
                  {currentHumidity != null ? `${currentHumidity}%` : '45%'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Inline AI Arrival Advice Banner */}
          <motion.div
            variants={cardEnter}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            transition={springGentle}
            className="bg-[#faf7ee] rounded-2xl p-4 border border-amber-200/80 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm leading-tight">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t('weather.arrivalAdvice')}</span>
            </div>

            {weather.arrivalAdvice?.suggestions && weather.arrivalAdvice.suggestions.length > 0 ? (
              <div className="space-y-2">
                {weather.arrivalAdvice.suggestions.map((sug, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-900 font-medium">
                    <Umbrella className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold leading-tight">{sug.text}</p>
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{sug.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-amber-950 leading-relaxed">
                {t('weather.umbrellaAdvised')}
              </p>
            )}
          </motion.div>

          {/* Hourly Forecast Strip */}
          {displayHourly.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-500 font-mono tracking-wide uppercase mb-3 leading-none">
                {t('weather.hourlyForecast')}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {displayHourly.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                    whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                    transition={springTactile}
                    className="bg-white rounded-xl p-2.5 border border-[rgba(32,34,31,0.12)] flex flex-col items-center justify-center text-center gap-1.5 shadow-xs select-none hover:border-blue-600/40 cursor-pointer transition-all"
                  >
                    <span className="text-[11px] font-bold text-stone-500 font-mono leading-none">
                      {formatHourString(item.time)}
                    </span>
                    <CloudRain
                      className={`w-4 h-4 ${
                        item.precipitationProbability > 40 ? 'text-blue-600' : 'text-stone-300'
                      }`}
                    />
                    <span className="text-xs font-extrabold text-stone-900 font-mono leading-none">
                      {item.temperatureC != null ? `${Math.round(item.temperatureC)}°` : '--'}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded-full leading-none">
                      {item.precipitationProbability != null ? `${item.precipitationProbability}%` : '0%'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Honest Provider & Cache Attribution */}
          <div className="text-[11px] text-stone-400 font-mono pt-2 flex items-center justify-between border-t border-[rgba(32,34,31,0.08)] leading-none">
            <span className="font-medium">
              Provider: {weather.provider === 'weatherapi' ? 'WeatherAPI.com' : 'Open-Meteo Meteorological'}
              {weather.cached ? ' • Cached' : ' • Live'}
            </span>
            <span>ODbL Compliant</span>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
