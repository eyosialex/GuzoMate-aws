import { AssistantQueryDto } from '../dto/assistant-query.dto.js';
import { IntentType, ParsedIntent } from './intent.types.js';
import { LanguageDetector } from './language.detector.js';

interface CategoryRule {
  category: string;
  keywords: string[];
}

export class IntentClassifier {
  private static readonly CATEGORY_RULES: CategoryRule[] = [
    {
      category: 'hotel',
      keywords: ['hotel', 'hotels', 'lodging', 'motel', 'stay', 'accommodation', 'ሆቴል', 'የእንግዳ ማረፊያ', 'hotelii', 'mana boqonnaa'],
    },
    {
      category: 'restaurant',
      keywords: ['restaurant', 'food', 'eat', 'dinner', 'lunch', 'breakfast', 'ምግብ ቤት', 'ምግብ', 'ሬስቶራንት', 'መብላት', 'mana nyaataa', 'nyaata', 'nyaachuu'],
    },
    {
      category: 'cafe',
      keywords: ['cafe', 'coffee', 'buna', 'macchiato', 'tea', 'ካፌ', 'ቡና', 'ሻይ', 'kaaffee', 'buna'],
    },
    {
      category: 'hospital',
      keywords: ['hospital', 'clinic', 'emergency', 'doctor', 'health', 'ሆስፒታል', 'ክሊኒክ', 'ህክምና', 'ዶክተር', 'hospitaala', 'kiliniikii', 'fayyaa'],
    },
    {
      category: 'pharmacy',
      keywords: ['pharmacy', 'chemist', 'drugstore', 'medicine', 'ፋርማሲ', 'መድሃኒት ቤት', 'መድሃኒት', 'qoricha', 'mana qorichaa'],
    },
    {
      category: 'mechanic',
      keywords: ['mechanic', 'garage', 'car repair', 'puncture', 'መካኒክ', 'ጋራጅ', 'መኪና ጥገና', 'ጎማ', 'makaanika', 'garaajii', 'suphaa konkolaataa'],
    },
    {
      category: 'fuel',
      keywords: ['fuel', 'gas', 'gas station', 'petrol', 'diesel', 'ነዳጅ', 'ነዳጅ ማደያ', 'ቤንዚን', 'ናፍጣ', 'boba\'aa', 'mana boba\'aa', 'beenzina'],
    },
    {
      category: 'bank',
      keywords: ['bank', 'atm', 'cash', 'cbe', 'ባንክ', 'ኤቲኤም', 'baankii', 'maallaqa'],
    },
  ];

  private static readonly WEATHER_KEYWORDS = [
    'weather', 'rain', 'raining', 'forecast', 'temperature', 'umbrella', 'climate', 'sun', 'sunny', 'cloud', 'cloudy', 'cold', 'hot',
    'አየር', 'የአየር ሁኔታ', 'ዝናብ', 'ሙቀት', 'ብርድ', 'ጃንጥላ', 'ትንበያ',
    'qilleensa', 'rooba', 'roobuu', 'ho\'a', 'qorra', 'dambalii', 'tilmaama', 'muuziqaa'
  ];

  private static readonly INCIDENT_KEYWORDS = [
    'accident', 'traffic', 'jam', 'congestion', 'road closure', 'blocked', 'closed', 'flood', 'flooding', 'landslide', 'danger', 'hazard',
    'አደጋ', 'የትራፊክ', 'መጨናነቅ', 'መንገድ ተዘግቷል', 'ዝግ', 'ጎርፍ', 'የመሬት መንሸራተት',
    'balaa', 'tiraafika', 'cufame', 'karaan cufame', 'wal-xaxaa', 'lolaa', 'rakkoo'
  ];

  private static readonly ROUTING_KEYWORDS = [
    'route', 'routes', 'direction', 'directions', 'how to get', 'how to go', 'transit', 'bus', 'train', 'metro', 'taxi', 'drive to',
    'መንገድ', 'አቅጣጫ', 'እንዴት መሄድ', 'መጓጓዣ', 'አውቶቡስ', 'ባቡር', 'ታክሲ',
    'karaa', 'kallattii', 'akkamitti dhaquu', 'baasii', 'baabura', 'taaksii'
  ];

