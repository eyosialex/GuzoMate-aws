import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { ProviderError } from '../../../shared/errors/app-error.js';
import {
  NormalizedWeatherData,
  SupportedLanguage,
  WeatherArrivalAdvice,
  WeatherForecastDayItem,
  WeatherHourlyItem,
  WeatherLocation,
  WeatherSuggestion,
} from './weather.types.js';

export interface IWeatherProvider {
  fetchForecast(location: WeatherLocation, days?: number, language?: SupportedLanguage): Promise<NormalizedWeatherData>;
  generateArrivalAdvice(
    weather: NormalizedWeatherData,
    targetArrivalIso: string,
    language: SupportedLanguage
  ): WeatherArrivalAdvice;
}

export class WeatherApiProvider implements IWeatherProvider {
  private apiKey: string | undefined;
  private weatherApiBaseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.apiKey = env.WEATHER_API_KEY;
    this.weatherApiBaseUrl =
      env.WEATHER_URL && !env.WEATHER_URL.includes('open-meteo')
        ? env.WEATHER_URL
        : 'https://api.weatherapi.com/v1';
    this.timeoutMs = env.WEATHER_REQUEST_TIMEOUT_MS || 10000;
  }

  public async fetchForecast(
    location: WeatherLocation,
    days = 3,
    language: SupportedLanguage = 'en'
  ): Promise<NormalizedWeatherData> {
    const { lat, lon } = location;

    // 1. Try WeatherAPI if API key is configured
    if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        return await this.fetchFromWeatherApi(lat, lon, days, language);
      } catch (err: any) {
        logger.warn('[WeatherProvider] WeatherAPI request failed, attempting Open-Meteo fallback', {
          lat,
          lon,
          error: err.message,
        });
      }
    }

    // 2. Fallback to Open-Meteo (open meteorological standard, requires no API key)
    try {
      return await this.fetchFromOpenMeteo(lat, lon, days, language);
    } catch (err: any) {
      logger.error('[WeatherProvider] All weather providers failed', {
        lat,
        lon,
        error: err.message,
      });
      throw new ProviderError(
        'Weather forecast service is temporarily unavailable. Please try again shortly.',
        503,
        undefined,
        { originalError: err.message }
      );
    }
  }

  private async fetchFromWeatherApi(
    lat: number,
    lon: number,
    days: number,
    language: SupportedLanguage
  ): Promise<NormalizedWeatherData> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const langParam = language === 'am' ? 'am' : language === 'om' ? 'en' : 'en';
    const url = `${this.weatherApiBaseUrl}/forecast.json?key=${this.apiKey}&q=${lat},${lon}&days=${days}&aqi=no&alerts=no&lang=${langParam}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`WeatherAPI returned HTTP ${res.status}: ${text}`);
      }

      const json = (await res.json()) as any;
      const current = json.current;
      const forecastDaysRaw = json.forecast?.forecastday || [];

      const forecast: WeatherForecastDayItem[] = forecastDaysRaw.map((day: any) => ({
        date: day.date,
        hourly: (day.hour || []).map((h: any) => ({
          time: h.time,
          temperatureC: Math.round(h.temp_c),
          condition: this.translateConditionText(h.condition?.text || 'Clear', language),
          precipitationProbability: h.chance_of_rain ?? h.chance_of_snow ?? 0,
        })),
      }));

      return {
        location: { lat, lon },
        current: {
          temperatureC: Math.round(current?.temp_c ?? 20),
          condition: this.translateConditionText(current?.condition?.text || 'Clear', language),
          precipitationMm: current?.precip_mm ?? 0,
          windKph: current?.wind_kph ?? 0,
          humidity: current?.humidity != null ? Math.round(current.humidity) : null,
        },
        forecast,
        provider: 'weatherapi',
        retrievedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('WeatherAPI request timed out');
      }
      throw err;
    }
  }

  private async fetchFromOpenMeteo(
    lat: number,
    lon: number,
    days: number,
    language: SupportedLanguage
  ): Promise<NormalizedWeatherData> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&forecast_days=${days}&timezone=Africa/Addis_Ababa`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Open-Meteo returned HTTP ${res.status}: ${text}`);
      }

      const data = (await res.json()) as any;
      const current = data.current;
      const hourly = data.hourly;

      // Group hourly entries by date
      const daysMap = new Map<string, WeatherHourlyItem[]>();
      if (hourly && Array.isArray(hourly.time)) {
        for (let i = 0; i < hourly.time.length; i++) {
          const rawTime = hourly.time[i]; // e.g. "2026-10-25T14:00"
          const date = rawTime.split('T')[0];
          const time = rawTime.includes('+') ? rawTime : `${rawTime}:00+03:00`;
          const code = hourly.weather_code?.[i] ?? 0;

          if (!daysMap.has(date)) {
            daysMap.set(date, []);
          }

          daysMap.get(date)!.push({
            time,
            temperatureC: Math.round(hourly.temperature_2m?.[i] ?? 20),
            condition: this.getWmoDescription(code, language),
            precipitationProbability: hourly.precipitation_probability?.[i] ?? 0,
          });
        }
      }

      const forecast: WeatherForecastDayItem[] = Array.from(daysMap.entries()).map(
        ([date, items]) => ({
          date,
          hourly: items,
        })
      );

      const currentCode = current?.weather_code ?? 0;
      return {
        location: { lat, lon },
        current: {
          temperatureC: Math.round(current?.temperature_2m ?? 20),
          condition: this.getWmoDescription(currentCode, language),
          precipitationMm: current?.precipitation ?? 0,
          windKph: Math.round(current?.wind_speed_10m ?? 0),
          humidity: current?.relative_humidity_2m != null ? Math.round(current.relative_humidity_2m) : null,
        },
        forecast,
        provider: 'open-meteo',
        retrievedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('Open-Meteo request timed out');
      }
      throw err;
    }
  }

  public generateArrivalAdvice(
    weather: NormalizedWeatherData,
    targetArrivalIso: string,
    language: SupportedLanguage = 'en'
  ): WeatherArrivalAdvice {
    const targetMs = new Date(targetArrivalIso).getTime();

    // 1. Locate the closest hourly forecast in time
    let closestHour: WeatherHourlyItem | null = null;
    let minDiff = Infinity;

    for (const day of weather.forecast) {
      for (const h of day.hourly) {
        const hMs = new Date(h.time).getTime();
        const diff = Math.abs(hMs - targetMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestHour = h;
        }
      }
    }

    // If target time is beyond forecast horizon, disclose limitation
    const isBeyondHorizon = !closestHour || minDiff > 24 * 60 * 60 * 1000;
    const arrivalForecast = closestHour || {
      time: targetArrivalIso,
      temperatureC: weather.current.temperatureC,
      condition: weather.current.condition,
      precipitationProbability: (weather.current.precipitationMm ?? 0) > 0 ? 50 : 10,
    };

    // 2. Generate multilingual, actionable advice based on forecast metrics
    const suggestions: WeatherSuggestion[] = [];
    const tempC = arrivalForecast.temperatureC;
    const rainProb = arrivalForecast.precipitationProbability;
    const condition = arrivalForecast.condition.toLowerCase();

    // Rain / Umbrella advice
    if (rainProb >= 35 || condition.includes('rain') || condition.includes('ዝናብ') || condition.includes('rooba')) {
      if (language === 'am') {
        suggestions.push({
          type: 'accessory',
          text: 'ዣንጥላ ይያዙ እና የውሃ መከላከያ ጫማ ወይም ጃኬት ይልበሱ',
          reason: `በመድረሻ ሰዓትዎ ${rainProb}% የዝናብ ዕድል ይጠበቃል`,
        });
      } else if (language === 'om') {
        suggestions.push({
          type: 'accessory',
          text: 'Gaaddisaa (dambalii) qabadhaa fi wayyaa roobaa uffadhaa',
          reason: `Yeroo gahuutti carraan roobaa %${rainProb} eegama`,
        });
      } else {
        suggestions.push({
          type: 'accessory',
          text: 'Consider carrying an umbrella and wearing water-resistant footwear',
          reason: `${rainProb}% chance of rain forecasted around arrival time`,
        });
      }
    }

    // Cold / Warm clothing advice
    if (tempC <= 15) {
      if (language === 'am') {
        suggestions.push({
          type: 'clothing',
          text: 'ቀዝቃዛ ስለሚሆን ሞቅ ያለ ልብስ (ሹራብ ወይም ጃኬት) ይልበሱ',
          reason: `በመድረሻ ሰዓት የሚጠበቀው የሙቀት መጠን ${tempC}°C ነው`,
        });
      } else if (language === 'om') {
        suggestions.push({
          type: 'clothing',
          text: 'Qorra waan ta\'eef wayyaa ho\'aa (jaakkeettii) uffadhaa',
          reason: `Ho\'i qilleensaa yeroo gahuutti ${tempC}°C ta\'a`,
        });
      } else {
        suggestions.push({
          type: 'clothing',
          text: 'Dress warmly in layers; a jacket or sweater is recommended',
          reason: `Cool temperature of ${tempC}°C expected at destination upon arrival`,
        });
      }
    } else if (tempC >= 16 && tempC <= 21 && rainProb < 35) {
      if (language === 'am') {
        suggestions.push({
          type: 'clothing',
          text: 'ቀለል ያለ ጃኬት ወይም ሸሚዝ ይመረጣል',
          reason: `የሙቀት መጠኑ ${tempC}°C አካባቢ መጠነኛ ነው`,
        });
      } else if (language === 'om') {
        suggestions.push({
          type: 'clothing',
          text: 'Qilleensi madaalawaa waan ta\'eef wayyaa salphaa uffadhaa',
          reason: `Ho\'i qilleensaa ${tempC}°C dha`,
        });
      } else {
        suggestions.push({
          type: 'clothing',
          text: 'Wear comfortable layered clothing suitable for high-altitude Addis Ababa weather',
          reason: `Mild temperature of ${tempC}°C expected with pleasant breeze`,
        });
      }
    }

    // Sunny / UV protection
    if (tempC >= 23 && rainProb < 20) {
      if (language === 'am') {
        suggestions.push({
          type: 'sun_protection',
          text: 'የፀሐይ መነጽር ወይም ባርኔጣ ያድርጉ፤ የፀሐይ መከላከያ ቅባት ይመረጣል',
          reason: `ሞቃት ፀሐያማ አየር (${tempC}°C) ይጠበቃል`,
        });
      } else if (language === 'om') {
        suggestions.push({
          type: 'sun_protection',
          text: 'Aduu waan jiruuf gorsa aduu fi qobbaa aduu fayyadamaa',
          reason: `Aduu cimaa fi ho\'a ${tempC}°C waan jiruuf`,
        });
      } else {
        suggestions.push({
          type: 'sun_protection',
          text: 'Wear sunglasses, a sun hat, and apply UV sunscreen',
          reason: `Warm sunny conditions (${tempC}°C) with intense high-altitude sunlight`,
        });
      }
    }

    // Fallback neutral advice if no specific condition triggered
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'clothing',
        text:
          language === 'am'
            ? 'ምቹ ልብስ ይልበሱ'
            : language === 'om'
            ? 'Wayyaa mijataa uffadhaa'
            : 'Standard comfortable travel attire is recommended',
        reason:
          language === 'am'
            ? `በመድረሻ ሰዓት ${tempC}°C እና ${arrivalForecast.condition} ይጠበቃል`
            : language === 'om'
            ? `Yeroo gahuutti ${tempC}°C fi ${arrivalForecast.condition} ta\'a`
            : `Forecast indicates ${tempC}°C and ${arrivalForecast.condition} upon arrival`,
      });
    }

    if (isBeyondHorizon) {
      suggestions.push({
        type: 'caution',
        text:
          language === 'am'
            ? 'የተጠየቀው የመድረሻ ሰዓት ከትንበያ ጊዜ በላይ በመሆኑ አጠቃላይ የአየር ጠባይ ጥቅም ላይ ውሏል'
            : language === 'om'
            ? 'Yeroon gaafatame daangaa raagichaa ol waan ta\'eef ragaa waliigalaa fayyadamneera'
            : 'Target arrival time exceeds detailed hourly forecast horizon; general destination conditions applied',
        reason: 'Arrival time is beyond 24-48 hour hourly granularity',
      });
    }

    return {
      arrivalTime: targetArrivalIso,
      forecast: {
        temperatureC: arrivalForecast.temperatureC,
        condition: arrivalForecast.condition,
        precipitationProbability: arrivalForecast.precipitationProbability,
      },
      suggestions,
      language,
      provider: weather.provider,
      retrievedAt: weather.retrievedAt,
    };
  }

  public getWmoDescription(code: number, language: SupportedLanguage = 'en'): string {
    const table: Record<number, { en: string; am: string; om: string }> = {
      0: { en: 'Clear sky', am: 'ጥርት ያለ ሰማይ', om: 'Samii qulqulluu' },
      1: { en: 'Mainly clear', am: 'በብዛት ጥርት ያለ', om: 'Irra caalaan qulqulluu' },
      2: { en: 'Partly cloudy', am: 'ከፊል ደመናማ', om: 'Dumessa walakkaa' },
      3: { en: 'Overcast', am: 'ሙሉ በሙሉ ደመናማ', om: 'Dumessa guutuu' },
      45: { en: 'Foggy', am: 'ጉም ያለበት', om: 'Hurrii qaba' },
      48: { en: 'Depositing rime fog', am: 'የበረታ ጉም', om: 'Hurrii cimaa' },
      51: { en: 'Light drizzle', am: 'ቀላል ካፊያ', om: 'Tiifii laafaa' },
      53: { en: 'Moderate drizzle', am: 'መካከለኛ ካፊያ', om: 'Tiifii giddu-galeessaa' },
      55: { en: 'Dense drizzle', am: 'ከባድ ካፊያ', om: 'Tiifii cimaa' },
      61: { en: 'Slight rain', am: 'ቀላል ዝናብ', om: 'Rooba salphaa' },
      63: { en: 'Moderate rain', am: 'መካከለኛ ዝናብ', om: 'Rooba giddu-galeessaa' },
      65: { en: 'Heavy rain', am: 'ከባድ ዝናብ', om: 'Rooba cimaa' },
      80: { en: 'Slight rain showers', am: 'ቀላል የበረታ ዝናብ', om: 'Bubbee roobaa salphaa' },
      81: { en: 'Moderate rain showers', am: 'መካከለኛ የበረታ ዝናብ', om: 'Bubbee roobaa giddu-galeessaa' },
      82: { en: 'Violent rain showers', am: 'ኃይለኛ የበረታ ዝናብ', om: 'Bubbee roobaa cimaa' },
      95: { en: 'Thunderstorm', am: 'ነጎድጓዳማ ዝናብ', om: 'Mandhee fi rooba' },
    };

    const entry = table[code];
    if (entry) {
      return entry[language] || entry.en;
    }

    if (code >= 51 && code <= 67) {
      return language === 'am' ? 'ዝናብ' : language === 'om' ? 'Rooba' : 'Rain';
    }
    if (code >= 80 && code <= 82) {
      return language === 'am' ? 'የበረታ ዝናብ' : language === 'om' ? 'Rooba cimaa' : 'Rain Showers';
    }
    if (code >= 95) {
      return language === 'am' ? 'ነጎድጓድ' : language === 'om' ? 'Mandhee' : 'Thunderstorm';
    }

    return language === 'am' ? 'ደመናማ' : language === 'om' ? 'Dumessa' : 'Cloudy';
  }

  private translateConditionText(text: string, language: SupportedLanguage): string {
    if (language === 'en') return text;
    const lower = text.toLowerCase();
    if (lower.includes('sunny') || lower.includes('clear')) {
      return language === 'am' ? 'ጥርት ያለ ፀሐይ' : 'Aduu qulqulluu';
    }
    if (lower.includes('partly cloudy')) {
      return language === 'am' ? 'ከፊል ደመናማ' : 'Dumessa walakkaa';
    }
    if (lower.includes('cloudy') || lower.includes('overcast')) {
      return language === 'am' ? 'ደመናማ' : 'Dumessa';
    }
    if (lower.includes('rain') || lower.includes('drizzle')) {
      return language === 'am' ? 'ዝናባማ' : 'Rooba';
    }
    if (lower.includes('thunder')) {
      return language === 'am' ? 'ነጎድጓዳማ ዝናብ' : 'Mandhee';
    }
    return text;
  }
}

export const weatherApiProvider = new WeatherApiProvider();


// Export alias for backwards compatibility
export const weatherProvider = weatherApiProvider;
