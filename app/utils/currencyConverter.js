/**
 * Currency Converter Utility
 *
 * Provides currency conversion functionality for calculating total funds
 * across multiple currencies.
 *
 * NOTE: Exchange rates are approximate and should be updated periodically.
 * Last updated: 2025-01-26
 */

// Exchange rates to THB (Thai Baht)
// These are approximate rates and should be updated periodically
const EXCHANGE_RATES_TO_THB = {
  THB: 1.0,      // Thai Baht (base currency)
  USD: 33.50,    // US Dollar
  EUR: 36.80,    // Euro
  GBP: 42.50,    // British Pound
  CNY: 4.65,     // Chinese Yuan
  JPY: 0.23,     // Japanese Yen
  SGD: 24.80,    // Singapore Dollar
  HKD: 4.28,     // Hong Kong Dollar
  KRW: 0.025,    // South Korean Won
  AUD: 22.10,    // Australian Dollar
  CAD: 24.50,    // Canadian Dollar
};

// Exchange rates to MYR (Malaysian Ringgit)
const EXCHANGE_RATES_TO_MYR = {
  MYR: 1.0,      // Malaysian Ringgit (base currency)
  USD: 4.72,     // US Dollar
  EUR: 5.18,     // Euro
  GBP: 5.98,     // British Pound
  CNY: 0.65,     // Chinese Yuan
  JPY: 0.032,    // Japanese Yen
  THB: 0.14,     // Thai Baht
  SGD: 3.49,     // Singapore Dollar
  HKD: 0.60,     // Hong Kong Dollar
  KRW: 0.0035,   // South Korean Won
  AUD: 3.11,     // Australian Dollar
  CAD: 3.45,     // Canadian Dollar
};

// Exchange rates to HKD (Hong Kong Dollar)
const EXCHANGE_RATES_TO_HKD = {
  HKD: 1.0,      // Hong Kong Dollar (base currency)
  USD: 7.82,     // US Dollar
  EUR: 8.59,     // Euro
  GBP: 9.92,     // British Pound
  CNY: 1.08,     // Chinese Yuan
  JPY: 0.053,    // Japanese Yen
  THB: 0.23,     // Thai Baht
  SGD: 5.79,     // Singapore Dollar
  MYR: 1.66,     // Malaysian Ringgit
  KRW: 0.0058,   // South Korean Won
  AUD: 5.16,     // Australian Dollar
  CAD: 5.73,     // Canadian Dollar
};

// Exchange rates to SGD (Singapore Dollar)
const EXCHANGE_RATES_TO_SGD = {
  SGD: 1.0,      // Singapore Dollar (base currency)
  USD: 1.35,     // US Dollar
  EUR: 1.48,     // Euro
  GBP: 1.71,     // British Pound
  CNY: 0.19,     // Chinese Yuan
  JPY: 0.0092,   // Japanese Yen
  THB: 0.040,    // Thai Baht
  HKD: 0.17,     // Hong Kong Dollar
  MYR: 0.29,     // Malaysian Ringgit
  KRW: 0.0010,   // South Korean Won
  AUD: 0.89,     // Australian Dollar
  CAD: 0.99,     // Canadian Dollar
};

// Exchange rates to TWD (Taiwan Dollar)
const EXCHANGE_RATES_TO_TWD = {
  TWD: 1.0,      // Taiwan Dollar (base currency)
  USD: 31.50,    // US Dollar
  EUR: 34.60,    // Euro
  GBP: 40.00,    // British Pound
  CNY: 4.37,     // Chinese Yuan
  JPY: 0.21,     // Japanese Yen
  THB: 0.94,     // Thai Baht
  SGD: 23.30,    // Singapore Dollar
  HKD: 4.02,     // Hong Kong Dollar
  MYR: 6.68,     // Malaysian Ringgit
  KRW: 0.024,    // South Korean Won
  AUD: 20.80,    // Australian Dollar
  CAD: 23.00,    // Canadian Dollar
};

// Exchange rates to USD (US Dollar)
const EXCHANGE_RATES_TO_USD = {
  USD: 1.0,      // US Dollar (base currency)
  EUR: 1.10,     // Euro
  GBP: 1.27,     // British Pound
  CNY: 0.14,     // Chinese Yuan
  JPY: 0.0067,   // Japanese Yen
  THB: 0.030,    // Thai Baht
  SGD: 0.74,     // Singapore Dollar
  HKD: 0.13,     // Hong Kong Dollar
  MYR: 0.21,     // Malaysian Ringgit
  TWD: 0.032,    // Taiwan Dollar
  KRW: 0.00075,  // South Korean Won
  AUD: 0.66,     // Australian Dollar
  CAD: 0.73,     // Canadian Dollar
};

