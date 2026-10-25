import { SupportedLanguage } from '../../assistant/dto/assistant-query.dto.js';
import {
  WeatherResultItem,
  WeatherSuggestion,
  WeatherHourlyForecast,
  WeatherForecastDay,
} from '../../assistant/dto/assistant-response.dto.js';

export interface OpenMeteoCurrentResponse {
  time: string;
  temperature_2m: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface OpenMeteoHourlyResponse {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
}

export interface OpenMeteoApiResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: OpenMeteoCurrentResponse;
  hourly?: OpenMeteoHourlyResponse;
}

export class WeatherProvider {
  private baseUrl: string;

  constructor() {
    const rawUrl = process.env.WEATHER_URL || 'https://api.open-meteo.com/v1/forecast';
    // Normalize URL: open-meteo.com homepage resolves to API forecast endpoint
    if (rawUrl.includes('open-meteo.com') && !rawUrl.includes('/v1/forecast')) {
      this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
    } else {
      this.baseUrl = rawUrl;
    }
  }

  /**
   * Maps WMO weather interpretation codes to human-readable condition text.
   */
  public getConditionDescription(code: number, language: SupportedLanguage = 'en'): string {
    const conditions: Record<number, { en: string; am: string; om: string }> = {
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
      71: { en: 'Slight snow', am: 'ቀላል በረዶ', om: 'Cabiitii salphaa' },
      73: { en: 'Moderate snow', am: 'መካከለኛ በረዶ', om: 'Cabiitii giddu-galeessaa' },
      75: { en: 'Heavy snow', am: 'ከባድ በረዶ', om: 'Cabiitii cimaa' },
      80: { en: 'Slight rain showers', am: 'ቀላል የበረታ ዝናብ', om: 'Bubbee roobaa salphaa' },
      81: { en: 'Moderate rain showers', am: 'መካከለኛ የበረታ ዝናብ', om: 'Bubbee roobaa giddu-galeessaa' },
      82: { en: 'Violent rain showers', am: 'ኃይለኛ የበረታ ዝናብ', om: 'Bubbee roobaa cimaa' },
      95: { en: 'Thunderstorm', am: 'ነጎድጓዳማ ዝናብ', om: 'Mandhee fi rooba' },
      96: { en: 'Thunderstorm with slight hail', am: 'ነጎድጓድ ከበረዶ ጋር', om: 'Mandhee cabiitii wajjin' },
      99: { en: 'Thunderstorm with heavy hail', am: 'ኃይለኛ ነጎድጓድ ከከባድ በረዶ ጋር', om: 'Mandhee cimaa cabiitii wajjin' },
    };

    const entry = conditions[code];
    if (entry) {
      return (entry as Record<string, string>)[language] || entry.en;
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

  /**
   * Fetches weather forecast and builds destination arrival advice.
   */
  public async getForecast(
    location: { lat: number; lon: number },
    arrivalTime?: string,
    language: SupportedLanguage = 'en'
  ): Promise<WeatherResultItem> {
    const lat = location.lat;
    const lon = location.lon;
    const nowIso = new Date().toISOString();

    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set(
      'hourly',
      'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m'
    );
    url.searchParams.set(
      'current',
      'temperature_2m,precipitation,weather_code,wind_speed_10m'
    );
    url.searchParams.set('timezone', 'Africa/Addis_Ababa');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Weather API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as OpenMeteoApiResponse;

      // 1. Current Weather
      const currentTemp = data.current ? Math.round(data.current.temperature_2m) : 20;
      const currentCode = data.current?.weather_code ?? 2;
      const currentCondition = this.getConditionDescription(currentCode, language);
      const currentPrecip = data.current?.precipitation ?? 0;
      const currentWind = data.current ? Math.round(data.current.wind_speed_10m) : 10;

      // 2. Identify Target Arrival Hour
      const targetArrivalIso = arrivalTime || new Date(Date.now() + 90 * 60 * 1000).toISOString();
      const targetTimestamp = Date.parse(targetArrivalIso);

      let arrivalIdx = 0;
      let minDiff = Infinity;

      if (data.hourly && data.hourly.time && data.hourly.time.length > 0) {
        for (let i = 0; i < data.hourly.time.length; i++) {
          const hourTimeStr = data.hourly.time[i];
          // Local Addis Ababa time format: "YYYY-MM-DDTHH:00" -> UTC+3
          const hourTimestamp = Date.parse(`${hourTimeStr}:00+03:00`);
          const diff = Math.abs(hourTimestamp - targetTimestamp);
          if (diff < minDiff) {
            minDiff = diff;
            arrivalIdx = i;
          }
        }
      }

      const arrivalHour = data.hourly?.time?.[arrivalIdx]
        ? `${data.hourly.time[arrivalIdx]}:00+03:00`
        : targetArrivalIso;

      const arrivalTemp = data.hourly?.temperature_2m?.[arrivalIdx] !== undefined
        ? Math.round(data.hourly.temperature_2m[arrivalIdx])
        : currentTemp;

      const arrivalPrecipProb = data.hourly?.precipitation_probability?.[arrivalIdx] ?? 0;
      const arrivalPrecipMm = data.hourly?.precipitation?.[arrivalIdx] ?? 0;
      const arrivalCode = data.hourly?.weather_code?.[arrivalIdx] ?? currentCode;
      const arrivalCondition = this.getConditionDescription(arrivalCode, language);
      const arrivalWind = data.hourly?.wind_speed_10m?.[arrivalIdx] !== undefined
        ? Math.round(data.hourly.wind_speed_10m[arrivalIdx])
        : currentWind;

      // 3. Generate Intelligent Gear & Clothing Advice Compatible with Forecast
      const suggestions = this.generateCompatibilitySuggestions(
        arrivalTemp,
        arrivalPrecipProb,
        arrivalPrecipMm,
        arrivalCode,
        arrivalWind,
        language
      );

      // 4. Build Forecast Days (Sample next 24 hours)
      const hourlyForecasts: WeatherHourlyForecast[] = [];
      if (data.hourly && data.hourly.time) {
        const sampleCount = Math.min(24, data.hourly.time.length);
        for (let i = 0; i < sampleCount; i++) {
          hourlyForecasts.push({
            time: `${data.hourly.time[i]}:00+03:00`,
            temperatureC: Math.round(data.hourly.temperature_2m[i]),
            condition: this.getConditionDescription(data.hourly.weather_code[i], language),
            precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
          });
        }
      }

      const forecastDays: WeatherForecastDay[] = [
        {
          date: targetArrivalIso.split('T')[0],
          hourly: hourlyForecasts,
        },
      ];

      return {
        location: { lat, lon },
        current: {
          temperatureC: currentTemp,
          condition: currentCondition,
          precipitationMm: currentPrecip,
          windKph: currentWind,
        },
        forecast: forecastDays,
        arrivalAdvice: {
          arrivalTime: targetArrivalIso,
          suggestions,
        },
        provider: 'weatherapi',
        retrievedAt: nowIso,
        cached: false,
      };
    } catch (err: any) {
      console.warn('[WeatherProvider] Live weather lookup fallback:', err?.message);
      // Fallback graceful Addis Ababa forecast
      return this.buildFallbackForecast(lat, lon, arrivalTime, language);
    }
  }

  /**
   * Generates actionable advice based on forecasted temperature, rain probability, and weather codes.
   */
  private generateCompatibilitySuggestions(
    tempC: number,
    precipProb: number,
    precipMm: number,
    code: number,
    windKph: number,
    lang: SupportedLanguage
  ): WeatherSuggestion[] {
    const suggestions: WeatherSuggestion[] = [];
    const isRainy = precipProb >= 35 || precipMm > 0.1 || (code >= 51 && code <= 82) || code >= 95;

    // 1. Rain & Umbrella Advice
    if (isRainy) {
      if (lang === 'am') {
        suggestions.push({
          type: 'umbrella',
          text: 'ዣንጥላ ይያዙ እና የውሃ መከላከያ ጫማ ወይም ጃኬት ይልበሱ',
          reason: `በመድረሻ ሰዓትዎ ${precipProb}% የዝናብ ዕድል (${precipMm} mm) ይጠበቃል`,
        });
      } else if (lang === 'om') {
        suggestions.push({
          type: 'umbrella',
          text: 'Gaaddisaa (dambalii) qabadhaa fi wayyaa roobaa uffadhaa',
          reason: `Yeroo gahuutti carraan roobaa %${precipProb} eegama`,
        });
      } else {
        suggestions.push({
          type: 'umbrella',
          text: 'Carry an umbrella and wear waterproof outerwear or shoes',
          reason: `${precipProb}% chance of rain (${precipMm} mm) forecasted around arrival time`,
        });
      }
    }

    // 2. Cold / Temperature Advice
    if (tempC <= 15) {
      if (lang === 'am') {
        suggestions.push({
          type: 'clothing',
          text: 'ብርድ ስለሚሆን ሞቅ ያለ ልብስ (ሹራብ ወይም ጃኬት) ይልበሱ',
          reason: `በመድረሻ ሰዓት የሚጠበቀው የሙቀት መጠን ${tempC}°C ነው`,
        });
      } else if (lang === 'om') {
        suggestions.push({
          type: 'clothing',
          text: 'Qorra waan ta\'eef wayyaa ho\'aa (jaakkeettii) uffadhaa',
          reason: `Ho\'i qilleensaa yeroo gahuutti ${tempC}°C ta\'a`,
        });
      } else {
        suggestions.push({
          type: 'clothing',
          text: 'Dress warmly in layers (warm sweater or jacket recommended)',
          reason: `Cool temperature of ${tempC}°C expected at destination upon arrival`,
        });
      }
    } else if (tempC >= 16 && tempC <= 21 && !isRainy) {
      if (lang === 'am') {
        suggestions.push({
          type: 'clothing',
          text: 'መካከለኛ የአየር ሁኔታ ስለሆነ ቀለል ያለ ጃኬት ወይም ሸሚዝ ይመረጣል',
          reason: `የሙቀት መጠኑ ${tempC}°C አካባቢ ነው`,
        });
      } else if (lang === 'om') {
        suggestions.push({
          type: 'clothing',
          text: 'Qilleensi madaalawaa waan ta\'eef wayyaa salphaa uffadhaa',
          reason: `Ho\'i qilleensaa ${tempC}°C dha`,
        });
      } else {
        suggestions.push({
          type: 'clothing',
          text: 'Wear comfortable layered clothing suitable for mild high-altitude weather',
          reason: `Mild temperature of ${tempC}°C expected with light breeze`,
        });
      }
    }

    // 3. Sun & High UV Advice
    if (tempC >= 23 && (code === 0 || code === 1)) {
      if (lang === 'am') {
        suggestions.push({
          type: 'sun_protection',
          text: 'የፀሐይ መነጽር ወይም ባርኔጣ ያድርጉ፤ የፀሐይ መከላከያ ቅባት ይመረጣል',
          reason: `ከፍተኛ የፀሐይ ጨረር ያለበት ሞቃት አየር (${tempC}°C) ይጠበቃል`,
        });
      } else if (lang === 'om') {
        suggestions.push({
          type: 'sun_protection',
          text: 'Aduu waan jiruuf gorsa aduu fi qobbaa aduu fayyadamaa',
          reason: `Aduu cimaa fi ho\'a ${tempC}°C waan jiruuf`,
        });
      } else {
        suggestions.push({
          type: 'sun_protection',
          text: 'Wear sunglasses, a sun hat, and apply UV sunscreen',
          reason: `Warm sunny conditions (${tempC}°C) with intense high-altitude sunlight in Addis Ababa`,
        });
      }
    }

    // 4. Wind & Thunderstorm Cautions
    if (windKph >= 22 || code >= 95) {
      if (lang === 'am') {
        suggestions.push({
          type: 'caution',
          text: 'ኃይለኛ ነፋስ ወይም ነጎድጓድ ስላለ ከቤት ውጭ ሲንቀሳቀሱ ጥንቃቄ ያድርጉ',
          reason: `የነፋስ ፍጥነት ${windKph} km/h ደርሷል`,
        });
      } else if (lang === 'om') {
        suggestions.push({
          type: 'caution',
          text: 'Qilleensi cimaa fi mandheen waan jiruuf of eeggannoo cimaa godhaa',
          reason: `Saffisi qilleensaa km/h ${windKph} dha`,
        });
      } else {
        suggestions.push({
          type: 'caution',
          text: 'Gusty winds or thunderstorm activity expected; plan for sheltered transit',
          reason: `Wind speeds of ${windKph} km/h and convective weather forecasted`,
        });
      }
    }

    return suggestions;
  }

  /**
   * Fallback forecast if live API is temporarily unreachable.
   */
  private buildFallbackForecast(
    lat: number,
    lon: number,
    arrivalTime?: string,
    lang: SupportedLanguage = 'en'
  ): WeatherResultItem {
    const targetArrivalIso = arrivalTime || new Date(Date.now() + 90 * 60 * 1000).toISOString();
    return {
      location: { lat, lon },
      current: {
        temperatureC: 19,
        condition: this.getConditionDescription(2, lang),
        precipitationMm: 0,
        windKph: 8,
      },
      forecast: [
        {
          date: targetArrivalIso.split('T')[0],
          hourly: [
            {
              time: targetArrivalIso,
              temperatureC: 18,
              condition: this.getConditionDescription(2, lang),
              precipitationProbability: 25,
            },
          ],
        },
      ],
      arrivalAdvice: {
        arrivalTime: targetArrivalIso,
        suggestions: [
          {
            type: 'clothing',
            text: lang === 'am' ? 'ቀለል ያለ ጃኬት ይልበሱ' : lang === 'om' ? 'Jaakkeettii salphaa uffadhaa' : 'Carry a light jacket for the cool evening',
            reason: lang === 'am' ? 'የአዲስ አበባ ምሽት ቀዝቀዝ ያለ ነው' : lang === 'om' ? 'Qilleensi Finfinnee galgala qorra' : 'Typical cool high-altitude Addis Ababa conditions',
          },
        ],
      },
      provider: 'weatherapi',
      retrievedAt: new Date().toISOString(),
      cached: false,
    };
  }
}

export const weatherProvider = new WeatherProvider();
