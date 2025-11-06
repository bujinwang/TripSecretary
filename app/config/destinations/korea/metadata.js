/**
 * South Korea Destination Metadata
 *
 * Core metadata for South Korea as a destination including:
 * - Basic identification (ID, codes, names)
 * - Display information (flag, translations)
 * - Currency and financial settings
 * - Date and time format preferences
 * - K-ETA (Korean Electronic Travel Authorization) configuration
 */

/**
 * @typedef {Object} KoreaMetadata
 * @property {string} id - Unique destination identifier
 * @property {string} code - ISO 3166-1 alpha-2 country code
 * @property {string} code3 - ISO 3166-1 alpha-3 country code
 * @property {string} name - English name
 * @property {string} nameZh - Simplified Chinese name
 * @property {string} nameZhTW - Traditional Chinese name
 * @property {string} nameKo - Native Korean name
 * @property {string} flag - Unicode flag emoji
 * @property {boolean} enabled - Whether destination is available for selection
 * @property {string} currency - ISO 4217 currency code
 * @property {string} currencySymbol - Currency symbol
 * @property {string} dateFormat - Preferred date format pattern
 * @property {string} timezone - IANA timezone identifier
 * @property {string} flightTimeKey - i18n key for flight time from origin
 * @property {Object} keta - K-ETA (Korean Electronic Travel Authorization) configuration
 * @property {string} keta.type - Type of authorization (K-ETA)
 * @property {string} keta.name - Display name for K-ETA
 * @property {string} keta.nameZh - Chinese name for K-ETA
 * @property {number} keta.processingDays - Processing time in business days
 * @property {number} keta.validityDays - K-ETA validity period in days
 * @property {number} keta.feesKRW - K-ETA fee in KRW
 * @property {Object} visaRequirement - Visa requirements for different passport holders
 */

export const metadata = {
  // Basic Identification
  id: 'kr',
  code: 'KR',
  code3: 'KOR',

  // Names and Translations
  name: 'South Korea',
  nameZh: '韩国',
  nameZhTW: '韓國',
  nameKo: '대한민국',

  // Display
  flag: '🇰🇷',
  enabled: false, // Currently disabled - requires K-ETA implementation

  // Currency
  currency: 'KRW',
  currencySymbol: '₩',
  currencyNameEn: 'South Korean Won',
  currencyNameZh: '韩元',

  // Date and Time
  dateFormat: 'YYYY-MM-DD',
  timezone: 'Asia/Seoul',

  // Flight Information
  flightTimeKey: 'home.destinations.korea.flightTime',
  typicalFlightTimeHours: 2.0, // From major Chinese cities to Seoul

  // K-ETA Configuration (Korean Electronic Travel Authorization)
  keta: {
    type: 'K-ETA',
    name: 'Korean Electronic Travel Authorization',
    nameZh: '韩国电子旅行许可',
    nameKo: 'K-ETA',
    nameShort: 'K-ETA',
    processingDays: 1, // Usually processed within 24 hours
    validityDays: 730, // Valid for 2 years
    feesKRW: 10000, // 10,000 KRW fee (approximately $7-8 USD)
    applicationUrl: 'https://www.k-eta.go.kr',
    required: true, // Required for visa-free entry
    submissionWindowHours: 72, // Must apply at least 72 hours before arrival
    biometricRequired: true, // Requires biometric information
  },

  // Arrival Card Configuration (Paper-based)
  arrivalCard: {
    type: 'paper',
    name: 'Arrival Card',
    nameZh: '入境卡',
    nameKo: '입국카드',
    hasDigitalOption: false,
    requires: true,
    languages: ['ko', 'en', 'zh'],
  },

  // Visa Requirements (for Chinese passport holders by default)
  visaRequirement: {
    'CHN': 'visa_required', // China - Requires visa (though K-ETA may be available for certain conditions)
    'HKG': 'keta', // Hong Kong - K-ETA required
    'MAC': 'keta', // Macau - K-ETA required
    'TWN': 'keta', // Taiwan - K-ETA required
    'USA': 'keta', // USA - K-ETA required for visa-free entry
    'GBR': 'keta', // UK - K-ETA required
    'CAN': 'keta', // Canada - K-ETA required
    'AUS': 'keta', // Australia - K-ETA required
    'SGP': 'keta', // Singapore - K-ETA required
    'MYS': 'keta', // Malaysia - K-ETA required
    'default': 'check_requirements', // Default - Check individual requirements
  },

  // Country Priorities
  priority: 4, // Medium priority (requires K-ETA)

  // Localization
  locales: ['en', 'ko', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',

  // Korea-specific information
  capital: 'Seoul',
  majorCities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gwangju'],
  typicalStayDuration: '90 days', // Visa-free stay duration for most countries with K-ETA
};

export default metadata;

