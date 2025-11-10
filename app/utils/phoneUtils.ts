// @ts-nocheck

/**
 * Phone Number Parsing and Formatting Utilities
 *
 * Centralized utilities for parsing, formatting, and validating phone numbers
 * across different countries and formats.
 *
 * Supports:
 * - International format: +86 138 1234 5678
 * - National format: 138 1234 5678
 * - Various country codes: +86, +1, +852, +853, +66, etc.
 *
 * @module phoneUtils
 */

/**
 * @typedef {Object} ParsedPhoneNumber
 * @property {string} countryCode - Country code (e.g., '86', '1', '852')
 * @property {string} nationalNumber - National number without country code
 * @property {string} fullNumber - Full number including country code
 * @property {string} formatted - Formatted for display
 * @property {boolean} isValid - Whether the number appears valid
 * @property {string} [countryName] - Country name if recognized
 */

/**
 * Country code mappings
 * Maps country codes to country information
 */
const COUNTRY_CODES = {
  '86': { name: 'China', code: 'CHN', minLength: 11, maxLength: 11 },
  '1': { name: 'USA/Canada', code: 'USA', minLength: 10, maxLength: 10 },
  '852': { name: 'Hong Kong', code: 'HKG', minLength: 8, maxLength: 8 },
  '853': { name: 'Macau', code: 'MAC', minLength: 8, maxLength: 8 },
  '886': { name: 'Taiwan', code: 'TWN', minLength: 9, maxLength: 10 },
  '66': { name: 'Thailand', code: 'THA', minLength: 9, maxLength: 9 },
  '65': { name: 'Singapore', code: 'SGP', minLength: 8, maxLength: 8 },
  '60': { name: 'Malaysia', code: 'MYS', minLength: 9, maxLength: 10 },
  '81': { name: 'Japan', code: 'JPN', minLength: 10, maxLength: 10 },
  '82': { name: 'South Korea', code: 'KOR', minLength: 9, maxLength: 11 },
  '44': { name: 'United Kingdom', code: 'GBR', minLength: 10, maxLength: 10 },
  '33': { name: 'France', code: 'FRA', minLength: 9, maxLength: 9 },
  '49': { name: 'Germany', code: 'DEU', minLength: 10, maxLength: 11 },
};

/**
 * Extract country code from phone number
 *
 * Handles various formats:
 * - +86 138 1234 5678 → '86'
 * - 86 138 1234 5678 → '86'
 * - +1 234 567 8900 → '1'
 * - +852 1234 5678 → '852'
 *
 * @param {string} phoneNumber - Full phone number
 * @param {Object} [options] - Extraction options
 * @param {boolean} [options.strict=true] - Strict mode (require + or long number)
 * @returns {string} Country code or empty string
 *
 * @example
 * extractCountryCode("+86 138 1234 5678")
 * // → "86"
 */
export const extractCountryCode = (phoneNumber, options = {}) => {
  const { strict = true } = options;

  if (!phoneNumber) {
return '';
}

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.toString().replace(/[^\d+]/g, '');

  // Try to match known country codes
  // Check 3-digit codes first (e.g., +852, +853, +886)
  for (const [code, info] of Object.entries(COUNTRY_CODES)) {
    if (code.length === 3) {
      if (cleaned.startsWith(`+${code}`)) {
        return code;
      }
      if (!strict && cleaned.startsWith(code) && cleaned.length >= code.length + info.minLength) {
        return code;
      }
    }
  }

  // Check 2-digit codes (e.g., +86, +66, +65)
  for (const [code, info] of Object.entries(COUNTRY_CODES)) {
    if (code.length === 2) {
      if (cleaned.startsWith(`+${code}`)) {
        return code;
      }
      if (!strict && cleaned.startsWith(code) && cleaned.length >= code.length + info.minLength) {
        return code;
      }
    }
  }

  // Check 1-digit codes (e.g., +1 for USA/Canada)
  if (cleaned.startsWith('+1')) {
    return '1';
  }
  if (!strict && cleaned.startsWith('1') && cleaned.length > 11) {
    // Only treat as US/Canada code if it's a long number (1 + 10+ digits)
    return '1';
  }

  // Generic extraction for + prefix
  if (cleaned.startsWith('+')) {
    // Extract first 1-3 digits after +
    const match = cleaned.match(/^\+(\d{1,3})/);
    return match ? match[1] : '';
  }

  return ''; // No country code found
};

