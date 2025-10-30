/**
 * [COUNTRY_NAME] Financial Information
 *
 * Provides practical financial guidance for travelers including:
 * - ATM fees and limits
 * - Cash recommendations
 * - Banking information
 * - Exchange tips
 *
 * TODO: Replace all [PLACEHOLDERS] with actual information
 * TODO: Verify all fees and rates are current
 * TODO: Update regularly as information changes
 */

export const [COUNTRY_CODE_UPPER]_FINANCIAL_INFO = {
  // ============================================
  // ATM INFORMATION
  // ============================================

  atm: {
    /**
     * Typical ATM withdrawal fee
     * TODO: Research current ATM fees at major banks
     */
    fee: {
      amount: 0,  // TODO: Replace with typical fee amount
      currency: '[CURRENCY_CODE]',
      description: 'TODO: Describe typical ATM fees (e.g., "Most ATMs charge 50 baht per withdrawal")'
    },

    /**
     * Daily withdrawal limit
     * TODO: Research ATM limits at major banks
     */
    dailyLimit: {
      amount: 0,  // TODO: Replace with typical daily limit
      currency: '[CURRENCY_CODE]',
      description: 'TODO: Describe withdrawal limits'
    },

    /**
     * Per-transaction limit
     * TODO: Research per-transaction limits
     */
    perTransactionLimit: {
      amount: 0,  // TODO: Replace with per-transaction limit
      currency: '[CURRENCY_CODE]'
    },

    /**
     * ATM availability
     * TODO: Describe ATM availability and locations
     */
    availability: 'TODO: Describe where ATMs are commonly found',

    /**
     * Accepted card networks
     * TODO: List accepted card networks (Visa, Mastercard, UnionPay, etc.)
     */
    acceptedCards: [
      'Visa',
      'Mastercard',
      'UnionPay',
      // TODO: Add other accepted networks
    ],

    /**
     * ATM recommendations and tips
     * TODO: Add practical tips for using ATMs
     */
    recommendations: [
      'TODO: Add tip 1 (e.g., "Use bank ATMs inside shopping malls for safety")',
      'TODO: Add tip 2 (e.g., "Withdraw larger amounts to minimize fees")',
      'TODO: Add tip 3 (e.g., "Best ATMs for foreign cards: [Bank Name]")',
      // TODO: Add more recommendations
    ]
  },

  // ============================================
  // CASH RECOMMENDATIONS
  // ============================================

  cash: {
    /**
     * Recommended cash amount to carry
     * TODO: Set realistic daily cash recommendations
     */
    recommended: {
      min: 0,  // TODO: Minimum recommended amount
      max: 0,  // TODO: Maximum recommended amount
      currency: '[CURRENCY_CODE]',
      description: 'TODO: Describe what this amount covers (e.g., "For one day of meals and local transport")'
    },

    /**
     * Cash acceptance level
     * TODO: Describe how widely cash is accepted
     */
    acceptance: 'TODO: Describe cash acceptance (e.g., "Cash is widely accepted, but cards are common in cities")',

    /**
     * Cash handling tips
     * TODO: Add practical tips for handling cash
     */
    tips: [
      'TODO: Add tip 1 (e.g., "Keep small denominations for taxis and street vendors")',
      'TODO: Add tip 2 (e.g., "Break large bills at hotels or supermarkets")',
      'TODO: Add tip 3 (e.g., "Carry cash for rural areas")',
      // TODO: Add more tips
    ],

    /**
     * Places that typically require cash
     * TODO: List places where cash is necessary
     */
    cashOnlyPlaces: [
      'TODO: e.g., "Street food vendors"',
      'TODO: e.g., "Local markets"',
      'TODO: e.g., "Small family-run restaurants"',
      // TODO: Add more
    ]
  },

  // ============================================
  // BANKING
  // ============================================

  banking: {
    /**
     * Major banks in the country
     * TODO: List major banks with Chinese names
     */
    majorBanks: [
      {
        name: '[Bank Name 1]',
        nameZh: '[银行名称 1]',
        atmNetwork: '[Network Name]',  // Optional
        chineseSupport: false  // TODO: Set to true if Chinese support available
      },
      {
        name: '[Bank Name 2]',
        nameZh: '[银行名称 2]'
      },
      // TODO: Add more banks
    ],

    /**
     * Credit card acceptance
     * TODO: Describe credit card acceptance levels
     */
    creditCardAcceptance: 'TODO: Describe where credit cards are accepted (e.g., "Widely accepted in hotels, restaurants, and shopping malls")',

    /**
     * Debit card acceptance
     * TODO: Describe debit card acceptance
     */
    debitCardAcceptance: 'TODO: Describe debit card acceptance',

    /**
     * Mobile payment systems
     * TODO: List popular mobile payment apps
     */
    mobilePayment: [
      // TODO: e.g., 'Alipay', 'WeChat Pay', 'GrabPay', etc.
    ],

    /**
     * UnionPay acceptance
     * TODO: Describe UnionPay acceptance (important for Chinese travelers)
     */
    unionPayAcceptance: 'TODO: Describe UnionPay acceptance',

    /**
     * Banking tips
     * TODO: Add useful banking tips
     */
    tips: [
      'TODO: Add banking tip 1',
      'TODO: Add banking tip 2',
      // TODO: Add more
    ]
  },

  // ============================================
  // CURRENCY EXCHANGE
  // ============================================

  exchange: {
    /**
     * Exchange rate (approximate, for reference only)
     * TODO: Set current exchange rates
     */
    rates: {
      USD: 1.00,  // TODO: Update with current USD rate
      CNY: 1.00,  // TODO: Update with current CNY rate
      EUR: 1.00,  // TODO: Update with current EUR rate
      lastUpdated: 'TODO: YYYY-MM-DD'
    },

    /**
     * Best places to exchange currency
     * TODO: List recommended exchange locations
     */
    bestPlaces: [
      'TODO: e.g., "Licensed money changers in shopping districts"',
      'TODO: e.g., "Banks (official rate, but may charge commission)"',
      'TODO: e.g., "Avoid airport exchange counters (poor rates)"',
      // TODO: Add more
    ],

    /**
     * Currencies commonly accepted for exchange
     * TODO: List which currencies get the best rates
     */
    acceptedCurrencies: [
      'USD',  // Usually gets best rates
      'CNY',
      // TODO: Add others (EUR, GBP, SGD, etc.)
    ],

    /**
     * Exchange tips
     * TODO: Add practical exchange tips
     */
    tips: [
      'TODO: e.g., "Bring clean, new USD bills for best rates"',
      'TODO: e.g., "Compare rates at multiple locations"',
      'TODO: e.g., "Keep exchange receipts for reconversion"',
      // TODO: Add more tips
    ],

    /**
     * Places to avoid
     * TODO: Warn about poor exchange locations
     */
    avoid: [
      'TODO: e.g., "Airport exchange counters (typically 5-10% worse rates)"',
      'TODO: e.g., "Hotels (convenient but poor rates)"',
      // TODO: Add more
    ]
  },

  // ============================================
  // TYPICAL COSTS
  // ============================================

  /**
   * Typical costs for common items/activities
   * TODO: Research and update current prices
   */
  typicalCosts: {
    // Meals
    streetFood: {
      amount: 0,  // TODO: Typical street food price
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Street food meal"'
    },
    localRestaurant: {
      amount: 0,  // TODO: Local restaurant meal price
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Meal at local restaurant"'
    },
    midRangeRestaurant: {
      amount: 0,  // TODO: Mid-range restaurant price
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Meal at mid-range restaurant"'
    },

    // Transportation
    taxiPerKm: {
      amount: 0,  // TODO: Taxi rate per km
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Taxi per km"'
    },
    taxiStarting: {
      amount: 0,  // TODO: Taxi starting fare
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Taxi starting fare"'
    },
    publicTransport: {
      amount: 0,  // TODO: Public transport fare
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Bus or metro ride"'
    },

    // Beverages
    water: {
      amount: 0,  // TODO: Bottled water price
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Bottled water (500ml)"'
    },
    coffee: {
      amount: 0,  // TODO: Coffee price
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Coffee at local cafe"'
    },
    beer: {
      amount: 0,  // TODO: Beer price
      currency: '[CURRENCY_CODE]',
      description: 'TODO: e.g., "Local beer at restaurant"'
    },

    // TODO: Add more typical costs as needed
  },

  // ============================================
  // BUDGET ESTIMATES
  // ============================================

  /**
   * Daily budget estimates
   * TODO: Calculate realistic daily budgets
   */
  dailyBudget: {
    budget: {
      amount: 0,  // TODO: Budget traveler daily cost
      currency: '[CURRENCY_CODE]',
      description: 'TODO: Describe what this includes (e.g., "Hostel, street food, public transport")'
    },
    midRange: {
      amount: 0,  // TODO: Mid-range traveler daily cost
      currency: '[CURRENCY_CODE]',
      description: 'TODO: Describe what this includes'
    },
    luxury: {
      amount: 0,  // TODO: Luxury traveler daily cost
      currency: '[CURRENCY_CODE]',
      description: 'TODO: Describe what this includes'
    }
  },

  // ============================================
  // ADDITIONAL INFO
  // ============================================

  /**
   * Tipping culture
   * TODO: Describe tipping customs and expectations
   */
  tipping: {
    expected: false,  // TODO: Is tipping expected?
    customary: false,  // TODO: Is tipping customary but not required?
    description: 'TODO: Describe tipping culture and typical amounts',
    tips: [
      'TODO: e.g., "Tipping is not expected but appreciated"',
      'TODO: e.g., "Round up taxi fares"',
      // TODO: Add more
    ]
  },

  /**
   * Tax and service charges
   * TODO: Describe VAT, service charges, etc.
   */
  taxes: {
    vat: {
      rate: 0,  // TODO: VAT rate (e.g., 7 for 7%)
      description: 'TODO: Describe VAT application'
    },
    serviceCharge: {
      typical: 0,  // TODO: Typical service charge (e.g., 10 for 10%)
      description: 'TODO: Describe service charge application'
    }
  }
};

/**
 * Default export
 */
export default [COUNTRY_CODE_UPPER]_FINANCIAL_INFO;
