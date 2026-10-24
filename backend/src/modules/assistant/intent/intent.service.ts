export type SupportedLanguage = 'en' | 'am' | 'om';
export type AssistantIntent = 'PLACES' | 'WEATHER' | 'ROUTING' | 'INCIDENTS' | 'COMPOSITE';

export interface ExtractedEntities {
  coordinates?: { lat: number; lon: number };
  destination?: string;
  arrivalTime?: string;
  categories: string[];
  radiusMeters?: number;
  isCityWide?: boolean;
}

export interface IntentAnalysisResult {
  language: SupportedLanguage;
  intent: AssistantIntent;
  intents: AssistantIntent[];
  entities: ExtractedEntities;
}

interface CategoryRule {
  category: string;
  keywords: string[];
}

export class IntentService {
  // Ethiopic unicode range for Amharic
  private static readonly ETHIOPIC_REGEX = /[\u1200-\u137F\u2D80-\u2DDF\uAB00-\uAB2F]/;

  // Afaan Oromo common markers and vocabulary
  private static readonly OROMO_KEYWORDS = new Set([
    'akkam', 'nagaa', 'maal', 'eessa', 'eessatti', 'bakketti', 'buna', 'mana', 'nyaata',
    'nyaataa', 'hotelii', 'hospitaala', 'karaa', 'rooba', 'roobni', 'qilleensa', 'fagoo',
    'dhihoo', 'dhihootti', 'akkamitti', 'jira', 'jiraa', 'jirtu', 'itti', 'waan', 'guyyaa',
    'galatoomi', 'barbaada', 'barbaaddi', 'barbaadii', 'tiraafika', 'cufame', 'cufama',
    'balaa', 'baasii', 'baabura', 'qoricha', 'qorichi', 'garaajii', "boba'aa", "ho'a", 'qorra',
    'tilmaama', 'finfinnee', 'gatiin', 'gatii', 'kutaa', 'meeqa', "sa'aatii", "har'a",
    'keessatti', 'booda', 'kaaffee', 'natti', 'himi', 'isaa', 'argadha', 'argachuu',
    'dhaquu', 'danda', "danda'a", 'boolee', 'piyaassaatti', 'saarbeet', 'gurguramu'
  ]);

  private static readonly CATEGORY_RULES: CategoryRule[] = [
    {
      category: 'cafe',
      keywords: ['cafe', 'coffee', 'buna', 'macchiato', 'tea', 'ካፌ', 'ቡና', 'ሻይ', 'kaaffee', 'buna'],
    },
    {
      category: 'hotel',
      keywords: ['hotel', 'hotels', 'lodging', 'motel', 'stay', 'accommodation', 'ሆቴል', 'የእንግዳ ማረፊያ', 'hotelii', 'mana boqonnaa'],
    },
    {
      category: 'restaurant',
      keywords: ['restaurant', 'food', 'eat', 'dinner', 'lunch', 'breakfast', 'ምግብ ቤት', 'ምግብ', 'ሬስቶራንት', 'መብላት', 'mana nyaataa', 'nyaata', 'nyaachuu'],
    },
    {
      category: 'hospital',
      keywords: ['hospital', 'clinic', 'emergency', 'doctor', 'health', 'ሆስፒታል', 'ክሊኒክ', 'ህክምና', 'ዶክተር', 'hospitaala', 'kiliniikii', 'fayyaa'],
    },
    {
      category: 'pharmacy',
      keywords: ['pharmacy', 'chemist', 'drugstore', 'medicine', 'ፋርማሲ', 'መድሃኒት ቤት', 'መድሃኒት', 'qoricha', 'qorichi', 'mana qorichaa'],
    },
    {
      category: 'mechanic',
      keywords: ['mechanic', 'garage', 'car repair', 'puncture', 'መካኒክ', 'ጋራጅ', 'መኪና ጥገና', 'makaanika', 'garaajii'],
    },
    {
      category: 'fuel',
      keywords: ['fuel', 'gas', 'gas station', 'petrol', 'diesel', 'ነዳጅ', 'ነዳጅ ማደያ', 'ቤንዚን', 'boba\'aa', 'mana boba\'aa'],
    },
    {
      category: 'bank',
      keywords: ['bank', 'atm', 'cash', 'ባንክ', 'ኤቲኤም', 'baankii'],
    },
    {
      category: 'park',
      keywords: ['park', 'garden', 'green space', 'botanical', 'nature', 'recreation', 'ፓርክ', 'መናፈሻ', 'የተፈጥሮ ፓርክ', 'iddoo bashannanaa', 'paarkii'],
    },
    {
      category: 'leisure',
      keywords: [
        'relax', 'relaxation', 'chill', 'hangout', 'hang out', 'leisure', 'resort', 'spa', 'unwind', 'weekend',
        'መዝናናት', 'መዝናኛ', 'ተዝናኖት', 'እረፍት', 'መዝናኛ ቦታ', 'ማረፊያ', 'bashannana', 'boqonnaa'
      ],
    },
    {
      category: 'attraction',
      keywords: [
        'attraction', 'museum', 'monument', 'memorial', 'sightseeing', 'viewpoint', 'view', 'culture', 'heritage',
        'square', 'ሙዚየም', 'ቤተ-መዘክር', 'ታሪክ', 'ባህል', 'ሀውልት', 'አደባባይ', 'muziyeemii', 'siidaa'
      ],
    },
  ];

