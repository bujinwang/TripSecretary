/**
 * Thailand Screens Helper Functions
 *
 * Centralized null-safe helper functions for data formatting and access
 * Prevents runtime errors from undefined/null values
 */

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
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  if (!path || typeof path !== 'string') {
    return defaultValue;
  }

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    // Handle array indices
    if (Array.isArray(result)) {
      const index = parseInt(key, 10);
      if (isNaN(index) || index < 0 || index >= result.length) {
        return defaultValue;
      }
      result = result[index];
    } else if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }

    // If we hit null/undefined before reaching the end, return default
    if (result === null || result === undefined) {
      return defaultValue;
    }
  }

  return result;
};

/**
 * Get full name from passport data with proper null checking
 * Combines surname, middle name, and given name
 *
 * @param {Object} passportData - Passport data object
 * @param {string} passportData.surname - Last name
 * @param {string} passportData.middleName - Middle name (optional)
 * @param {string} passportData.givenName - First name
 * @param {string} defaultValue - Default value if no name parts exist
 * @returns {string} Full name or default value
 *
 * @example
 * getFullName({ surname: 'Smith', givenName: 'John' }) // "Smith John"
 * getFullName({ surname: 'Wang', middleName: 'Wei', givenName: 'Li' }) // "Wang Wei Li"
 * getFullName({}) // "N/A"
 */
export const getFullName = (passportData, defaultValue = 'N/A') => {
  if (!passportData || typeof passportData !== 'object') {
    return defaultValue;
  }

  const { surname, middleName, givenName } = passportData;

  // Collect non-empty name parts
  const nameParts = [surname, middleName, givenName]
    .filter(part => part && typeof part === 'string' && part.trim().length > 0)
    .map(part => part.trim());

  // Return joined name or default value
  return nameParts.length > 0 ? nameParts.join(' ') : defaultValue;
};

/**
 * Format currency amount with proper null checking and currency symbol
 *
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (e.g., 'CNY', 'USD', 'THB')
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for number formatting (default: 'en-US')
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @param {boolean} options.showSymbol - Whether to show currency symbol (default: true)
 * @param {string} options.defaultValue - Value to return if amount is invalid
 * @returns {string} Formatted currency string
 *
 * @example
 * formatCurrency(10000, 'CNY') // "¥10,000.00"
 * formatCurrency(50.5, 'USD') // "$50.50"
 * formatCurrency('invalid', 'THB', { defaultValue: '฿0.00' }) // "฿0.00"
 */
export const formatCurrency = (amount, currency, options = {}) => {
  const {
    locale = 'en-US',
    decimals = 2,
    showSymbol = true,
    defaultValue = '0.00',
  } = options;

  // Validate and parse amount
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (typeof numAmount !== 'number' || isNaN(numAmount) || !isFinite(numAmount)) {
    return defaultValue;
  }

  // Validate currency
  if (!currency || typeof currency !== 'string') {
    return numAmount.toFixed(decimals);
  }

  try {
    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency.toUpperCase() : undefined,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return formatter.format(numAmount);
  } catch (error) {
    // Fallback if Intl.NumberFormat fails (invalid currency code, etc.)
    console.warn(`Failed to format currency: ${error.message}`);
    return `${currency} ${numAmount.toFixed(decimals)}`;
  }
};

/**
 * Format date string with proper null checking
 *
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for date formatting (default: 'en-US')
 * @param {string} options.format - Format style: 'short', 'medium', 'long', 'full' (default: 'medium')
 * @param {string} options.defaultValue - Value to return if date is invalid
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate(new Date(), { format: 'long' }) // "January 15, 2024"
 * formatDate('invalid', { defaultValue: 'N/A' }) // "N/A"
 */
export const formatDate = (date, options = {}) => {
  const {
    locale = 'en-US',
    format = 'medium',
    defaultValue = 'N/A',
  } = options;

  if (!date) {
    return defaultValue;
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return defaultValue;
    }

    // Map format to Intl.DateTimeFormat options
    const formatOptions = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    };

    const formatter = new Intl.DateTimeFormat(locale, formatOptions[format] || formatOptions.medium);
    return formatter.format(dateObj);
  } catch (error) {
    console.warn(`Failed to format date: ${error.message}`);
    return defaultValue;
  }
};

/**
 * Safely convert a value to a string
 *
 * @param {*} value - Value to convert
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} String representation or default value
 *
 * @example
 * safeString(null, 'N/A') // "N/A"
 * safeString(123, '') // "123"
 * safeString(undefined, 'Unknown') // "Unknown"
 */
export const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'object') {
    // For objects/arrays, return default value to avoid [object Object]
    return defaultValue;
  }

  return defaultValue;
};

/**
 * Safely get an array from a value, ensuring it's always an array
 *
 * @param {*} value - Value that might be an array
 * @param {Array} defaultValue - Default array if value is not an array
 * @returns {Array} The array or default array
 *
 * @example
 * safeArray([1, 2, 3]) // [1, 2, 3]
 * safeArray(null, []) // []
 * safeArray('not an array', []) // []
 */
export const safeArray = (value, defaultValue = []) => {
  return Array.isArray(value) ? value : defaultValue;
};

/**
 * Safely parse a number from a value
 *
 * @param {*} value - Value to parse as number
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed number or default value
 *
 * @example
 * safeNumber('123', 0) // 123
 * safeNumber('invalid', 0) // 0
 * safeNumber(null, 0) // 0
 */
export const safeNumber = (value, defaultValue = 0) => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 *
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 *
 * @example
 * isEmpty(null) // true
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty('hello') // false
 * isEmpty([1, 2]) // false
 */
export const isEmpty = (value) => {
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
    return Object.keys(value).length === 0;
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