/**
 * Extract national number (without country code)
 *
 * @param {string} phoneNumber - Full phone number
 * @param {string} [countryCode] - Known country code (optional, will auto-detect if not provided)
 * @returns {string} National number without country code
 *
 * @example
 * extractNationalNumber("+86 138 1234 5678")
 * // → "13812345678"
 */
export const extractNationalNumber = (phoneNumber, countryCode = null) => {
  if (!phoneNumber) {
return '';
}

  const cleaned = phoneNumber.toString().replace(/[^\d+]/g, '');

  // If country code is provided, use it
  if (countryCode) {
    const codeWithPlus = `+${countryCode}`;
    if (cleaned.startsWith(codeWithPlus)) {
      return cleaned.substring(codeWithPlus.length);
    }
    if (cleaned.startsWith(countryCode)) {
      return cleaned.substring(countryCode.length);
    }
  }

  // Auto-detect country code and remove it
  const detectedCode = extractCountryCode(phoneNumber);
  if (detectedCode) {
    if (cleaned.startsWith(`+${detectedCode}`)) {
      return cleaned.substring(detectedCode.length + 1);
    }
    if (cleaned.startsWith(detectedCode)) {
      return cleaned.substring(detectedCode.length);
    }
  }

  // Remove any generic country code format
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/^\+\d{1,3}/, '');
  }

  return cleaned;
};

/**
 * Parse phone number into components
 *
 * @param {string} phoneNumber - Phone number to parse
 * @param {Object} [options] - Parsing options
 * @param {string} [options.defaultCountryCode] - Default country code if none detected
 * @param {boolean} [options.strict=true] - Strict validation mode
 * @returns {ParsedPhoneNumber} Parsed phone number components
 *
 * @example
 * parsePhoneNumber("+86 138 1234 5678")
 * // → {
 * //   countryCode: '86',
 * //   nationalNumber: '13812345678',
 * //   fullNumber: '+8613812345678',
 * //   formatted: '+86 138 1234 5678',
 * //   isValid: true,
 * //   countryName: 'China'
 * // }
 */
export const parsePhoneNumber = (phoneNumber, options = {}) => {
  const { defaultCountryCode = null, strict = true } = options;

  if (!phoneNumber) {
    return {
      countryCode: '',
      nationalNumber: '',
      fullNumber: '',
      formatted: '',
      isValid: false
    };
  }

  const countryCode = extractCountryCode(phoneNumber, { strict }) || defaultCountryCode || '';
  const nationalNumber = extractNationalNumber(phoneNumber, countryCode);
  const countryInfo = COUNTRY_CODES[countryCode];

  // Validate number length
  let isValid = false;
  if (countryInfo) {
    const numLength = nationalNumber.length;
    isValid = numLength >= countryInfo.minLength && numLength <= countryInfo.maxLength;
  } else if (nationalNumber.length >= 7 && nationalNumber.length <= 15) {
    // Generic validation for unknown countries
    isValid = true;
  }

  const fullNumber = countryCode ? `+${countryCode}${nationalNumber}` : nationalNumber;
  const formatted = formatPhoneNumber(fullNumber, { countryCode });

  return {
    countryCode,
    nationalNumber,
    fullNumber,
    formatted,
    isValid,
    countryName: countryInfo?.name
  };
};

/**
 * Format phone number for display
 *
 * @param {string} phoneNumber - Phone number to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.countryCode] - Country code for country-specific formatting
 * @param {string} [options.format='international'] - Format type: 'international', 'national', 'e164'
 * @returns {string} Formatted phone number
 *
 * @example
 * formatPhoneNumber("+8613812345678", { format: 'international' })
 * // → "+86 138 1234 5678"
 *
 * @example
 * formatPhoneNumber("13812345678", { countryCode: '86', format: 'national' })
 * // → "138 1234 5678"
 */
