// Country-specific translations loader
const countriesEn = require('./countries.en.json');
const countriesFr = require('./countries.fr.json');
const countriesDe = require('./countries.de.json');
const countriesEs = require('./countries.es.json');
const countriesZh = require('./countries.zh.json');

const countryTranslations = {
  en: countriesEn,
  zh: countriesZh,
  fr: countriesFr,
  de: countriesDe,
  es: countriesEs,
};

module.exports = countryTranslations;
module.exports.default = countryTranslations;
module.exports.countryTranslations = countryTranslations;
