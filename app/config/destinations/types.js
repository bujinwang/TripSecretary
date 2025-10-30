/**
 * Type Definitions for Destination Configuration System
 *
 * These JSDoc type definitions provide IDE autocomplete and type checking
 * for the destination configuration system.
 */

/**
 * @typedef {Object} DestinationMetadata
 * @property {string} id - Unique destination identifier (e.g., 'th', 'sg', 'jp')
 * @property {string} code - ISO 3166-1 alpha-2 country code
 * @property {string} code3 - ISO 3166-1 alpha-3 country code
 * @property {string} name - English name
 * @property {string} nameZh - Simplified Chinese name
 * @property {string} nameZhTW - Traditional Chinese name
 * @property {string} flag - Unicode flag emoji
 * @property {boolean} enabled - Whether destination is available for selection
 * @property {string} currency - ISO 4217 currency code
 * @property {string} currencySymbol - Currency symbol
 * @property {string} currencyNameEn - Currency name in English
 * @property {string} currencyNameZh - Currency name in Chinese
 * @property {string} dateFormat - Preferred date format pattern
 * @property {string} timezone - IANA timezone identifier
 * @property {string} flightTimeKey - i18n key for flight time
 * @property {number} typicalFlightTimeHours - Typical flight duration in hours
 * @property {number} priority - Display priority (lower = higher priority)
 * @property {Array<string>} locales - Supported locales
 * @property {string} defaultLocale - Default locale
 */

/**
 * @typedef {Object} DigitalCardConfig
 * @property {string} type - Type of digital card (e.g., 'TDAC', 'SG_ARRIVAL_CARD')
 * @property {string} name - Display name for the card
 * @property {string} nameZh - Chinese name for the card
 * @property {string} nameShort - Short abbreviation
 * @property {number} submissionWindowHours - Hours before arrival when submission opens
 * @property {boolean} required - Whether the card is mandatory
 * @property {string} apiEndpoint - API endpoint URL
 * @property {boolean} sessionBased - Whether IDs change per session
 */

/**
 * @typedef {Object} ATMInfo
 * @property {number} fee - Standard ATM fee
 * @property {string} feeUnit - Currency unit for fee
 * @property {string} feeNote - Additional note about fees
 * @property {Object} withdrawalLimit - Withdrawal limits
 * @property {Object} suggestedAmount - Suggested withdrawal amount
 * @property {Array<Object>} locations - ATM locations (e.g., airports)
 */

/**
 * @typedef {Object} FinancialInfo
 * @property {ATMInfo} atm - ATM information
 * @property {Object} cash - Cash recommendations
 * @property {Object} denominations - Currency denominations
 * @property {Array<Object>} recommendedBanks - Recommended banks
 * @property {Object} exchangeRate - Exchange rate guidance
 * @property {Object} paymentMethods - Payment method information
 */

/**
 * @typedef {Object} EmergencyNumber
 * @property {string} number - Phone number
 * @property {string} name - Service name
 * @property {string} nameZh - Chinese service name
 * @property {string} available - Availability hours
 * @property {Array<string>} languages - Supported languages
 * @property {string} [note] - Additional notes
 */

/**
 * @typedef {Object} EmbassyInfo
 * @property {string} country - Country name
 * @property {string} countryCode - ISO country code
 * @property {string} name - Embassy name
 * @property {string} [nameZh] - Chinese embassy name
 * @property {string} phone - Main phone number
 * @property {string} emergencyPhone - 24/7 emergency phone
 * @property {string} address - Street address
 * @property {string} [addressZh] - Chinese address
 * @property {string} [email] - Contact email
 * @property {string} [website] - Website URL
 * @property {string} hours - Operating hours
 * @property {Array<string>} services - Available services
 * @property {string} [consularProtection24h] - 24h consular protection number
 */

/**
 * @typedef {Object} HospitalInfo
 * @property {string} name - Hospital name
 * @property {string} nameZh - Chinese hospital name
 * @property {string} phone - Main phone number
 * @property {string} emergency - Emergency phone number
 * @property {string} address - Street address
 * @property {Array<string>} languages - Supported languages
 * @property {Array<string>} specialties - Medical specialties
 * @property {string} insurance - Insurance acceptance info
 * @property {string} [note] - Additional notes
 */

/**
 * @typedef {Object} EmergencyInfo
 * @property {Object.<string, EmergencyNumber>} emergencyNumbers - Emergency service numbers
 * @property {Array<EmbassyInfo>} embassies - Embassy information
 * @property {Array<HospitalInfo>} hospitals - Hospital recommendations
 * @property {Array<Object>} hotlines - Important hotlines
 * @property {Object} notes - Important notes
 */

/**
 * @typedef {Object} ServiceMappings
 * @property {Object} digitalCard - Digital card service mappings
 * @property {string} digitalCard.serviceClass - Service class name
 * @property {string} digitalCard.submissionService - Submission service name
 * @property {string} digitalCard.validationService - Validation service name
 * @property {string} digitalCard.contextBuilder - Context builder name
 * @property {Object} entryInfo - Entry info service mappings
 */

/**
 * @typedef {Object} ScreenMappings
 * @property {string} info - Info screen name
 * @property {string} entryFlow - Entry flow screen name
 * @property {string} entryQuestions - Entry questions screen name
 * @property {string} travelInfo - Travel info screen name
 * @property {string} requirements - Requirements screen name
 * @property {string} guide - Interactive guide screen name
 * @property {string} [tdacWebView] - WebView screen name (if applicable)
 * @property {string} [tdacHybrid] - Hybrid screen name (if applicable)
 */

/**
 * @typedef {Object} FeatureFlags
 * @property {boolean} digitalArrivalCard - Digital arrival card support
 * @property {boolean} entryGuide - Entry guide support
 * @property {boolean} multiLanguageSupport - Multi-language support
 * @property {boolean} offlineMode - Offline mode support
 * @property {boolean} qrCodeExtraction - QR code extraction support
 */

/**
 * @typedef {Object} DestinationConfig
 * @property {string} id - Unique destination identifier
 * @property {string} code - ISO country code (2-letter)
 * @property {string} code3 - ISO country code (3-letter)
 * @property {string} name - English name
 * @property {string} nameZh - Chinese name
 * @property {string} flag - Unicode flag emoji
 * @property {boolean} enabled - Whether destination is available
 * @property {string} currency - ISO currency code
 * @property {string} currencySymbol - Currency symbol
 * @property {string} dateFormat - Date format pattern
 * @property {string} timezone - IANA timezone
 * @property {DigitalCardConfig} digitalCard - Digital card configuration
 * @property {Object} visaRequirement - Visa requirements by passport country
 * @property {FinancialInfo} financial - Financial information
 * @property {EmergencyInfo} emergency - Emergency contacts
 * @property {Object} entryGuide - Entry guide configuration
 * @property {Object} [validation] - Validation rules
 * @property {Object} dataPath - Data file paths
 * @property {ServiceMappings} services - Service class mappings
 * @property {ScreenMappings} screens - Screen navigation mappings
 * @property {FeatureFlags} features - Feature flags
 */

// Export empty object to make this a module
export {};
