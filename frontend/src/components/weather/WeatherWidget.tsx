import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Umbrella 
} from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { useI18n } from '../../hooks/useI18n';
import { useAppStore } from '../../features/useAppStore';
import { IconButton } from '../common/IconButton';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const WeatherWidget: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const { weather, isLoading, refresh } = useWeather();
  const userLocationName = useAppStore((state) => state.userLocationName);

  const formattedTime = weather?.retrievedAt
    ? new Date(weather.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

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
          className="h-11 w-11"
        />
      </div>

      {/* Current Conditions Card with Scale 0.95 Enter Animation */}
      <motion.div
        variants={cardEnter}
        initial={shouldReduceMotion ? undefined : 'hidden'}
        animate={shouldReduceMotion ? undefined : 'visible'}
        transition={springGentle}
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-white rounded-2xl p-4 border border-primary/20 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase leading-none block truncate max-w-[220px]" title={userLocationName}>
              {userLocationName}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-on-surface tracking-tight leading-none font-display">
                {weather?.current.temperatureC ?? 22}°C
              </span>
              <span className="text-sm font-semibold text-on-surface-variant leading-none">
                {weather?.current.condition ?? 'Partly Cloudy'}
              </span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xs flex items-center justify-center text-primary border border-primary/10">
            <CloudSun className="w-8 h-8" />
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
              {weather?.current.precipitationMm ?? 0.2} mm
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-on-surface-variant/70 flex items-center gap-1 leading-none">
              <Wind className="w-3 h-3 text-primary" />
              {t('weather.wind')}
            </span>
            <span className="text-xs font-bold text-on-surface mt-1 leading-none">
              {weather?.current.windKph ?? 11} km/h
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-on-surface-variant/70 flex items-center gap-1 leading-none">
              <Droplets className="w-3 h-3 text-primary" />
              Humidity
            </span>
            <span className="text-xs font-bold text-on-surface mt-1 leading-none">
              {weather?.current.humidity ?? 58}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Inline AI Arrival Advice Banner with Frosted Amber Styling */}
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

        {weather?.arrivalAdvice?.suggestions && weather.arrivalAdvice.suggestions.length > 0 ? (
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

      {/* Hourly Forecast Strip with Tactile Spring Cards */}
      <div>
        <h3 className="text-xs font-bold text-on-surface-variant tracking-wide uppercase mb-3 leading-none">
          {t('weather.hourlyForecast')}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {weather?.forecast[0]?.hourly?.slice(0, 6).map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
              transition={springTactile}
              className="bg-white rounded-xl p-2.5 border border-outline-variant/40 flex flex-col items-center justify-center text-center gap-1 shadow-xs cursor-pointer select-none hover:border-primary/40"
            >
              <span className="text-[11px] font-bold text-on-surface-variant leading-none">{item.time}</span>
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

      {/* Provider Attribution */}
      <div className="text-[11px] text-on-surface-variant/50 pt-2 flex items-center justify-between border-t border-outline-variant/20 leading-none">
        <span>Provider: WeatherAPI Addis Ababa Station</span>
        <span>ODbL Compliant</span>
      </div>
    </div>
  );
};