  private static readonly KNOWN_LOCATIONS = [
    'bole', 'piazza', 'piassa', 'kazanchis', 'sarbet', 'megenagna', 'mexico', '4 kilo', 'arat kilo', '6 kilo',
    'sidist kilo', 'mercato', 'merkato', 'gotera', 'gerji', 'cmc', 'ayat', 'tor hailoch', 'lebu', 'kality',
    'ቦሌ', 'ፒያሳ', 'ካዛንቺስ', 'ሳርቤት', 'መገናኛ', 'ሜክሲኮ', 'አራት ኪሎ', 'ስድስት ኪሎ', 'መርካቶ', 'ጎተራ', 'ገርጂ', 'ሲኤምሲ', 'አያት'
  ];

  /**
   * Parses user request query and extracts intent flags, categories, and constraints.
   */
  public static classify(input: AssistantQueryDto): ParsedIntent {
    const rawQuery = input.query.toLowerCase();
    const language = LanguageDetector.resolveLanguage(input.query, input.language);

    // 1. Detect requested categories
    const categories: string[] = [];
    if (input.filters?.categories && input.filters.categories.length > 0) {
      categories.push(...input.filters.categories);
    } else {
      for (const rule of this.CATEGORY_RULES) {
        if (rule.keywords.some((kw) => rawQuery.includes(kw.toLowerCase()))) {
          categories.push(rule.category);
        }
      }
    }

    // 2. Detect intents
    const intents: IntentType[] = [];
    const hasPlaces = categories.length > 0 || rawQuery.includes('place') || rawQuery.includes('near') || rawQuery.includes('አጠገብ') || rawQuery.includes('dhihoo');
    const hasWeather = this.WEATHER_KEYWORDS.some((kw) => rawQuery.includes(kw.toLowerCase())) || Boolean(input.arrivalTime);
    const hasIncidents = this.INCIDENT_KEYWORDS.some((kw) => rawQuery.includes(kw.toLowerCase()));
    const hasRoutes = this.ROUTING_KEYWORDS.some((kw) => rawQuery.includes(kw.toLowerCase()));

    if (hasPlaces) intents.push('nearby_places');
    if (hasWeather) intents.push('weather');
    if (hasIncidents) intents.push('incidents');
    if (hasRoutes) intents.push('routes');

    // 3. Detect known location keywords
    let locationKeyword: string | undefined;
    for (const loc of this.KNOWN_LOCATIONS) {
      if (rawQuery.includes(loc.toLowerCase())) {
        locationKeyword = loc;
        break;
      }
    }

    // 4. Determine primary intent and need flags
    let primaryIntent: IntentType = 'travel_advice';
    if (intents.length > 1) {
      primaryIntent = 'mixed';
    } else if (intents.length === 1) {
      primaryIntent = intents[0];
    } else {
      // Default to places if coordinates are given, otherwise general travel advice
      if (input.location) {
        primaryIntent = 'nearby_places';
        intents.push('nearby_places');
      } else {
        primaryIntent = 'travel_advice';
        intents.push('travel_advice');
      }
    }

    return {
      primaryIntent,
      intents,
      language,
      categories: Array.from(new Set(categories)),
      locationKeyword,
      arrivalTime: input.arrivalTime,
      radiusMeters: input.filters?.radiusMeters ?? 3000,
      needsPlaces: intents.includes('nearby_places') || Boolean(input.location),
      needsWeather: intents.includes('weather') || Boolean(input.arrivalTime),
      needsIncidents: intents.includes('incidents'),
      needsRoutes: intents.includes('routes'),
      needsKnowledge: primaryIntent === 'travel_advice' || primaryIntent === 'mixed' || categories.length === 0,
    };
  }
}
