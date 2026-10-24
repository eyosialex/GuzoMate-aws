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
import { IconButton } from '../common/IconButton';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const WeatherWidget: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const { weather, isLoading, refresh } = useWeather();

  const formattedTime = weather?.retrievedAt
    ? new Date(weather.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto p-4 space-y-4">
      {/* Header with Last Updated and Refresh */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
            {t('weather.title')}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5 leading-none">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{t('weather.lastUpdated')}: {formattedTime}</span>
          </div>
        </div>

        <IconButton
          aria-label="Refresh weather data"
          icon={<RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />}
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
        className="bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 rounded-2xl p-4 border border-indigo-100/80 shadow-[0_4px_16px_rgba(79,70,229,0.06)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 tracking-wider uppercase leading-none block">
              Addis Ababa Central
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                {weather?.current.temperatureC ?? 22}°C
              </span>
              <span className="text-sm font-semibold text-gray-600 leading-none">
                {weather?.current.condition ?? 'Partly Cloudy'}
              </span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-indigo-600 border border-white/60">
            <CloudSun className="w-8 h-8" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-100/60">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 leading-none">
              <CloudRain className="w-3 h-3 text-indigo-500" />
              Precip
            </span>
            <span className="text-xs font-bold text-gray-900 mt-1 leading-none">
              {weather?.current.precipitationMm ?? 0.2} mm
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 leading-none">
              <Wind className="w-3 h-3 text-indigo-500" />
              {t('weather.wind')}
            </span>
            <span className="text-xs font-bold text-gray-900 mt-1 leading-none">
              {weather?.current.windKph ?? 11} km/h
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 leading-none">
              <Droplets className="w-3 h-3 text-indigo-500" />
              Humidity
            </span>
            <span className="text-xs font-bold text-gray-900 mt-1 leading-none">
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
        className="bg-amber-50/90 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.06)]"
      >
        <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm leading-tight">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>{t('weather.arrivalAdvice')}</span>
        </div>

        {weather?.arrivalAdvice?.suggestions && weather.arrivalAdvice.suggestions.length > 0 ? (
          <div className="space-y-2">
            {weather.arrivalAdvice.suggestions.map((sug, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-950 font-medium">
                <Umbrella className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold leading-tight">{sug.text}</p>
                  <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">{sug.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-medium text-amber-900 leading-relaxed">
            {t('weather.umbrellaAdvised')}
          </p>
        )}
      </motion.div>

      {/* Hourly Forecast Strip with Tactile Spring Cards */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 tracking-wide uppercase mb-3 leading-none">
          {t('weather.hourlyForecast')}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {weather?.forecast[0]?.hourly?.slice(0, 6).map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
              transition={springTactile}
              className="bg-gray-50/90 rounded-xl p-2.5 border border-gray-100 flex flex-col items-center justify-center text-center gap-1 shadow-sm cursor-pointer select-none"
            >
              <span className="text-[11px] font-bold text-gray-500 leading-none">{item.time}</span>
              <CloudRain
                className={`w-4 h-4 ${
                  item.precipitationProbability > 40 ? 'text-indigo-600' : 'text-gray-400'
                }`}
              />
              <span className="text-xs font-extrabold text-gray-900 leading-none">{item.temperatureC}°</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/90 px-1.5 py-0.5 rounded-full leading-none">
                {item.precipitationProbability}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Provider Attribution */}
      <div className="text-[11px] text-gray-400 pt-2 flex items-center justify-between border-t border-gray-50 leading-none">
        <span>Provider: WeatherAPI Addis Ababa Station</span>
        <span>ODbL Compliant</span>
      </div>
    </div>
  );
};
