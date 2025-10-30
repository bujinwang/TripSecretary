/**
 * Thailand Financial Information
 *
 * Financial data including:
 * - ATM fees and withdrawal limits
 * - Recommended cash amounts
 * - Currency denominations
 * - Bank recommendations
 * - Exchange rate guidance
 */

/**
 * @typedef {Object} ThailandFinancialInfo
 * @property {Object} atm - ATM information
 * @property {Object} cash - Cash recommendations
 * @property {Object} denominations - Currency denominations
 * @property {Array<string>} recommendedBanks - Recommended banks for ATM use
 * @property {Object} exchangeRate - Exchange rate guidance
 */

export const financialInfo = {
  // ATM Information
  atm: {
    // Standard ATM fee charged by Thai banks (as of 2024)
    fee: 220,
    feeUnit: 'THB',
    feeNote: 'Standard fee charged by Thai banks for foreign card withdrawals',

    // Withdrawal limits
    withdrawalLimit: {
      min: 1000,
      max: 30000,
      unit: 'THB',
      note: 'Limit varies by bank and card type',
    },

    // Suggested withdrawal amounts for travelers
    suggestedAmount: {
      min: 3000,
      max: 5000,
      unit: 'THB',
      note: 'Recommended for short stays (1-3 days)',
    },

    // Location tips
    locations: [
      {
        type: 'airport',
        airport: 'BKK',
        airportName: 'Suvarnabhumi Airport',
        airportNameZh: '素万那普国际机场',
        floor: 'Arrivals Level (2nd Floor)',
        location: 'Multiple locations after customs',
        note: 'Available 24/7',
      },
      {
        type: 'airport',
        airport: 'DMK',
        airportName: 'Don Mueang Airport',
        airportNameZh: '廊曼国际机场',
        floor: 'Arrivals Level (1st Floor)',
        location: 'Near Gates 6 and 8',
        note: 'Available 24/7',
      },
    ],
  },

  // Cash Recommendations
  cash: {
    // Recommended amounts by trip duration
    recommendations: [
      {
        duration: '1-3 days',
        amountMin: 3000,
        amountMax: 5000,
        purpose: 'Food, local transport, shopping',
      },
      {
        duration: '4-7 days',
        amountMin: 5000,
        amountMax: 10000,
        purpose: 'Extended stay, tours, dining',
      },
      {
        duration: '1-2 weeks',
        amountMin: 10000,
        amountMax: 20000,
        purpose: 'Longer stay, activities, emergencies',
      },
    ],

    // Entry requirement (official)
    entryRequirement: {
      amount: 20000,
      unit: 'THB',
      perPerson: true,
      note: 'Thai immigration may ask to show proof of funds (rarely enforced)',
      equivalentCurrency: 'or equivalent in foreign currency',
    },

    // Common expenses
    commonExpenses: {
      mealStreet: { min: 50, max: 100, unit: 'THB', description: 'Street food meal' },
      mealRestaurant: { min: 200, max: 500, unit: 'THB', description: 'Restaurant meal' },
      taxi: { min: 50, max: 200, unit: 'THB', description: 'Short taxi ride' },
      bts: { min: 16, max: 59, unit: 'THB', description: 'BTS/MRT train ticket' },
      water: { min: 7, max: 20, unit: 'THB', description: 'Bottled water' },
    },
  },

  // Currency Denominations
  denominations: {
    notes: [1000, 500, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.5, 0.25],
    unit: 'THB',
    note: 'Notes: Purple (1000), Purple (500), Red (100), Blue (50), Green (20)\nCoins: 10฿, 5฿, 2฿, 1฿',
  },

  // Recommended Banks
  recommendedBanks: [
    {
      name: 'Bangkok Bank',
      nameZh: '曼谷银行',
      atmColor: 'Blue',
      note: 'Largest bank, widely available',
    },
    {
      name: 'Kasikorn Bank',
      nameZh: 'Kasikorn银行',
      atmColor: 'Green',
      note: 'Good ATM network, English interface',
    },
    {
      name: 'Siam Commercial Bank',
      nameZh: '暹罗商业银行',
      atmColor: 'Purple',
      note: 'Common in Bangkok and tourist areas',
    },
    {
      name: 'Krungsri Bank',
      nameZh: 'Krungsri银行',
      atmColor: 'Yellow',
      note: 'Bank of Ayudhya, good coverage',
    },
  ],

  // Exchange Rate Guidance
  exchangeRate: {
    // Approximate rates (for reference only - users should check current rates)
    approximateRates: {
      'CNY': 4.7,  // 1 CNY ≈ 4.7 THB
      'USD': 35.0, // 1 USD ≈ 35 THB
      'EUR': 38.0, // 1 EUR ≈ 38 THB
      'GBP': 44.0, // 1 GBP ≈ 44 THB
    },
    note: 'Exchange rates fluctuate. Check current rates before travel.',
    lastUpdated: '2024-Q1',
  },

  // Payment Methods
  paymentMethods: {
    creditCard: {
      accepted: true,
      commonCards: ['Visa', 'Mastercard', 'UnionPay'],
      coverage: 'Widely accepted in cities, less in rural areas',
      note: 'Some merchants add 3% surcharge',
    },
    mobilePayment: {
      accepted: true,
      methods: ['PromptPay', 'TrueMoney', 'Rabbit LINE Pay'],
      foreignSupport: 'Limited support for foreign mobile payment apps',
      note: 'Alipay and WeChat Pay accepted in tourist areas',
    },
    cash: {
      importance: 'high',
      note: 'Cash is king in Thailand, especially for street food and small shops',
    },
  },
};

export default financialInfo;
