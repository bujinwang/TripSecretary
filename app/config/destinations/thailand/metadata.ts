// @ts-nocheck

/**
 * Thailand Destination Metadata
 *
 * Core metadata for Thailand as a destination including:
 * - Basic identification (ID, codes, names)
 * - Display information (flag, translations)
 * - Currency and financial settings
 * - Date and time format preferences
 * - Digital arrival card configuration
 */

/**
 * @typedef {Object} ThailandMetadata
 * @property {string} id - Unique destination identifier
 * @property {string} code - ISO 3166-1 alpha-2 country code
 * @property {string} code3 - ISO 3166-1 alpha-3 country code
 * @property {string} name - English name
 * @property {string} nameZh - Simplified Chinese name
 * @property {string} nameZhTW - Traditional Chinese name
 * @property {string} nameTh - Native Thai name
 * @property {string} flag - Unicode flag emoji
 * @property {boolean} enabled - Whether destination is available for selection
 * @property {string} currency - ISO 4217 currency code
 * @property {string} currencySymbol - Currency symbol
 * @property {string} dateFormat - Preferred date format pattern
 * @property {string} timezone - IANA timezone identifier
 * @property {string} flightTimeKey - i18n key for flight time from origin
 * @property {Object} digitalCard - Digital arrival card configuration
 * @property {string} digitalCard.type - Type of digital card (TDAC)
 * @property {string} digitalCard.name - Display name for the card
 * @property {string} digitalCard.nameZh - Chinese name for the card
 * @property {number} digitalCard.submissionWindowHours - Hours before arrival when submission opens
 * @property {boolean} digitalCard.required - Whether the card is mandatory
 * @property {Object} visaRequirement - Visa requirements for different passport holders
 */

export const metadata = {
  // Basic Identification
  id: 'th',
  code: 'TH',
  code3: 'THA',

  // Names and Translations
  name: 'Thailand',
  nameZh: '泰国',
  nameZhTW: '泰國',
  nameTh: 'ไทย',

  // Display
  flag: '🇹🇭',
  enabled: true,

  // Currency
  currency: 'THB',
  currencySymbol: '฿',
  currencyNameEn: 'Thai Baht',
  currencyNameZh: '泰铢',

  // Date and Time
  dateFormat: 'YYYY-MM-DD',
  timezone: 'Asia/Bangkok',

  // Flight Information
  flightTimeKey: 'home.destinations.thailand.flightTime',
  typicalFlightTimeHours: 4.5, // From major Chinese cities

  // Digital Arrival Card Configuration
  digitalCard: {
    type: 'TDAC',
    name: 'Thailand Digital Arrival Card',
    nameZh: '泰国电子入境卡',
    nameShort: 'TDAC',
    submissionWindowHours: 72, // Can submit up to 72 hours before arrival
    required: true,
    apiEndpoint: 'https://www.eservices.immigration.go.th/eTAC',
    sessionBased: true, // IDs change per session
  },

  // Visa Requirements (for Chinese passport holders by default)
  visaRequirement: {
    'CHN': 'visa_free', // China - Visa free
    'HKG': 'visa_free', // Hong Kong - Visa free
    'MAC': 'visa_free', // Macau - Visa free
    'TWN': 'visa_free', // Taiwan - Visa free
    'USA': 'visa_free', // USA - Visa free (various durations)
    'GBR': 'visa_free', // UK - Visa free
    'default': 'check_requirements', // Default - Check individual requirements
  },

  // Country Priorities
  priority: 2, // Higher priority (lower number) = shown earlier in lists

  // Localization
  locales: ['en', 'th', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',
};

export default metadata;
