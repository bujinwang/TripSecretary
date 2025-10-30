/**
 * [COUNTRY_NAME] Destination Metadata
 *
 * TODO: Replace all [PLACEHOLDERS] with actual country information
 * TODO: Update currency exchange rates regularly
 */

export const [COUNTRY_CODE_UPPER]_METADATA = {
  // ============================================
  // IDENTIFIERS
  // ============================================

  /**
   * Primary identifier - 2-letter lowercase code (ISO 3166-1 alpha-2)
   * TODO: Replace with your country code (e.g., 'vn', 'my', 'sg')
   */
  id: '[COUNTRY_CODE_LOWER]',

  /**
   * 3-letter uppercase code (ISO 3166-1 alpha-3)
   * TODO: Replace with ISO 3166-1 alpha-3 code (e.g., 'VNM', 'MYS', 'SGP')
   */
  code: '[COUNTRY_CODE_3LETTER]',

  /**
   * Country name in English
   * TODO: Replace with country name
   */
  name: '[COUNTRY_NAME]',

  /**
   * Country name in Chinese (Simplified)
   * TODO: Replace with Chinese translation
   */
  nameZh: '[国家名称]',

  /**
   * Country name in Thai (optional)
   * TODO: Replace with Thai translation or remove if not needed
   */
  nameTh: '[ประเทศ]',

  // ============================================
  // DISPLAY
  // ============================================

  /**
   * Country flag emoji
   * TODO: Replace with country flag emoji
   */
  flag: '🏴',

  /**
   * Alternative emoji representation
   * TODO: Can be the same as flag or a different emoji
   */
  emoji: '🏴',

  // ============================================
  // CURRENCY
  // ============================================

  currency: {
    /**
     * ISO 4217 currency code
     * TODO: Replace with currency code (e.g., 'VND', 'MYR', 'SGD')
     */
    code: '[CURRENCY_CODE]',

    /**
     * Currency symbol
     * TODO: Replace with currency symbol (e.g., '₫', 'RM', '$')
     */
    symbol: '[SYMBOL]',

    /**
     * Currency name in English
     * TODO: Replace with currency name
     */
    name: '[Currency Name]',

    /**
     * Currency name in Chinese
     * TODO: Replace with Chinese translation
     */
    nameZh: '[货币名称]',

    /**
     * Exchange rate to USD (approximate, for display only)
     * TODO: Update with current exchange rate
     * TODO: Consider implementing dynamic exchange rate updates
     */
    exchangeRateUSD: 1.00,  // TODO: Replace with actual rate

    /**
     * Typical denominations
     * TODO: List common bills and coins
     */
    denominations: {
      bills: [/* TODO: e.g., 10, 20, 50, 100, 500, 1000 */],
      coins: [/* TODO: e.g., 1, 2, 5, 10 */]
    }
  },

  // ============================================
  // TIME & GEOGRAPHY
  // ============================================

  /**
   * IANA timezone identifier
   * TODO: Replace with timezone (e.g., 'Asia/Ho_Chi_Minh', 'Asia/Kuala_Lumpur')
   * Reference: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   */
  timezone: 'Asia/[CITY]',

  /**
   * UTC offset
   * TODO: Replace with offset (e.g., '+07:00', '+08:00')
   */
  utcOffset: '+00:00',

  /**
   * Capital city
   * TODO: Replace with capital city name
   */
  capital: '[Capital City]',

  /**
   * Major cities (for display and validation)
   * TODO: List major tourist destinations and cities
   */
  majorCities: [
    '[Major City 1]',
    '[Major City 2]',
    '[Major City 3]',
    // TODO: Add more cities
  ],

  // ============================================
  // LANGUAGE
  // ============================================

  /**
   * Official languages
   * TODO: List official languages with ISO 639-1 codes
   */
  languages: [
    { code: '[LANG_CODE]', name: '[Language Name]', nameZh: '[语言名称]' },
    // TODO: Add more languages if applicable
  ],

  /**
   * Default language for forms
   * TODO: Set primary language for digital arrival card forms
   */
  defaultLanguage: '[LANG_CODE]',

  // ============================================
  // DIGITAL ARRIVAL CARD
  // ============================================

  /**
   * Digital arrival card configuration
   * TODO: Fill this section if country has a digital arrival card system
   * TODO: Remove or set enabled: false if not applicable
   */
  digitalCard: {
    /**
     * Whether digital arrival card is available
     */
    enabled: false,  // TODO: Set to true if country has digital arrival card

    /**
     * System name
     * TODO: Replace with official name (e.g., 'TDAC', 'e-Visa', 'SG Arrival Card')
     */
    name: '[Digital Card Name]',

    /**
     * Official website
     * TODO: Replace with official URL
     */
    website: 'https://[official-website]',

    /**
     * API endpoint (if reverse-engineered)
     * TODO: Replace with API base URL or remove if not applicable
     */
    apiEndpoint: 'https://api.[official-website]',

    /**
     * Required fields for submission
     * TODO: List all required fields for the digital arrival card
     */
    requiredFields: [
      'passportNo',
      'fullName',
      'nationality',
      // TODO: Add all required fields
    ],

    /**
     * Optional fields
     * TODO: List optional fields
     */
    optionalFields: [
      'visaNumber',
      // TODO: Add optional fields
    ]
  },

  // ============================================
  // STATUS & AVAILABILITY
  // ============================================

  /**
   * Whether this destination is enabled and visible to users
   * TODO: Set to false during development, true when ready
   */
  enabled: false,  // TODO: Set to true when ready for production

  /**
   * Beta/preview status
   * TODO: Set to true if still in testing, false for stable release
   */
  beta: true,  // TODO: Set to false when stable

  /**
   * Launch date (ISO 8601 format)
   * TODO: Set when destination is first made available
   */
  launchDate: null,  // TODO: e.g., '2025-02-01'

  // ============================================
  // ADDITIONAL INFO
  // ============================================

  /**
   * Country calling code
   * TODO: Replace with calling code (e.g., '+84', '+60', '+65')
   */
  callingCode: '+[CODE]',

  /**
   * Popular payment methods
   * TODO: List common payment methods
   */
  paymentMethods: [
    'cash',
    'credit-card',
    // TODO: Add: 'mobile-wallet', 'bank-transfer', etc.
  ],

  /**
   * Visa policy for Chinese citizens
   * TODO: Update with current visa requirements
   */
  visaPolicy: {
    required: true,  // TODO: Set to false if visa-free for Chinese passport holders
    types: ['tourist', 'business'],  // TODO: List available visa types
    eVisaAvailable: false,  // TODO: Set to true if e-Visa is available
    visaOnArrivalAvailable: false,  // TODO: Set to true if visa-on-arrival is available
    maxStayDays: 30,  // TODO: Update with max stay duration
    notes: 'TODO: Add any special notes about visa requirements'
  }
};

/**
 * Default export
 */
export default [COUNTRY_CODE_UPPER]_METADATA;
