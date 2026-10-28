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
import { IconButton } from '../common/IconButton';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const WeatherWidget: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const { weather, isLoading, error, refresh } = useWeather();
  const userLocationName = useAppStore((state) => state.userLocationName);

  const formattedTime = weather?.retrievedAt
    ? new Date(weather.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

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
      return <CloudSun className="w-8 h-8 text-emerald-700" />;
    }
    return <Cloud className="w-8 h-8 text-primary" />;
  };

  return (
    <div className="flex flex-col h-full bg-surface-low/30 overflow-y-auto p-4 space-y-4">
      {/* Header with Last Updated and Refresh */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
        <div>
          <h2 className="text-base font-bold text-on-surface tracking-tight leading-tight">
            {t('weather.title')}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mt-0.5 leading-none">
            <Clock className="w-3.5 h-3.5 text-on-surface-variant/60" />
            <span>{t('weather.lastUpdated')}: {formattedTime}</span>
          </div>
        </div>

        <IconButton
          aria-label="Refresh weather data"
          icon={<RefreshCw className={`w-4 h-4 text-on-surface-variant ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={refresh}
          variant="outline"
          shape="rounded"
          className="h-11 w-11 cursor-pointer"
        />
      </div>

      {/* Loading Skeleton State */}
      {isLoading && !weather && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-200/80 rounded-2xl p-4"></div>
          <div className="h-20 bg-gray-200/60 rounded-2xl p-4"></div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200/70 rounded-xl"></div>
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
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-dark transition-colors shadow-xs cursor-pointer"
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
            className="bg-gradient-to-br from-primary/10 via-primary/5 to-white rounded-2xl p-4 border border-primary/20 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <span 
                  className="text-xs font-bold text-primary tracking-wider uppercase leading-none block truncate max-w-[220px]" 
                  title={userLocationName}
                >
                  {userLocationName}
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-4xl font-extrabold text-on-surface tracking-tight leading-none font-display">
                    {weather.current.temperatureC}°C
                  </span>
                  <span className="text-sm font-semibold text-on-surface-variant leading-none">
                    {weather.current.condition}
                  </span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xs flex items-center justify-center text-primary border border-primary/10">
                {getWeatherIcon(weather.current.condition)}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-primary/10">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-on-surface-variant/70 flex items-center gap-1 leading-none">
                  <CloudRain className="w-3 h-3 text-primary" />
                  Precip
                </span>
                <span className="text-xs font-bold text-on-surface mt-1 leading-none">
                  {weather.current.precipitationMm != null ? `${weather.current.precipitationMm} mm` : '0 mm'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-on-surface-variant/70 flex items-center gap-1 leading-none">
                  <Wind className="w-3 h-3 text-primary" />
                  {t('weather.wind')}
                </span>
                <span className="text-xs font-bold text-on-surface mt-1 leading-none">
                  {weather.current.windKph != null ? `${weather.current.windKph} km/h` : '--'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-on-surface-variant/70 flex items-center gap-1 leading-none">
                  <Droplets className="w-3 h-3 text-primary" />
                  Humidity
                </span>
                <span className="text-xs font-bold text-on-surface mt-1 leading-none">
                  {weather.current.humidity != null ? `${weather.current.humidity}%` : '--'}
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
            className="bg-amber-50/90 backdrop-blur-sm rounded-2xl p-4 border border-secondary/30 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2 text-secondary-dark font-bold text-sm leading-tight">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span>{t('weather.arrivalAdvice')}</span>
            </div>

            {weather.arrivalAdvice?.suggestions && weather.arrivalAdvice.suggestions.length > 0 ? (
              <div className="space-y-2">
                {weather.arrivalAdvice.suggestions.map((sug, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-on-surface font-medium">
                    <Umbrella className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold leading-tight">{sug.text}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{sug.reason}</p>
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
          {weather.forecast && weather.forecast.length > 0 && weather.forecast[0]?.hourly?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-on-surface-variant tracking-wide uppercase mb-3 leading-none">
                {t('weather.hourlyForecast')}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {weather.forecast[0].hourly.slice(0, 6).map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                    whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                    transition={springTactile}
                    className="bg-white rounded-xl p-2.5 border border-outline-variant/40 flex flex-col items-center justify-center text-center gap-1 shadow-xs select-none hover:border-primary/40"
                  >
                    <span className="text-[11px] font-bold text-on-surface-variant leading-none">
                      {formatHourString(item.time)}
                    </span>
                    <CloudRain
                      className={`w-4 h-4 ${
                        item.precipitationProbability > 40 ? 'text-primary' : 'text-on-surface-variant/40'
                      }`}
                    />
                    <span className="text-xs font-extrabold text-on-surface leading-none">{item.temperatureC}°</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                      {item.precipitationProbability}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Honest Provider & Cache Attribution */}
          <div className="text-[11px] text-on-surface-variant/60 pt-2 flex items-center justify-between border-t border-outline-variant/20 leading-none">
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
