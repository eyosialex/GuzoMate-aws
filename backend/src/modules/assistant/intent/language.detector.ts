import { SupportedLanguage } from '../dto/assistant-query.dto.js';

export class LanguageDetector {
  // Ethiopic unicode blocks (Amharic, Ge'ez script)
  private static readonly ETHIOPIC_REGEX = /[\u1200-\u137F\u2D80-\u2DDF\uAB00-\uAB2F]/;

  // Afaan Oromo common markers and vocabulary
  private static readonly OROMO_KEYWORDS = new Set([
    'akkam', 'nagaa', 'maal', 'eessa', 'eessatti', 'buna', 'mana', 'nyaata',
    'nyaataa', 'hotelii', 'hospitaala', 'karaa', 'rooba', 'roobni', 'qilleensa', 'fagoo',
    'dhihoo', 'dhihootti', 'akkamitti', 'jira', 'jiraa', 'jirtu', 'itti', 'waan', 'guyyaa',
    'galatoomi', 'barbaada', 'barbaaddi', 'barbaadii', 'tiraafika', 'cufame', 'cufama',
    'balaa', 'baasii', 'baabura', 'qoricha', 'garaajii', "boba'aa", "ho'a", 'qorra',
    'tilmaama', 'finfinnee', 'gatiin', 'gatii', 'kutaa', 'meeqa', "sa'aatii", "har'a",
    'keessatti', 'booda', 'kaaffee', 'natti', 'himi', 'isaa', 'argadha', 'argachuu',
    'dhaquu', 'danda', "danda'a", 'boolee', 'piyaassaatti', 'saarbeet'
  ]);

  /**
   * Resolves language: explicit preference takes precedence; otherwise detects from text.
   */
  public static resolveLanguage(query: string, preferredLanguage?: SupportedLanguage): SupportedLanguage {
    if (preferredLanguage && ['en', 'am', 'om'].includes(preferredLanguage)) {
      return preferredLanguage;
    }

    return this.detectLanguage(query);
  }

  /**
   * Detects language from query text.
   */
  public static detectLanguage(text: string): SupportedLanguage {
    if (!text || !text.trim()) {
      return 'en';
    }

    // 1. Check for Ethiopic script (Amharic)
    if (this.ETHIOPIC_REGEX.test(text)) {
      return 'am';
    }

    // 2. Tokenize lower-case words for Latin-based Afaan Oromo detection
    const words = text
      .toLowerCase()
      .replace(/[^a-z'\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    let oromoWordMatches = 0;
    for (const word of words) {
      if (this.OROMO_KEYWORDS.has(word)) {
        oromoWordMatches++;
      }
    }

    // If at least one distinct Oromo marker/keyword matches, classify as 'om'
    if (oromoWordMatches > 0) {
      return 'om';
    }

    // Default to English
    return 'en';
  }
}
