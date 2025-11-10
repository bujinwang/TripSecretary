// @ts-nocheck

/**
 * Hong Kong Destination Metadata
 *
 * Core identification, currency, and arrival formalities information.
 */

export const metadata = {
  // Basic Identification
  id: 'hk',
  code: 'HK',
  code3: 'HKG',

  // Names
  name: 'Hong Kong',
  nameZh: '香港',
  nameZhTW: '香港',

  // Display
  flag: '🇭🇰',
  enabled: true,

  // Currency
  currency: 'HKD',
  currencySymbol: 'HK$',
  currencyNameEn: 'Hong Kong Dollar',
  currencyNameZh: '港币',

  // Date/Time
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Hong_Kong',

  // Typical flight time key (used by UI cards)
  flightTimeKey: 'home.destinations.hongkong.flightTime',
  typicalFlightTimeHours: 3.5,

  // Arrival formalities
  arrivalCard: {
    type: 'none',
    name: 'Arrival Card',
    nameZh: '入境卡',
    hasDigitalOption: false,
    requires: false,
    submissionWindowHours: null,
  },

  // Visa requirement defaults (for Chinese passport focus)
  visaRequirement: {
    CHN: 'visa_free',
    HKG: 'visa_free',
    MAC: 'visa_free',
    TWN: 'visa_free',
    default: 'visa_required',
  },

  // Localization
  locales: ['zh-CN', 'zh-TW', 'en'],
  defaultLocale: 'zh-CN',
};

export default metadata;
