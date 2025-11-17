// @ts-nocheck

// Country-specific translations loader
import { convertToTraditional } from '../chineseConverter';

import countriesEn from './countries.en.json';
import countriesFr from './countries.fr.json';
import countriesDe from './countries.de.json';
import countriesEs from './countries.es.json';
import countriesZh from './countries.zh.json';
import countriesMs from './countries.ms.json';
import countriesTh from './countries.th.json';
import countriesVi from './countries.vi.json';
import countriesKo from './countries.ko.json';
import countriesJa from './countries.ja.json';

// Lazy conversion cache for Traditional Chinese variants
let zhTWCache = null;
const zhHKCache = null;

// Safe conversion wrapper to prevent crashes during initialization
const safeConvertToTraditional = (source, variant) => {
  try {
    return convertToTraditional(source, variant);
  } catch (error) {
    console.error(`Error converting to ${variant}:`, error);
    // Return source as fallback to prevent crash
    return source;
  }
};

const countryTranslations = {
  en: countriesEn,
  'zh-CN': countriesZh,
  // Lazy getter for Traditional Chinese - convert on first access
  get 'zh-TW'() {
    if (!zhTWCache) {
      zhTWCache = safeConvertToTraditional(countriesZh, 'zh-TW');
    }
    return zhTWCache;
  },
  fr: countriesFr,
  de: countriesDe,
  es: countriesEs,
  ms: countriesMs,
  th: countriesTh,
  vi: countriesVi,
  ko: countriesKo,
  ja: countriesJa,
  // Add fallback for legacy 'zh' - use Traditional
  get 'zh'() {
    if (!zhTWCache) {
      zhTWCache = safeConvertToTraditional(countriesZh, 'zh-TW');
    }
    return zhTWCache;
  },
};

export default countryTranslations;
export { countryTranslations };