  private static readonly WEATHER_KEYWORDS = [
    'weather', 'rain', 'raining', 'forecast', 'temperature', 'umbrella', 'climate', 'sun', 'sunny', 'cloud', 'cloudy', 'cold', 'hot',
    'አየር', 'የአየር ሁኔታ', 'ዝናብ', 'ሙቀት', 'ብርድ', 'ጃንጥላ', 'ትንበያ',
    'qilleensa', 'rooba', 'roobni', 'roobuu', 'ho\'a', 'qorra', 'dambalii', 'tilmaama'
  ];

  private static readonly ROUTING_KEYWORDS = [
    'route', 'routes', 'direction', 'directions', 'how to get', 'how to go', 'transit', 'bus', 'train', 'metro', 'taxi', 'drive to',
    'መንገድ', 'አቅጣጫ', 'እንዴት መሄድ', 'መጓጓዣ', 'አውቶቡስ', 'ባቡር', 'ታክሲ',
    'karaa', 'kallattii', 'akkamitti dhaquu', 'baasii', 'baabura', 'taaksii'
  ];

  private static readonly INCIDENT_KEYWORDS = [
    'accident', 'traffic', 'jam', 'congestion', 'road closure', 'blocked', 'closed', 'flood', 'flooding', 'landslide',
    'አደጋ', 'የትራፊክ', 'መጨናነቅ', 'መንገድ ተዘግቷል', 'ዝግ', 'ጎርፍ',
    'balaa', 'tiraafika', 'cufame', 'cufama', 'karaan cufame', 'wal-xaxaa', 'lolaa'
  ];

  private static readonly KNOWN_DESTINATIONS: Record<string, string> = {
    'arat kilo': 'Arat Kilo',
    '4 kilo': 'Arat Kilo',
    'አራት ኪሎ': 'Arat Kilo',
    'sidist kilo': 'Sidist Kilo',
    '6 kilo': 'Sidist Kilo',
    'ስድስት ኪሎ': 'Sidist Kilo',
    'merkato': 'Mercato',
    'mercato': 'Mercato',
    'መርካቶ': 'Mercato',
    'bole': 'Bole',
    'boolee': 'Bole',
    'ቦሌ': 'Bole',
    'piazza': 'Piazza',
    'piassa': 'Piazza',
    'piyaassaa': 'Piazza',
    'piyaassaatti': 'Piazza',
    'ፒያሳ': 'Piazza',
    'kazanchis': 'Kazanchis',
    'kaazaančiis': 'Kazanchis',
    'kaazaančiisitti': 'Kazanchis',
    'ካዛንቺስ': 'Kazanchis',
    'sarbet': 'Sarbet',
    'saarbeet': 'Sarbet',
    'ሳርቤት': 'Sarbet',
    'megenagna': 'Megenagna',
    'maganaanyaa': 'Megenagna',
    'መገናኛ': 'Megenagna',
    'mexico': 'Mexico',
    'meeksikoo': 'Mexico',
    'ሜክሲኮ': 'Mexico',
    'churchill': 'Churchill Road',
    'ቸርችል': 'Churchill Road',
    'gotera': 'Gotera',
    'ጎተራ': 'Gotera',
    'kality': 'Kality',
    'qaallittii': 'Kality',
    'ቃሊቲ': 'Kality',
    'ayat': 'Ayat',
    'ayaat': 'Ayat',
    'አያት': 'Ayat',
    'cmc': 'CMC',
    'ሲኤምሲ': 'CMC',
  };

