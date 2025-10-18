// 入境通 - Number Formatting Utility
// Provides locale-aware number formatting for the progressive entry flow

/**
 * Number formatting utility with internationalization support
 * Handles thousands separators, decimal points, and locale-specific formatting
 */
class NumberFormatter {
  /**
   * Format a number according to locale conventions
   * @param {number} number - Number to format
   * @param {string} locale - Locale code (e.g., 'zh-CN', 'en', 'es')
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number string
   */
  static formatNumber(number, locale = 'en', options = {}) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }

    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      useGrouping = true,
      style = 'decimal'
    } = options;

    try {
      const normalizedLocale = this.normalizeLocale(locale);
      
      const formatOptions = {
        style,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      };

      return new Intl.NumberFormat(normalizedLocale, formatOptions).format(number);
    } catch (error) {
      console.warn('Number formatting error:', error);
      return this.formatNumberFallback(number, locale, options);
    }
  }

  /**
   * Fallback number formatting for unsupported locales
   * @param {number} number - Number to format
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number string
   */
  static formatNumberFallback(number, locale, options = {}) {
    const { maximumFractionDigits = 2, useGrouping = true } = options;
    
    // Round to specified decimal places
    const rounded = Math.round(number * Math.pow(10, maximumFractionDigits)) / Math.pow(10, maximumFractionDigits);
    let formatted = rounded.toString();

    // Add thousands separators if requested
    if (useGrouping) {
      const parts = formatted.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1] || '';

      // Get separator based on locale
      const separator = this.getThousandsSeparator(locale);
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      
      formatted = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }

    return formatted;
  }

  /**
   * Get thousands separator for a locale
   * @param {string} locale - Locale code
   * @returns {string} Thousands separator character
   */
  static getThousandsSeparator(locale) {
    const separators = {
      'zh-CN': ',',
      'zh-TW': ',',
      'zh': ',',
      'en': ',',
      'es': '.',
      'fr': ' ',
      'de': '.'
    };

    return separators[this.normalizeLocale(locale)] || ',';
  }

  /**
   * Get decimal separator for a locale
   * @param {string} locale - Locale code
   * @returns {string} Decimal separator character
   */
  static getDecimalSeparator(locale) {
    const separators = {
      'zh-CN': '.',
      'zh-TW': '.',
      'zh': '.',
      'en': '.',
      'es': ',',
      'fr': ',',
      'de': ','
    };

    return separators[this.normalizeLocale(locale)] || '.';
  }

  /**
   * Format percentage with locale-specific formatting
   * @param {number} number - Number to format as percentage (0.75 = 75%)
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted percentage string
   */
  static formatPercentage(number, locale = 'en', options = {}) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }

    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 1
    } = options;

    try {
      const normalizedLocale = this.normalizeLocale(locale);
      
      const formatOptions = {
        style: 'percent',
        minimumFractionDigits,
        maximumFractionDigits
      };

      return new Intl.NumberFormat(normalizedLocale, formatOptions).format(number);
    } catch (error) {
      console.warn('Percentage formatting error:', error);
      return this.formatPercentageFallback(number, locale, options);
    }
  }

  /**
   * Fallback percentage formatting
   * @param {number} number - Number to format as percentage
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted percentage string
   */
  static formatPercentageFallback(number, locale, options = {}) {
    const { maximumFractionDigits = 1 } = options;
    const percentage = number * 100;
    const rounded = Math.round(percentage * Math.pow(10, maximumFractionDigits)) / Math.pow(10, maximumFractionDigits);
    
    const percentSymbols = {
      'zh-CN': '%',
      'zh-TW': '%',
      'zh': '%',
      'en': '%',
      'es': '%',
      'fr': ' %',
      'de': ' %'
    };

    const symbol = percentSymbols[this.normalizeLocale(locale)] || '%';
    return `${rounded}${symbol}`;
  }

  /**
   * Format large numbers with appropriate units (K, M, B)
   * @param {number} number - Number to format
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number with units
   */
  static formatLargeNumber(number, locale = 'en', options = {}) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }

    const { precision = 1 } = options;
    const normalizedLocale = this.normalizeLocale(locale);

    const units = {
      'zh-CN': [
        { value: 1e8, symbol: '亿' },
        { value: 1e4, symbol: '万' },
        { value: 1e3, symbol: '千' }
      ],
      'zh-TW': [
        { value: 1e8, symbol: '億' },
        { value: 1e4, symbol: '萬' },
        { value: 1e3, symbol: '千' }
      ],
      'zh': [
        { value: 1e8, symbol: '亿' },
        { value: 1e4, symbol: '万' },
        { value: 1e3, symbol: '千' }
      ],
      'en': [
        { value: 1e9, symbol: 'B' },
        { value: 1e6, symbol: 'M' },
        { value: 1e3, symbol: 'K' }
      ],
      'es': [
        { value: 1e9, symbol: 'B' },
        { value: 1e6, symbol: 'M' },
        { value: 1e3, symbol: 'K' }
      ],
      'fr': [
        { value: 1e9, symbol: 'Md' },
        { value: 1e6, symbol: 'M' },
        { value: 1e3, symbol: 'k' }
      ],
      'de': [
        { value: 1e9, symbol: 'Mrd' },
        { value: 1e6, symbol: 'Mio' },
        { value: 1e3, symbol: 'T' }
      ]
    };

    const localeUnits = units[normalizedLocale] || units['en'];

    for (const unit of localeUnits) {
      if (Math.abs(number) >= unit.value) {
        const formatted = (number / unit.value).toFixed(precision);
        return `${formatted}${unit.symbol}`;
      }
    }

    return this.formatNumber(number, locale);
  }

  /**
   * Format ordinal numbers (1st, 2nd, 3rd, etc.)
   * @param {number} number - Number to format as ordinal
   * @param {string} locale - Locale code
   * @returns {string} Formatted ordinal number
   */
  static formatOrdinal(number, locale = 'en') {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }

    const normalizedLocale = this.normalizeLocale(locale);

    // Chinese doesn't use ordinal suffixes in the same way
    if (normalizedLocale.startsWith('zh')) {
      return `第${number}`;
    }

    try {
      // Use Intl.PluralRules for proper ordinal formatting
      const pr = new Intl.PluralRules(normalizedLocale, { type: 'ordinal' });
      const rule = pr.select(number);

      const suffixes = {
        en: {
          one: 'st',
          two: 'nd',
          few: 'rd',
          other: 'th'
        },
        es: {
          one: 'º',
          other: 'º'
        },
        fr: {
          one: 'er',
          other: 'e'
        },
        de: {
          other: '.'
        }
      };

      const localeSuffixes = suffixes[normalizedLocale.split('-')[0]] || suffixes['en'];
      const suffix = localeSuffixes[rule] || localeSuffixes['other'];

      return `${number}${suffix}`;
    } catch (error) {
      console.warn('Ordinal formatting error:', error);
      return this.formatOrdinalFallback(number, locale);
    }
  }

  /**
   * Fallback ordinal formatting
   * @param {number} number - Number to format as ordinal
   * @param {string} locale - Locale code
   * @returns {string} Formatted ordinal number
   */
  static formatOrdinalFallback(number, locale) {
    const normalizedLocale = this.normalizeLocale(locale);

    if (normalizedLocale.startsWith('zh')) {
      return `第${number}`;
    }

    // English ordinal rules
    if (normalizedLocale === 'en') {
      const lastDigit = number % 10;
      const lastTwoDigits = number % 100;

      if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return `${number}th`;
      }

      switch (lastDigit) {
        case 1: return `${number}st`;
        case 2: return `${number}nd`;
        case 3: return `${number}rd`;
        default: return `${number}th`;
      }
    }

    // Default fallback
    return `${number}.`;
  }

  /**
   * Parse a formatted number string back to a number
   * @param {string} formattedNumber - Formatted number string
   * @param {string} locale - Locale code
   * @returns {number|null} Parsed number or null if invalid
   */
  static parseNumber(formattedNumber, locale = 'en') {
    if (!formattedNumber || typeof formattedNumber !== 'string') {
      return null;
    }

    const normalizedLocale = this.normalizeLocale(locale);
    
    // Remove thousands separators and normalize decimal separator
    const thousandsSep = this.getThousandsSeparator(normalizedLocale);
    const decimalSep = this.getDecimalSeparator(normalizedLocale);
    
    let cleaned = formattedNumber
      .replace(new RegExp(`\\${thousandsSep}`, 'g'), '')
      .replace(decimalSep, '.');

    // Remove any non-numeric characters except decimal point and minus sign
    cleaned = cleaned.replace(/[^\d.-]/g, '');

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Format a range of numbers
   * @param {number} start - Start of range
   * @param {number} end - End of range
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted range string
   */
  static formatRange(start, end, locale = 'en', options = {}) {
    if (start === null || start === undefined || end === null || end === undefined) {
      return '';
    }

    const formattedStart = this.formatNumber(start, locale, options);
    const formattedEnd = this.formatNumber(end, locale, options);

    const rangeSeparators = {
      'zh-CN': ' - ',
      'zh-TW': ' - ',
      'zh': ' - ',
      'en': ' - ',
      'es': ' - ',
      'fr': ' - ',
      'de': ' - '
    };

    const separator = rangeSeparators[this.normalizeLocale(locale)] || ' - ';
    return `${formattedStart}${separator}${formattedEnd}`;
  }

  /**
   * Normalize locale codes for consistent handling
   * @param {string} locale - Input locale code
   * @returns {string} Normalized locale code
   */
  static normalizeLocale(locale) {
    if (!locale) return 'en';
    
    // Handle common variations
    const localeMap = {
      'zh': 'zh-CN',
      'zh-Hans': 'zh-CN',
      'zh-Hant': 'zh-TW',
      'zh-HK': 'zh-TW'
    };
    
    return localeMap[locale] || locale;
  }

  /**
   * Format currency with locale-specific formatting
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (e.g., 'USD', 'CNY', 'THB')
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount, currency, locale = 'en', options = {}) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '';
    }

    const {
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay = 'symbol' // 'symbol', 'code', 'name'
    } = options;

    try {
      const normalizedLocale = this.normalizeLocale(locale);
      
      const formatOptions = {
        style: 'currency',
        currency: currency.toUpperCase(),
        currencyDisplay
      };

      // Set fraction digits based on currency if not specified
      if (minimumFractionDigits !== undefined) {
        formatOptions.minimumFractionDigits = minimumFractionDigits;
      }
      if (maximumFractionDigits !== undefined) {
        formatOptions.maximumFractionDigits = maximumFractionDigits;
      } else {
        // Default fraction digits for common currencies
        const defaultFractionDigits = this.getCurrencyFractionDigits(currency);
        formatOptions.maximumFractionDigits = defaultFractionDigits;
        if (minimumFractionDigits === undefined) {
          formatOptions.minimumFractionDigits = defaultFractionDigits;
        }
      }

      return new Intl.NumberFormat(normalizedLocale, formatOptions).format(amount);
    } catch (error) {
      console.warn('Currency formatting error:', error);
      return this.formatCurrencyFallback(amount, currency, locale, options);
    }
  }

  /**
   * Get default fraction digits for a currency
   * @param {string} currency - Currency code
   * @returns {number} Default fraction digits
   */
  static getCurrencyFractionDigits(currency) {
    const fractionDigits = {
      // Major currencies
      'USD': 2, 'EUR': 2, 'GBP': 2, 'JPY': 0, 'CNY': 2, 'KRW': 0,
      // Asian currencies
      'THB': 2, 'SGD': 2, 'MYR': 2, 'HKD': 2, 'TWD': 0, 'PHP': 2,
      'IDR': 0, 'VND': 0, 'INR': 2,
      // Other common currencies
      'CAD': 2, 'AUD': 2, 'CHF': 2, 'SEK': 2, 'NOK': 2, 'DKK': 2,
      'PLN': 2, 'CZK': 2, 'HUF': 0, 'RUB': 2, 'BRL': 2, 'MXN': 2
    };

    return fractionDigits[currency.toUpperCase()] || 2;
  }

  /**
   * Fallback currency formatting
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  static formatCurrencyFallback(amount, currency, locale, options = {}) {
    const { currencyDisplay = 'symbol' } = options;
    const normalizedLocale = this.normalizeLocale(locale);
    
    // Get currency symbol or code
    const currencyInfo = this.getCurrencyInfo(currency, currencyDisplay);
    
    // Format the number part
    const fractionDigits = this.getCurrencyFractionDigits(currency);
    const formattedAmount = this.formatNumber(amount, locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    });

    // Position symbol based on locale and currency
    const symbolPosition = this.getCurrencySymbolPosition(currency, normalizedLocale);
    
    if (symbolPosition === 'before') {
      return `${currencyInfo}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currencyInfo}`;
    }
  }

  /**
   * Get currency symbol or code
   * @param {string} currency - Currency code
   * @param {string} display - Display type ('symbol', 'code', 'name')
   * @returns {string} Currency symbol or code
   */
  static getCurrencyInfo(currency, display = 'symbol') {
    const currencyData = {
      'USD': { symbol: '$', code: 'USD', name: 'US Dollar' },
      'EUR': { symbol: '€', code: 'EUR', name: 'Euro' },
      'GBP': { symbol: '£', code: 'GBP', name: 'British Pound' },
      'JPY': { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
      'CNY': { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
      'KRW': { symbol: '₩', code: 'KRW', name: 'Korean Won' },
      'THB': { symbol: '฿', code: 'THB', name: 'Thai Baht' },
      'SGD': { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
      'MYR': { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
      'HKD': { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
      'TWD': { symbol: 'NT$', code: 'TWD', name: 'Taiwan Dollar' },
      'PHP': { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
      'IDR': { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
      'VND': { symbol: '₫', code: 'VND', name: 'Vietnamese Dong' },
      'INR': { symbol: '₹', code: 'INR', name: 'Indian Rupee' }
    };

    const info = currencyData[currency.toUpperCase()];
    if (!info) {
      return currency.toUpperCase();
    }

    switch (display) {
      case 'symbol': return info.symbol;
      case 'code': return info.code;
      case 'name': return info.name;
      default: return info.symbol;
    }
  }

  /**
   * Get currency symbol position for a locale
   * @param {string} currency - Currency code
   * @param {string} locale - Locale code
   * @returns {string} Position ('before' or 'after')
   */
  static getCurrencySymbolPosition(currency, locale) {
    // Most Western currencies go before the amount
    const beforeCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'HKD', 'TWD'];
    
    // Some Asian currencies go after, especially in their home locales
    if (locale.startsWith('zh') && ['CNY', 'HKD', 'TWD'].includes(currency)) {
      return 'after';
    }
    
    if (beforeCurrencies.includes(currency)) {
      return 'before';
    }
    
    return 'after';
  }

  /**
   * Format multiple currencies (e.g., for fund displays)
   * @param {Array} amounts - Array of {amount, currency} objects
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} Formatted multi-currency string
   */
  static formatMultipleCurrencies(amounts, locale = 'en', options = {}) {
    if (!amounts || !Array.isArray(amounts) || amounts.length === 0) {
      return '';
    }

    const { separator = ' + ', showTotal = false } = options;
    
    const formatted = amounts
      .filter(item => item.amount && item.currency)
      .map(item => this.formatCurrency(item.amount, item.currency, locale, options));

    if (formatted.length === 0) {
      return '';
    }

    const result = formatted.join(separator);
    
    if (showTotal && amounts.length > 1) {
      // Calculate total in base currency (first currency)
      const baseCurrency = amounts[0].currency;
      const total = amounts.reduce((sum, item) => {
        // In a real app, you'd convert currencies here
        // For now, just sum if same currency
        if (item.currency === baseCurrency) {
          return sum + item.amount;
        }
        return sum;
      }, 0);
      
      if (total > amounts[0].amount) {
        const totalFormatted = this.formatCurrency(total, baseCurrency, locale, options);
        const totalLabel = this.getTotalLabel(locale);
        return `${result} (${totalLabel}: ${totalFormatted})`;
      }
    }
    
    return result;
  }

  /**
   * Get "Total" label for a locale
   * @param {string} locale - Locale code
   * @returns {string} Localized "Total" label
   */
  static getTotalLabel(locale) {
    const labels = {
      'zh-CN': '总计',
      'zh-TW': '總計',
      'zh': '总计',
      'en': 'Total',
      'es': 'Total',
      'fr': 'Total',
      'de': 'Gesamt'
    };

    return labels[this.normalizeLocale(locale)] || labels['en'];
  }

  /**
   * Parse currency string back to amount and currency
   * @param {string} currencyString - Formatted currency string
   * @param {string} locale - Locale code
   * @returns {Object|null} {amount, currency} or null if invalid
   */
  static parseCurrency(currencyString, locale = 'en') {
    if (!currencyString || typeof currencyString !== 'string') {
      return null;
    }

    // Try to extract currency code or symbol
    const currencyRegex = /([A-Z]{3})|([¥$€£₩฿₱₫₹]|S\$|HK\$|NT\$|RM|Rp)/g;
    const currencyMatches = currencyString.match(currencyRegex);
    
    if (!currencyMatches || currencyMatches.length === 0) {
      return null;
    }

    const currencySymbol = currencyMatches[0];
    
    // Remove currency symbol and parse number
    const numberPart = currencyString.replace(currencyRegex, '').trim();
    const amount = this.parseNumber(numberPart, locale);
    
    if (amount === null) {
      return null;
    }

    // Convert symbol back to currency code
    const currency = this.symbolToCurrency(currencySymbol);
    
    return { amount, currency };
  }

  /**
   * Convert currency symbol to currency code
   * @param {string} symbol - Currency symbol
   * @returns {string} Currency code
   */
  static symbolToCurrency(symbol) {
    const symbolMap = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'CNY', // Default to CNY, could be JPY
      '₩': 'KRW',
      '฿': 'THB',
      'S$': 'SGD',
      'RM': 'MYR',
      'HK$': 'HKD',
      'NT$': 'TWD',
      '₱': 'PHP',
      'Rp': 'IDR',
      '₫': 'VND',
      '₹': 'INR'
    };

    return symbolMap[symbol] || symbol;
  }

  /**
   * Get formatting examples for a locale including currency
   * @param {string} locale - Locale code
   * @returns {Object} Examples of formatted numbers and currencies
   */
  static getFormattingExamples(locale = 'en') {
    const testNumber = 1234567.89;
    const testPercentage = 0.75;
    const testLargeNumber = 1500000;
    const testAmount = 1234.56;

    return {
      number: this.formatNumber(testNumber, locale),
      percentage: this.formatPercentage(testPercentage, locale),
      largeNumber: this.formatLargeNumber(testLargeNumber, locale),
      ordinal: this.formatOrdinal(3, locale),
      range: this.formatRange(100, 200, locale),
      currency: {
        usd: this.formatCurrency(testAmount, 'USD', locale),
        cny: this.formatCurrency(testAmount, 'CNY', locale),
        thb: this.formatCurrency(testAmount, 'THB', locale),
        eur: this.formatCurrency(testAmount, 'EUR', locale)
      },
      multipleCurrencies: this.formatMultipleCurrencies([
        { amount: 1000, currency: 'USD' },
        { amount: 50000, currency: 'THB' }
      ], locale)
    };
  }
}

export default NumberFormatter;