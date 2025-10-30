/**
 * [COUNTRY_NAME] Destination Configuration
 *
 * Main configuration aggregator for [COUNTRY_NAME].
 * This serves as the single source of truth for all country-specific settings.
 *
 * TODO BEFORE USING THIS TEMPLATE:
 * 1. Replace all [PLACEHOLDERS] throughout all files
 * 2. Fill in all TODO sections with actual data
 * 3. Verify all phone numbers and addresses
 * 4. Test all validation rules
 * 5. Set enabled: false until ready for production
 * 6. Remove this TODO section when complete
 */

import metadata from './metadata';
import financialInfo from './financialInfo';
import emergencyInfo from './emergencyInfo';

// TODO: Import accommodation types if needed (for digital arrival card)
// import accommodationTypes from './accommodationTypes';

// TODO: Import travel purposes if needed (for digital arrival card)
// import travelPurposes from './travelPurposes';

// TODO: Import validation rules
// import validationRules from './validationRules';

// TODO: Import entry guide if created
// import entryGuideConfig from '../../entryGuide/[country-code]';

/**
 * Complete [COUNTRY_NAME] destination configuration
 * @type {import('../types').DestinationConfig}
 */
const [COUNTRY_CODE_LOWER]Config = {
  // ============================================
  // CORE METADATA
  // ============================================

  ...metadata,

  // ============================================
  // FINANCIAL INFORMATION
  // ============================================

  financial: financialInfo,

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================

  emergency: emergencyInfo,

  // ============================================
  // ENTRY GUIDE
  // ============================================

  // TODO: Uncomment when entry guide is created
  // entryGuide: entryGuideConfig,

  // ============================================
  // ACCOMMODATION TYPES
  // ============================================
  // TODO: Uncomment if country has digital arrival card with accommodation types
  // accommodationTypes,

  // ============================================
  // TRAVEL PURPOSES
  // ============================================

  // TODO: Uncomment if country has digital arrival card with travel purposes
  // travelPurposes,

  // ============================================
  // VALIDATION RULES
  // ============================================

  // TODO: Uncomment when validation rules are created
  // validation: validationRules,

  // ============================================
  // LOCATION DATA
  // ============================================

  /**
   * References to location data files
   * TODO: Create location data files if needed (provinces, cities, districts)
   */
  dataPath: {
    // provinces: '@data/[country-code]Provinces',
    // cities: '@data/[country-code]Cities',
    // TODO: Add paths to data files
  },

  // ============================================
  // SERVICE MAPPINGS
  // ============================================

  /**
   * Service class mappings
   * TODO: Update when creating country-specific services
   */
  services: {
    // TODO: Uncomment and update if digital arrival card service is created
    // digitalCard: {
    //   serviceClass: '[Country]DigitalCardAPIService',
    //   submissionService: '[Country]SubmissionService',
    //   validationService: '[Country]ValidationService',
    //   contextBuilder: '[Country]TravelerContextBuilder',
    // },

    // Entry info service (generic, usually no change needed)
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // ============================================
  // SCREEN MAPPINGS
  // ============================================

  /**
   * Screen component mappings for navigation
   * TODO: Update screen names when creating UI screens
   */
  screens: {
    info: '[Country]Info',                    // TODO: Update
    entryFlow: '[Country]EntryFlow',          // TODO: Update
    entryQuestions: '[Country]EntryQuestions', // TODO: Update
    travelInfo: '[Country]TravelInfo',        // TODO: Update
    requirements: '[Country]Requirements',     // TODO: Update
    guide: '[Country]InteractiveGuide',       // TODO: Update (optional)

    // TODO: Add digital arrival card screens if applicable
    // digitalCardWebView: '[Country]WebView',
    // digitalCardHybrid: '[Country]Hybrid',
  },

  // ============================================
  // FEATURE FLAGS
  // ============================================

  /**
   * Feature availability flags
   * TODO: Update based on what features are implemented
   */
  features: {
    /**
     * Digital arrival card integration
     * TODO: Set to true if country has digital arrival card and you've implemented integration
     */
    digitalArrivalCard: false,

    /**
     * Entry guide (step-by-step airport/border process)
     * TODO: Set to true when entry guide is created
     */
    entryGuide: false,

    /**
     * Multi-language support (EN/ZH at minimum)
     * TODO: Set to true when translations are complete
     */
    multiLanguageSupport: false,

    /**
     * Offline mode (forms work without internet)
     * TODO: Set to true if entry guide and forms work offline
     * NOTE: Digital arrival card submission requires internet
     */
    offlineMode: false,

    /**
     * QR code extraction from arrival card PDF
     * TODO: Set to true if QR extraction is implemented
     */
    qrCodeExtraction: false,

    // TODO: Add any country-specific features
    // customFeatureName: false,
  },

  // ============================================
  // REQUIREMENTS
  // ============================================

  /**
   * Entry requirements information
   * TODO: Fill in entry requirements for Chinese citizens
   */
  requirements: {
    /**
     * Visa requirements
     */
    visa: {
      required: true,  // TODO: Update based on visa policy
      types: [],       // TODO: List visa types (e.g., ['tourist', 'business'])
      eVisa: false,    // TODO: Set to true if e-Visa available
      visaOnArrival: false,  // TODO: Set to true if visa-on-arrival available
      visaFree: false,       // TODO: Set to true if visa-free for Chinese citizens
      maxStay: null,         // TODO: Max stay in days (e.g., 30)
      notes: 'TODO: Add any special visa notes'
    },

    /**
     * Passport requirements
     */
    passport: {
      validityRequired: 6,  // TODO: Months of validity required (commonly 6)
      blankPages: 2,        // TODO: Number of blank pages required (commonly 2)
      notes: 'TODO: Add any special passport notes'
    },

    /**
     * Health requirements
     */
    health: {
      vaccinations: [],     // TODO: List required vaccinations (e.g., ['Yellow Fever'])
      covidRequirements: 'TODO: Add current COVID-19 requirements (or remove if not applicable)',
      notes: 'TODO: Add any health-related notes'
    },

    /**
     * Customs and regulations
     */
    customs: {
      currencyLimit: 'TODO: Currency declaration limits',
      prohibitedItems: [
        'TODO: List prohibited items',
        // e.g., 'Drugs', 'Weapons', 'Pornography'
      ],
      restrictedItems: [
        'TODO: List restricted items',
        // e.g., 'Tobacco (limit: X)', 'Alcohol (limit: Y)'
      ],
      notes: 'TODO: Add customs notes'
    }
  },

  // ============================================
  // ADDITIONAL METADATA
  // ============================================

  /**
   * Last updated timestamp
   * TODO: Update this date whenever you make changes
   */
  lastUpdated: 'TODO: YYYY-MM-DD',

  /**
   * Maintainer information
   * TODO: Add maintainer contact
   */
  maintainer: {
    name: 'TODO: Your Name',
    email: 'TODO: your.email@example.com',
    notes: 'TODO: Any notes for future maintainers'
  },

  /**
   * Data sources
   * TODO: Document where you got information
   */
  sources: [
    'TODO: Official government website URL',
    'TODO: Embassy website URL',
    'TODO: Other reliable sources',
  ]
};

export default [COUNTRY_CODE_LOWER]Config;