export const formatPhoneNumber = (phoneNumber, options = {}) => {
  const { countryCode, format = 'international' } = options;

  if (!phoneNumber) {
return '';
}

  const parsed = typeof phoneNumber === 'string'
    ? parsePhoneNumber(phoneNumber, { defaultCountryCode: countryCode })
    : phoneNumber;

  if (format === 'e164') {
    // E.164 format: +8613812345678
    return parsed.fullNumber;
  }

  if (format === 'national') {
    // National format: 138 1234 5678
    return formatNationalNumber(parsed.nationalNumber, parsed.countryCode);
  }

  // International format: +86 138 1234 5678
  if (!parsed.countryCode) {
    return formatNationalNumber(parsed.nationalNumber);
  }

  const formattedNational = formatNationalNumber(parsed.nationalNumber, parsed.countryCode);
  return `+${parsed.countryCode} ${formattedNational}`;
};

/**
 * Format national number with country-specific patterns
 *
 * @param {string} nationalNumber - National number
 * @param {string} [countryCode] - Country code for specific formatting
 * @returns {string} Formatted national number
 */
const formatNationalNumber = (nationalNumber, countryCode = null) => {
  if (!nationalNumber) {
return '';
}

  const cleaned = nationalNumber.replace(/\D/g, '');

  // Country-specific formatting
  switch (countryCode) {
    case '86': // China: 138 1234 5678
      if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
      }
      break;

    case '1': // USA/Canada: (234) 567-8900
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      break;

    case '852': // Hong Kong: 1234 5678
    case '853': // Macau: 1234 5678
      if (cleaned.length === 8) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      }
      break;

    case '66': // Thailand: 09 1234 5678
      if (cleaned.length === 9) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
      }
      break;

    case '65': // Singapore: 1234 5678
      if (cleaned.length === 8) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      }
      break;
  }

  // Generic formatting: insert space every 4 digits
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
};

/**
 * Validate phone number
 *
 * @param {string} phoneNumber - Phone number to validate
 * @param {Object} [options] - Validation options
 * @param {string} [options.countryCode] - Expected country code
 * @param {number} [options.minLength=7] - Minimum length
 * @param {number} [options.maxLength=15] - Maximum length
 * @returns {Object} Validation result
 *
 * @example
 * validatePhoneNumber("+86 138 1234 5678")
 * // → { isValid: true, errors: [] }
 */
export const validatePhoneNumber = (phoneNumber, options = {}) => {
  const {
    countryCode = null,
    minLength = 7,
    maxLength = 15
  } = options;

  const errors = [];

  if (!phoneNumber) {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }

  const parsed = parsePhoneNumber(phoneNumber, { defaultCountryCode: countryCode });

  if (!parsed.nationalNumber) {
    errors.push('Invalid phone number format');
    return { isValid: false, errors };
  }

  const numLength = parsed.nationalNumber.length;

  if (numLength < minLength) {
    errors.push(`Phone number must be at least ${minLength} digits`);
  }

  if (numLength > maxLength) {
    errors.push(`Phone number must be no more than ${maxLength} digits`);
  }

  if (countryCode && parsed.countryCode && parsed.countryCode !== countryCode) {
    errors.push(`Country code mismatch (expected: ${countryCode}, got: ${parsed.countryCode})`);
  }

  return {
    isValid: errors.length === 0 && parsed.isValid,
    errors
  };
};

/**
 * Get country code from nationality code
 *
 * @param {string} nationalityCode - ISO country code (e.g., 'CHN', 'USA')
 * @returns {string} Phone country code (e.g., '86', '1')
 *
 * @example
 * getCountryCodeFromNationality('CHN')
 * // → '86'
 */
export const getCountryCodeFromNationality = (nationalityCode) => {
  if (!nationalityCode) {
return '';
}

  const mapping = {
    'CHN': '86',
    'USA': '1',
    'CAN': '1',
    'HKG': '852',
    'MAC': '853',
    'TWN': '886',
    'THA': '66',
    'SGP': '65',
    'MYS': '60',
    'JPN': '81',
    'KOR': '82',
    'GBR': '44',
    'FRA': '33',
    'DEU': '49',
  };

  return mapping[nationalityCode.toUpperCase()] || '';
};

/**
 * Default export containing all phone utilities
 */
export default {
  extractCountryCode,
  extractNationalNumber,
  parsePhoneNumber,
  formatPhoneNumber,
  validatePhoneNumber,
  getCountryCodeFromNationality,
  COUNTRY_CODES
};
