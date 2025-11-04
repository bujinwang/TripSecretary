// Country-specific translations loader
const { convertToTraditional } = require('../chineseConverter');

const countriesEn = require('./countries.en.json');
const countriesFr = require('./countries.fr.json');
const countriesDe = require('./countries.de.json');
const countriesEs = require('./countries.es.json');
const countriesZh = require('./countries.zh.json');
const countriesMs = require('./countries.ms.json');

// Lazy conversion cache for Traditional Chinese variants
let zhTWCache = null;
let zhHKCache = null;

const countryTranslations = {
  en: countriesEn,
  'zh-CN': countriesZh,
  // Lazy getter for Traditional Chinese - convert on first access
  get 'zh-TW'() {
    if (!zhTWCache) {
      zhTWCache = convertToTraditional(countriesZh, 'zh-TW');
    }
    return zhTWCache;
  },
  fr: countriesFr,
  de: countriesDe,
  es: countriesEs,
  ms: countriesMs,
  // Add fallback for legacy 'zh' - use Traditional
  get 'zh'() {
    if (!zhTWCache) {
      zhTWCache = convertToTraditional(countriesZh, 'zh-TW');
    }
    return zhTWCache;
  },
};

module.exports = countryTranslations;
module.exports.default = countryTranslations;
module.exports.countryTranslations = countryTranslations;