// Map country codes to their exchange rate tables
const COUNTRY_EXCHANGE_RATES = {
  thailand: EXCHANGE_RATES_TO_THB,
  malaysia: EXCHANGE_RATES_TO_MYR,
  hongkong: EXCHANGE_RATES_TO_HKD,
  singapore: EXCHANGE_RATES_TO_SGD,
  taiwan: EXCHANGE_RATES_TO_TWD,
  usa: EXCHANGE_RATES_TO_USD,
  // Add more countries as needed
};

/**
 * Convert an amount from one currency to another
 *
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - The source currency code (e.g., 'USD', 'EUR')
 * @param {string} toCurrency - The target currency code (e.g., 'THB', 'MYR')
 * @returns {number} The converted amount
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!amount || amount === 0) {
return 0;
}
  if (!fromCurrency || !toCurrency) {
return amount;
}

  // Normalize currency codes to uppercase
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // If same currency, no conversion needed
  if (from === to) {
return amount;
}

  // Get the appropriate exchange rate table based on target currency
  let ratesTable;
  switch (to) {
    case 'THB':
      ratesTable = EXCHANGE_RATES_TO_THB;
      break;
    case 'MYR':
      ratesTable = EXCHANGE_RATES_TO_MYR;
      break;
    case 'HKD':
      ratesTable = EXCHANGE_RATES_TO_HKD;
      break;
    case 'SGD':
      ratesTable = EXCHANGE_RATES_TO_SGD;
      break;
    case 'TWD':
      ratesTable = EXCHANGE_RATES_TO_TWD;
      break;
    case 'USD':
      ratesTable = EXCHANGE_RATES_TO_USD;
      break;
    default:
      console.warn(`No exchange rate table found for ${to}, using THB as default`);
      ratesTable = EXCHANGE_RATES_TO_THB;
  }

  // Get the exchange rate for the source currency
  const rate = ratesTable[from];

  if (!rate) {
    console.warn(`No exchange rate found for ${from} to ${to}, returning original amount`);
    return amount;
  }

  // Convert the amount
  const convertedAmount = amount * rate;

  return convertedAmount;
};

/**
 * Convert an amount to a country's local currency
 *
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - The source currency code
 * @param {string} country - The country code (e.g., 'thailand', 'malaysia')
 * @returns {number} The converted amount in the country's currency
 */
export const convertToCountryCurrency = (amount, fromCurrency, country) => {
  // Map country to its currency
  const countryCurrencyMap = {
    th: 'THB',
    my: 'MYR',
    hk: 'HKD',
    sg: 'SGD',
    tw: 'TWD',
    us: 'USD',
    jp: 'JPY',
    vn: 'VND',
    kr: 'KRW',
  };

  const toCurrency = countryCurrencyMap[country] || 'THB';
  return convertCurrency(amount, fromCurrency, toCurrency);
};

/**
 * Calculate total funds by converting all amounts to a target currency
 *
 * @param {Array} funds - Array of fund objects with amount and currency
 * @param {string} targetCurrency - The target currency code (e.g., 'THB', 'MYR')
 * @returns {number} The total amount in the target currency
 */
export const calculateTotalFundsInCurrency = (funds, targetCurrency) => {
  if (!Array.isArray(funds)) {
return 0;
}

  return funds.reduce((total, fund) => {
    const amount = Number(fund?.amount);
    if (Number.isNaN(amount) || amount === 0) {
return total;
}

    const currency = fund?.currency || targetCurrency;
    const convertedAmount = convertCurrency(amount, currency, targetCurrency);

    return total + convertedAmount;
  }, 0);
};

/**
 * Calculate total funds for a specific country (converts to country's currency)
 *
 * @param {Array} funds - Array of fund objects with amount and currency
 * @param {string} country - The country code (e.g., 'thailand', 'malaysia')
 * @returns {number} The total amount in the country's currency
 */
export const calculateTotalFundsForCountry = (funds, country = 'th') => {
  // Map country to its currency
  const countryCurrencyMap = {
    th: 'THB',
    my: 'MYR',
    hk: 'HKD',
    sg: 'SGD',
    tw: 'TWD',
    us: 'USD',
    jp: 'JPY',
    vn: 'VND',
    kr: 'KRW',
  };

  const targetCurrency = countryCurrencyMap[country] || 'THB';
  return calculateTotalFundsInCurrency(funds, targetCurrency);
};

/**
 * Get the currency code for a country
 *
 * @param {string} country - The country code
 * @returns {string} The currency code
 */
export const getCountryCurrency = (country) => {
  const countryCurrencyMap = {
    th: 'THB',
    my: 'MYR',
    hk: 'HKD',
    sg: 'SGD',
    tw: 'TWD',
    us: 'USD',
    jp: 'JPY',
    vn: 'VND',
    kr: 'KRW',
  };

  return countryCurrencyMap[country] || 'THB';
};

export default {
  convertCurrency,
  convertToCountryCurrency,
  calculateTotalFundsInCurrency,
  calculateTotalFundsForCountry,
  getCountryCurrency,
};
