/**
 * Vietnam Destination Metadata
 *
 * Core metadata for Vietnam as a destination including:
 * - Basic identification (ID, codes, names)
 * - Display information (flag, translations)
 * - Currency and financial settings
 * - Date and time format preferences
 * - E-Visa configuration
 */

/**
 * @typedef {Object} VietnamMetadata
 * @property {string} id - Unique destination identifier
 * @property {string} code - ISO 3166-1 alpha-2 country code
 * @property {string} code3 - ISO 3166-1 alpha-3 country code
 * @property {string} name - English name
 * @property {string} nameZh - Simplified Chinese name
 * @property {string} nameZhTW - Traditional Chinese name
 * @property {string} nameVi - Native Vietnamese name
 * @property {string} flag - Unicode flag emoji
 * @property {boolean} enabled - Whether destination is available for selection
 * @property {string} currency - ISO 4217 currency code
 * @property {string} currencySymbol - Currency symbol
 * @property {string} dateFormat - Preferred date format pattern
 * @property {string} timezone - IANA timezone identifier
 * @property {string} flightTimeKey - i18n key for flight time from origin
 * @property {Object} eVisa - E-Visa configuration
 * @property {string} eVisa.type - Type of visa (e-Visa)
 * @property {string} eVisa.name - Display name for the visa
 * @property {string} eVisa.nameZh - Chinese name for the visa
 * @property {number} eVisa.processingDays - Processing time in business days
 * @property {number} eVisa.validityDays - Visa validity period in days
 * @property {number} eVisa.feesUSD - Visa fee in USD
 * @property {Object} visaRequirement - Visa requirements for different passport holders
 */

export const metadata = {
  // Basic Identification
  id: 'vn',
  code: 'VN',
  code3: 'VNM',

  // Names and Translations
  name: 'Vietnam',
  nameZh: '越南',
  nameZhTW: '越南',
  nameVi: 'Việt Nam',

  // Display
  flag: '🇻🇳',
  enabled: true,

  // Currency
  currency: 'VND',
  currencySymbol: '₫',
  currencyNameEn: 'Vietnamese Dong',
  currencyNameZh: '越南盾',

  // Date and Time
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Ho_Chi_Minh',

  // Flight Information
  flightTimeKey: 'home.destinations.vietnam.flightTime',
  typicalFlightTimeHours: 3.5, // From major Chinese cities to Hanoi/HCMC

  // E-Visa Configuration
  eVisa: {
    type: 'e-Visa',
    name: 'Vietnam E-Visa',
    nameZh: '越南电子签证',
    nameShort: 'e-Visa',
    processingDays: 3, // Processing time: 3 business days
    validityDays: 90, // 90-day validity
    feesUSD: 25, // $25 USD fee
    applicationUrl: 'https://evisa.xuatnhapcanh.gov.vn',
    multipleEntry: true, // Supports both single and multiple entry
    extensions: false, // Cannot be extended
  },

  // Visa Requirements (for Chinese passport holders by default)
  visaRequirement: {
    'CHN': 'evisa', // China - E-Visa required
    'HKG': 'visa_free', // Hong Kong - Visa free (certain conditions)
    'MAC': 'visa_free', // Macau - Visa free (certain conditions)
    'TWN': 'evisa', // Taiwan - E-Visa required
    'USA': 'evisa', // USA - E-Visa available
    'GBR': 'evisa', // UK - E-Visa available
    'default': 'check_requirements', // Default - Check individual requirements
  },

  // Country Priorities
  priority: 3, // After Thailand and nearby countries

  // Localization
  locales: ['en', 'vi', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',
};

export default metadata;
