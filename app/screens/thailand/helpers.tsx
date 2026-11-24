/**
 * Thailand Screens Helper Functions
 *
 * Centralized null-safe helper functions for data formatting and access
 * Prevents runtime errors from undefined/null values
 */

export type SafeUnknown = Record<string, unknown> | unknown[] | null | undefined;

type CurrencyFormatOptions = {
  locale?: string;
  decimals?: number;
  showSymbol?: boolean;
  defaultValue?: string;
};

type DateFormatPreset = 'short' | 'medium' | 'long' | 'full';

type DateFormatOptions = {
  locale?: string;
  format?: DateFormatPreset;
  defaultValue?: string;
};

type PassportNameParts = {
  surname?: string | null;
  middleName?: string | null;
  givenName?: string | null;
};

/**
 * Safely get a nested property from an object
 * @param {Object} obj - The object to get the property from
 * @param {string} path - Dot-notation path to the property (e.g., 'user.profile.name')
 * @param {*} defaultValue - Default value if property is not found
 * @returns {*} The property value or default value
 *
 * @example
 * safeGet(user, 'profile.name', 'Unknown')
 * safeGet(data, 'items.0.value', null)
 */
export const safeGet = <T,>(obj: SafeUnknown, path: string, defaultValue: T | null = null): T | null => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  if (!path || typeof path !== 'string') {
    return defaultValue;
  }

  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (Array.isArray(result)) {
      const index = Number.parseInt(key, 10);
      if (Number.isNaN(index) || index < 0 || index >= result.length) {
        return defaultValue;
      }
      result = result[index];
    } else if (result && typeof result === 'object' && key in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }

    if (result === null || result === undefined) {
      return defaultValue;
    }
  }

  return result as T;
};

/**
 * Get full name from passport data with proper null checking
 */
export const getFullName = (passportData: PassportNameParts | null | undefined, defaultValue = 'N/A'): string => {
  if (!passportData || typeof passportData !== 'object') {
    return defaultValue;
  }

  const { surname, middleName, givenName } = passportData;

  const nameParts = [surname, middleName, givenName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());

  return nameParts.length > 0 ? nameParts.join(' ') : defaultValue;
};

/**
 * Format currency amount with proper null checking and currency symbol
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: string | null | undefined,
  options: CurrencyFormatOptions = {}
): string => {
  const {
    locale = 'en-US',
    decimals = 2,
    showSymbol = true,
    defaultValue = '0.00',
  } = options;

  const numAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  if (typeof numAmount !== 'number' || Number.isNaN(numAmount) || !Number.isFinite(numAmount)) {
    return defaultValue;
  }

  if (!currency || typeof currency !== 'string') {
    return numAmount.toFixed(decimals);
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency.toUpperCase() : undefined,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return formatter.format(numAmount);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to format currency: ${message}`);
    return `${currency} ${numAmount.toFixed(decimals)}`;
  }
};

/**
 * Format date string with proper null checking
 */
export const formatDate = (
  date: string | Date | null | undefined,
  options: DateFormatOptions = {}
): string => {
  const { locale = 'en-US', format = 'medium', defaultValue = 'N/A' } = options;

  if (!date) {
    return defaultValue;
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(dateObj.getTime())) {
      return defaultValue;
    }

    const formatOptions: Record<DateFormatPreset, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    };

    const formatter = new Intl.DateTimeFormat(locale, formatOptions[format] ?? formatOptions.medium);
    return formatter.format(dateObj);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to format date: ${message}`);
    return defaultValue;
  }
};

/**
 * Safely convert a value to a string
 */
export const safeString = (value: unknown, defaultValue = ''): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return defaultValue;
};

/**
 * Safely get an array from a value, ensuring it's always an array
 */
export const safeArray = <T,>(value: T[] | null | undefined, defaultValue: T[] = []): T[] =>
  Array.isArray(value) ? value : defaultValue;

/**
 * Safely parse a number from a value
 */
export const safeNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }

  return false;
};

export default {
  safeGet,
  getFullName,
  formatCurrency,
  formatDate,
  safeString,
  safeArray,
  safeNumber,
  isEmpty,
};
