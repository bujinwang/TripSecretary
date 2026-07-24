/**
 * Currency Converter Utility
 *
 * Provides currency conversion functionality for calculating total funds
 * across multiple currencies.
 *
 * NOTE: Exchange rates are approximate and should be updated periodically.
 * Last updated: 2025-01-26
 */

const EXCHANGE_RATES_TO_THB: Record<string, number> = {
  THB: 1.0,
  USD: 33.50,
  EUR: 36.80,
  GBP: 42.50,
  CNY: 4.65,
  JPY: 0.23,
  SGD: 24.80,
  HKD: 4.28,
  KRW: 0.025,
  AUD: 22.10,
  CAD: 24.50,
};

const EXCHANGE_RATES_TO_MYR: Record<string, number> = {
  MYR: 1.0,
  USD: 4.72,
  EUR: 5.18,
  GBP: 5.98,
  CNY: 0.65,
  JPY: 0.032,
  THB: 0.14,
  SGD: 3.49,
  HKD: 0.60,
  KRW: 0.0035,
  AUD: 3.11,
  CAD: 3.45,
};

const EXCHANGE_RATES_TO_HKD: Record<string, number> = {
  HKD: 1.0,
  USD: 7.82,
  EUR: 8.59,
  GBP: 9.92,
  CNY: 1.08,
  JPY: 0.053,
  THB: 0.23,
  SGD: 5.79,
  MYR: 1.66,
  KRW: 0.0058,
  AUD: 5.16,
  CAD: 5.73,
};

const EXCHANGE_RATES_TO_SGD: Record<string, number> = {
  SGD: 1.0,
  USD: 1.35,
  EUR: 1.48,
  GBP: 1.71,
  CNY: 0.19,
  JPY: 0.0092,
  THB: 0.040,
  HKD: 0.17,
  MYR: 0.29,
  KRW: 0.0010,
  AUD: 0.89,
  CAD: 0.99,
};

const EXCHANGE_RATES_TO_TWD: Record<string, number> = {
  TWD: 1.0,
  USD: 31.50,
  EUR: 34.60,
  GBP: 40.00,
  CNY: 4.37,
  JPY: 0.21,
  THB: 0.94,
  SGD: 23.30,
  HKD: 4.02,
  MYR: 6.68,
  KRW: 0.024,
  AUD: 20.80,
  CAD: 23.00,
};

const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.10,
  GBP: 1.27,
  CNY: 0.14,
  JPY: 0.0067,
  THB: 0.030,
  SGD: 0.74,
  HKD: 0.13,
  MYR: 0.21,
  TWD: 0.032,
  KRW: 0.00075,
  AUD: 0.66,
  CAD: 0.73,
};

interface FundItem {
  amount?: number | string;
  currency?: string;
  [key: string]: unknown;
}

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (!amount || amount === 0) {
    return 0;
  }
  if (!fromCurrency || !toCurrency) {
    return amount;
  }

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) {
    return amount;
  }

  let ratesTable: Record<string, number>;
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

  const rate = ratesTable[from];

  if (!rate) {
    console.warn(`No exchange rate found for ${from} to ${to}, returning original amount`);
    return amount;
  }

  return amount * rate;
};

export const convertToCountryCurrency = (amount: number, fromCurrency: string, country: string): number => {
  const countryCurrencyMap: Record<string, string> = {
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

export const calculateTotalFundsInCurrency = (funds: FundItem[], targetCurrency: string): number => {
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

export const calculateTotalFundsForCountry = (funds: FundItem[], country = 'th'): number => {
  const countryCurrencyMap: Record<string, string> = {
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

export const getCountryCurrency = (country: string): string => {
  const countryCurrencyMap: Record<string, string> = {
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
