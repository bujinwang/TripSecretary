/**
 * [COUNTRY_NAME] Emergency Information
 *
 * Critical emergency contacts including:
 * - Emergency numbers (police, ambulance, fire)
 * - Tourist police
 * - Chinese embassy/consulates
 * - Hospitals with English/Chinese support
 *
 * TODO: Verify all phone numbers are current
 * TODO: Update addresses and contact information
 * TODO: Check for Chinese-speaking support availability
 *
 * ⚠️ IMPORTANT: This information must be accurate and up-to-date
 * ⚠️ Update regularly and verify before each release
 */

export const [COUNTRY_CODE_UPPER]_EMERGENCY_INFO = {
  // ============================================
  // EMERGENCY NUMBERS
  // ============================================

  /**
   * Universal emergency numbers
   * TODO: Verify country-specific emergency numbers
   */
  emergency: {
    /**
     * Police emergency number
     * TODO: Replace with local police number
     */
    police: '000',

    /**
     * Ambulance emergency number
     * TODO: Replace with local ambulance number
     */
    ambulance: '000',

    /**
     * Fire emergency number
     * TODO: Replace with local fire department number
     */
    fire: '000',

    /**
     * General emergency number (if available)
     * TODO: Replace with universal emergency number or set to null
     */
    general: null,  // TODO: e.g., '112' (common in many countries)

    /**
     * Additional emergency services
     * TODO: Add any other emergency numbers (e.g., coast guard, mountain rescue)
     */
    other: [
      // { service: 'Coast Guard', number: '000' },
      // { service: 'Tourist Helpline', number: '000' },
    ]
  },

  // ============================================
  // TOURIST POLICE
  // ============================================

  /**
   * Tourist police stations with contact information
   * TODO: Research tourist police locations in major cities
   * TODO: Indicate if Chinese-speaking support is available
   */
  touristPolice: [
    {
      city: '[Major City 1]',
      cityZh: '[主要城市 1]',
      phone: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',  // TODO: Replace with actual number
      address: 'TODO: Street address',
      addressZh: 'TODO: 中文地址',  // Optional
      chineseSupport: false,  // TODO: Set to true if Chinese-speaking staff available
      hours: '24/7',  // TODO: Update if not 24/7
      notes: ''  // TODO: Add any special notes
    },
    {
      city: '[Major City 2]',
      cityZh: '[主要城市 2]',
      phone: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',
      address: 'TODO: Street address',
      chineseSupport: false,
      hours: '24/7'
    },
    // TODO: Add more tourist police stations
  ],

  // ============================================
  // CHINESE EMBASSY AND CONSULATES
  // ============================================

  /**
   * Chinese diplomatic missions
   * TODO: Verify all embassy and consulate information
   * TODO: Confirm 24-hour emergency numbers
   * ⚠️ CRITICAL: These must be accurate for citizen protection
   */
  embassies: [
    {
      /**
       * Mission type: 'embassy' or 'consulate'
       */
      type: 'embassy',

      /**
       * City location
       */
      city: '[Capital City]',
      cityZh: '[首都城市]',

      /**
       * Official name
       */
      name: 'Chinese Embassy in [COUNTRY_NAME]',
      nameZh: '中国驻[国家名称]大使馆',

      /**
       * Main phone number
       * TODO: Verify embassy phone number
       */
      phone: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',

      /**
       * 24-hour emergency hotline
       * TODO: Verify emergency hotline
       * ⚠️ CRITICAL: Must be 24/7 accessible
       */
      emergency: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',

      /**
       * Fax number
       */
      fax: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',  // Optional

      /**
       * Email address
       */
      email: '[email]@mfa.gov.cn',  // Optional

      /**
       * Website
       */
      website: 'http://[country-code].china-embassy.gov.cn',  // TODO: Update URL

      /**
       * Physical address
       */
      address: 'TODO: Full street address',
      addressZh: 'TODO: 完整地址',

      /**
       * Office hours
       */
      hours: 'TODO: e.g., Mon-Fri 9:00-12:00, 14:00-17:00',

      /**
       * Consular services hours (if different)
       */
      consularHours: 'TODO: e.g., Mon-Fri 9:00-12:00',

      /**
       * Services offered
       * TODO: List key services
       */
      services: [
        'Passport services',
        'Notarization',
        'Visa authentication',
        'Citizen assistance',
        // TODO: Add more services
      ],

      /**
       * Notes
       */
      notes: 'TODO: Add any important notes (e.g., appointment requirements, holidays)'
    },

    // TODO: Add consulates in major cities
    // {
    //   type: 'consulate',
    //   city: '[Major City]',
    //   name: 'Chinese Consulate General in [City]',
    //   nameZh: '中国驻[城市]总领事馆',
    //   ...
    // },
  ],

  // ============================================
  // HOSPITALS AND MEDICAL FACILITIES
  // ============================================

  /**
   * Hospitals with international/English/Chinese support
   * TODO: Research hospitals in major tourist destinations
   * TODO: Prioritize facilities with Chinese-speaking staff
   */
  hospitals: [
    {
      /**
       * Hospital name
       */
      name: '[Hospital Name]',
      nameZh: '[医院名称]',

      /**
       * City location
       */
      city: '[City Name]',
      cityZh: '[城市名称]',

      /**
       * Main phone number
       */
      phone: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',

      /**
       * Emergency room direct line
       */
      emergency: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',

      /**
       * Ambulance service
       */
      ambulance: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',  // Optional if different from main emergency

      /**
       * Address
       */
      address: 'TODO: Full street address',
      addressZh: 'TODO: 中文地址',  // Optional

      /**
       * Services and specialties
       */
      services: 'TODO: Describe services (e.g., "International hospital with 24/7 emergency care")',

      /**
       * Language support
       */
      chineseSupport: false,  // TODO: Set to true if Chinese-speaking staff available
      englishSupport: true,   // TODO: Set to true if English-speaking staff available
      languages: ['English'],  // TODO: List all languages supported

      /**
       * International accreditation
       */
      accreditation: [],  // TODO: e.g., ['JCI', 'ISO'], or leave empty

      /**
       * Insurance accepted
       */
      insurance: [
        'International insurance accepted',
        // TODO: List specific insurance providers if known
      ],

      /**
       * Payment methods
       */
      payment: ['Cash', 'Credit Card'],  // TODO: Update

      /**
       * Notes
       */
      notes: 'TODO: Add any important notes (e.g., "Preferred by expat community", "Direct billing available")'
    },

    // TODO: Add more hospitals in different cities
  ],

  // ============================================
  // PHARMACIES
  // ============================================

  /**
   * 24-hour pharmacies in major cities
   * TODO: Research 24-hour pharmacy availability
   */
  pharmacies: [
    {
      name: '[Pharmacy Name]',
      nameZh: '[药店名称]',
      city: '[City]',
      phone: '+[COUNTRY_CODE]-[AREA]-[NUMBER]',
      address: 'TODO: Address',
      hours: '24/7',
      chineseSupport: false,
      notes: 'TODO: Any special notes'
    },
    // TODO: Add more pharmacies
  ],

  // ============================================
  // OTHER EMERGENCY CONTACTS
  // ============================================

  /**
   * Additional emergency resources
   * TODO: Add country-specific emergency contacts
   */
  other: [
    // Example: Mental health crisis line
    // {
    //   service: 'Mental Health Crisis Line',
    //   serviceZh: '心理危机热线',
    //   phone: '+[COUNTRY_CODE]-[NUMBER]',
    //   hours: '24/7',
    //   chineseSupport: false,
    //   notes: 'TODO: Describe service'
    // },

    // Example: Sexual assault hotline
    // {
    //   service: 'Sexual Assault Hotline',
    //   phone: '+[COUNTRY_CODE]-[NUMBER]',
    //   hours: '24/7'
    // },

    // TODO: Add more emergency resources
  ],

  // ============================================
  // GENERAL SAFETY INFORMATION
  // ============================================

  /**
   * Important safety tips and information
   * TODO: Add country-specific safety guidance
   */
  safety: {
    /**
     * General safety tips
     */
    tips: [
      'TODO: Add safety tip 1 (e.g., "Keep copies of passport and visa separate from originals")',
      'TODO: Add safety tip 2 (e.g., "Register with Chinese embassy upon arrival for long stays")',
      'TODO: Add safety tip 3',
      // TODO: Add more tips
    ],

    /**
     * Common scams to avoid
     */
    scams: [
      'TODO: Describe common scam 1',
      'TODO: Describe common scam 2',
      // TODO: Add more
    ],

    /**
     * Areas to avoid
     */
    avoidAreas: [
      'TODO: List areas to avoid if any',
      // Or leave empty if country is generally safe
    ],

    /**
     * Emergency phrases in local language
     * TODO: Add key emergency phrases
     */
    phrases: {
      help: {
        local: 'TODO: "Help!" in local language',
        pronunciation: 'TODO: Pronunciation guide'
      },
      police: {
        local: 'TODO: "Call the police" in local language',
        pronunciation: 'TODO: Pronunciation guide'
      },
      ambulance: {
        local: 'TODO: "Call an ambulance" in local language',
        pronunciation: 'TODO: Pronunciation guide'
      },
      // TODO: Add more phrases
    }
  },

  // ============================================
  // LOST OR STOLEN
  // ============================================

  /**
   * Contact information for lost/stolen items
   * TODO: Research reporting procedures
   */
  lostOrStolen: {
    /**
     * Lost passport procedure
     */
    passport: {
      reportTo: [
        'Local police station (get police report)',
        'Chinese embassy/consulate'
      ],
      documents: [
        'Police report',
        'Passport photos',
        'Copy of lost passport (if available)',
        'Travel itinerary'
      ],
      notes: 'TODO: Add any country-specific procedures'
    },

    /**
     * Lost/stolen credit cards
     */
    creditCard: {
      reportTo: [
        'Card issuer immediately',
        'Local police (for police report)'
      ],
      notes: 'TODO: Add local reporting requirements'
    },

    /**
     * Lost luggage
     */
    luggage: {
      reportTo: [
        'Airline lost luggage office',
        'Airport customer service'
      ],
      notes: 'TODO: Add any specific procedures'
    }
  }
};

/**
 * Default export
 */
export default [COUNTRY_CODE_UPPER]_EMERGENCY_INFO;