  /**
   * Detects user query language (English, Amharic, or Afaan Oromo).
   */
  public detectLanguage(query: string, preferredLanguage?: SupportedLanguage): SupportedLanguage {
    if (preferredLanguage && ['en', 'am', 'om'].includes(preferredLanguage)) {
      return preferredLanguage;
    }

    if (!query || !query.trim()) {
      return 'en';
    }

    // 1. Amharic (Ethiopic characters)
    if (IntentService.ETHIOPIC_REGEX.test(query)) {
      return 'am';
    }

    // 2. Afaan Oromo (Latin tokens matching Oromo keywords/vocabulary)
    const tokens = query
      .toLowerCase()
      .replace(/[^a-z'\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    for (const token of tokens) {
      if (IntentService.OROMO_KEYWORDS.has(token)) {
        return 'om';
      }
    }

    // Default to English
    return 'en';
  }

  /**
   * Classifies user intent and extracts entities.
   */
  public analyze(
    query: string,
    preferredLanguage?: SupportedLanguage,
    location?: { lat: number; lon: number },
    arrivalTime?: string
  ): IntentAnalysisResult {
    const language = this.detectLanguage(query, preferredLanguage);
    const lowerQuery = query.toLowerCase();

    // 1. Extract categories
    const categories: string[] = [];
    for (const rule of IntentService.CATEGORY_RULES) {
      if (
        rule.keywords.some((kw) => {
          const lowerKw = kw.toLowerCase();
          // For short Latin words (<= 5 chars), require word boundary to avoid false positives (e.g. "chill" in "Churchill")
          if (/^[a-z]+$/.test(lowerKw) && lowerKw.length <= 5) {
            const regex = new RegExp(`\\b${lowerKw}\\b`, 'i');
            return regex.test(lowerQuery);
          }
          return lowerQuery.includes(lowerKw);
        })
      ) {
        categories.push(rule.category);
      }
    }

    // Leisure queries ("place to relax", "hang out") inherently include parks, cafes, and restaurants
    if (categories.includes('leisure')) {
      if (!categories.includes('park')) categories.push('park');
      if (!categories.includes('cafe')) categories.push('cafe');
      if (!categories.includes('restaurant')) categories.push('restaurant');
    }

    // Check for city-wide / anywhere intent (flexible search across Addis Ababa)
    const cityWideKeywords = [
      'anywhere', 'everywhere', 'in the city', 'across the city', 'across addis',
      'around addis', 'in addis', 'in addis ababa', 'best places', 'top places',
      'any good place', 'somewhere', 'any place', 'recommend a place', 'suggest a place',
      'የትም', 'አዲስ አበባ ውስጥ', 'በከተማው', 'ከተማ ውስጥ', 'የትም ቦታ',
      'bakka kamiyyuu', 'finfinnee keessatti', 'magaalaa keessatti'
    ];
    const isCityWide = cityWideKeywords.some((kw) => lowerQuery.includes(kw));

    // 2. Extract destination
    let destination: string | undefined;
    for (const [key, normalized] of Object.entries(IntentService.KNOWN_DESTINATIONS)) {
      if (lowerQuery.includes(key.toLowerCase())) {
        destination = normalized;
        break;
      }
    }

    // 3. Detect intent components
    const detectedIntents: AssistantIntent[] = [];

    const hasPlaces =
      categories.length > 0 ||
      lowerQuery.includes('place') ||
      lowerQuery.includes('near') ||
      lowerQuery.includes('relax') ||
      lowerQuery.includes('visit') ||
      lowerQuery.includes('መዝናኛ') ||
      lowerQuery.includes('መሄድ') ||
      lowerQuery.includes('አጠገብ') ||
      lowerQuery.includes('አካባቢ') ||
      lowerQuery.includes('dhihoo') ||
      lowerQuery.includes('bakketti') ||
      Boolean(location);

    const hasWeather =
      IntentService.WEATHER_KEYWORDS.some((kw) => lowerQuery.includes(kw.toLowerCase())) ||
      Boolean(arrivalTime);

    const hasRouting =
      IntentService.ROUTING_KEYWORDS.some((kw) => lowerQuery.includes(kw.toLowerCase()));

    const hasIncidents =
      IntentService.INCIDENT_KEYWORDS.some((kw) => lowerQuery.includes(kw.toLowerCase()));

    if (hasPlaces) detectedIntents.push('PLACES');
    if (hasWeather) detectedIntents.push('WEATHER');
    if (hasRouting) detectedIntents.push('ROUTING');
    if (hasIncidents) detectedIntents.push('INCIDENTS');

    // 4. Primary intent classification
    let intent: AssistantIntent;
    if (detectedIntents.length > 1) {
      intent = 'COMPOSITE';
    } else if (detectedIntents.length === 1) {
      intent = detectedIntents[0];
    } else {
      intent = location ? 'PLACES' : 'PLACES';
      detectedIntents.push(intent);
    }

    return {
      language,
      intent,
      intents: detectedIntents,
      entities: {
        coordinates: location,
        destination,
        arrivalTime,
        categories: Array.from(new Set(categories)),
        radiusMeters: isCityWide ? 15000 : 3000,
        isCityWide,
      },
    };
  }
}

export const intentService = new IntentService();

export function detectLanguage(query: string, preferredLanguage?: SupportedLanguage): SupportedLanguage {
  return intentService.detectLanguage(query, preferredLanguage);
}

export function detectIntent(
  query: string,
  preferredLanguage?: SupportedLanguage,
  location?: { lat: number; lon: number },
  arrivalTime?: string
): IntentAnalysisResult {
  return intentService.analyze(query, preferredLanguage, location, arrivalTime);
}
