/**
 * Location Formatting and Display Utilities
 *
 * Centralized utilities for formatting location codes, names, and addresses
 * across different formats and languages.
 *
 * Supports:
 * - Code formatting: "AMNAT_CHAROEN" → "Amnat Charoen"
 * - Multi-language display: "Bangkok - 曼谷 - กรุงเทพ"
 * - Address formatting for different countries
 *
 * @module locationUtils
 */

/**
 * @typedef {Object} FormattedLocation
 * @property {string} code - Location code (e.g., 'BANGKOK')
 * @property {string} name - English name (e.g., 'Bangkok')
 * @property {string} [nameLocal] - Local language name (e.g., 'กรุงเทพ')
 * @property {string} [nameZh] - Chinese name (e.g., '曼谷')
 * @property {string} display - Formatted display string
 */

/**
 * Format location code to display name
 *
 * Converts location codes (typically uppercase with underscores) to
 * human-readable display names.
 *
 * @param {string} value - Location code or name
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.titleCase=true] - Use title case
 * @param {string} [options.separator=' '] - Separator for multi-part names
 * @returns {string} Formatted display string
 *
 * @example
 * formatLocationCode("AMNAT_CHAROEN")
 * // → "Amnat Charoen"
 *
 * @example
 * formatLocationCode("NEW_YORK")
 * // → "New York"
 *
 * @example
 * formatLocationCode("SAN_FRANCISCO")
 * // → "San Francisco"
 */
export const formatLocationCode = (value, options = {}) => {
  const { titleCase = true, separator = ' ' } = options;

  if (!value) {
return '';
}

  const raw = value.toString().trim();
  if (!raw) {
return '';
}

  // Check if it's a location code (all uppercase with underscores)
  if (/^[A-Z_]+$/.test(raw)) {
    const parts = raw
      .toLowerCase()
      .split('_')
      .filter(Boolean);

    if (titleCase) {
      return parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(separator);
    }

    return parts.join(separator);
  }

  // If not a code, return as-is
  return raw;
};

/**
 * Format location with translations
 *
 * Creates a multi-language display string combining English, Chinese,
 * and optionally local language names.
 *
 * @param {Object} location - Location object
 * @param {string} location.name - English name
 * @param {string} [location.nameZh] - Chinese name
 * @param {string} [location.nameLocal] - Local language name
 * @param {Object} [options] - Formatting options
 * @param {string} [options.format='full'] - Format: 'full', 'en-zh', 'en-local', 'en-only'
 * @param {string} [options.separator=' - '] - Separator between languages
 * @returns {string} Formatted multi-language display string
 *
 * @example
 * formatLocationWithTranslations({ name: 'Bangkok', nameZh: '曼谷', nameTh: 'กรุงเทพ' })
 * // → "Bangkok - 曼谷 - กรุงเทพ"
 *
 * @example
 * formatLocationWithTranslations({ name: 'Bangkok', nameZh: '曼谷' }, { format: 'en-zh' })
 * // → "Bangkok - 曼谷"
 */
export const formatLocationWithTranslations = (location, options = {}) => {
  const { format = 'full', separator = ' - ' } = options;

  if (!location || !location.name) {
return '';
}

  const parts = [location.name];

  if (format === 'en-only') {
    return location.name;
  }

  if ((format === 'full' || format === 'en-zh') && location.nameZh) {
    parts.push(location.nameZh);
  }

  if ((format === 'full' || format === 'en-local') && location.nameLocal) {
    parts.push(location.nameLocal);
  }

  return parts.join(separator);
};

/**
 * Get display value for a location
 *
 * Flexible formatter that handles both codes and full location objects.
 *
 * @param {string|Object} location - Location code or object
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeCode=false] - Include code in display
 * @param {string} [options.locale='en'] - Preferred locale
 * @returns {string} Display value
 *
 * @example
 * getDisplayValue("BANGKOK")
 * // → "Bangkok"
 *
 * @example
 * getDisplayValue({ code: 'BANGKOK', name: 'Bangkok', nameZh: '曼谷' }, { locale: 'zh' })
 * // → "曼谷"
 *
 * @example
 * getDisplayValue({ code: 'BANGKOK', name: 'Bangkok' }, { includeCode: true })
 * // → "Bangkok (BANGKOK)"
 */
export const getDisplayValue = (location, options = {}) => {
  const { includeCode = false, locale = 'en' } = options;

  // Handle string (code)
  if (typeof location === 'string') {
    const formatted = formatLocationCode(location);
    return includeCode ? `${formatted} (${location})` : formatted;
  }

  // Handle object
  if (typeof location === 'object' && location !== null) {
    let displayName = '';

    // Select name based on locale
    if (locale === 'zh' && location.nameZh) {
      displayName = location.nameZh;
    } else if (locale === 'local' && location.nameLocal) {
      displayName = location.nameLocal;
    } else if (location.name) {
      displayName = location.name;
    } else if (location.code) {
      displayName = formatLocationCode(location.code);
    }

    if (includeCode && location.code) {
      return `${displayName} (${location.code})`;
    }

    return displayName;
  }

  return '';
};

/**
 * Format address for display
 *
 * Formats an address with proper line breaks and formatting
 * according to country conventions.
 *
 * @param {Object} address - Address object
 * @param {string} [address.line1] - Address line 1
 * @param {string} [address.line2] - Address line 2
 * @param {string} [address.district] - District/county
 * @param {string} [address.city] - City
 * @param {string} [address.province] - Province/state
 * @param {string} [address.postalCode] - Postal/zip code
 * @param {string} [address.country] - Country
 * @param {Object} [options] - Formatting options
 * @param {string} [options.countryCode='TH'] - Country code for format rules
 * @param {string} [options.separator=', '] - Line separator
 * @param {boolean} [options.includeCountry=false] - Include country in output
 * @returns {string} Formatted address
 *
 * @example
 * formatAddress({
 *   line1: '123 Sukhumvit Road',
 *   district: 'Khlong Toei',
 *   city: 'Bangkok',
 *   postalCode: '10110'
 * })
 * // → "123 Sukhumvit Road, Khlong Toei, Bangkok 10110"
 */
export const formatAddress = (address, options = {}) => {
  const {
    countryCode = 'TH',
    separator = ', ',
    includeCountry = false
  } = options;

  if (!address || typeof address !== 'object') {
return '';
}

  const parts = [];

  // Line 1 and 2
  if (address.line1) {
parts.push(address.line1);
}
  if (address.line2) {
parts.push(address.line2);
}

  // District
  if (address.district) {
    const districtDisplay = typeof address.district === 'string'
      ? formatLocationCode(address.district)
      : getDisplayValue(address.district);
    parts.push(districtDisplay);
  }

  // City/Province formatting depends on country
  if (countryCode === 'TH') {
    // Thailand: City, Province PostalCode
    const cityParts = [];
    if (address.city) {
cityParts.push(formatLocationCode(address.city));
}
    if (address.province) {
cityParts.push(formatLocationCode(address.province));
}
    if (address.postalCode) {
cityParts.push(address.postalCode);
}
    if (cityParts.length > 0) {
      parts.push(cityParts.join(' '));
    }
  } else if (countryCode === 'US') {
    // USA: City, State ZIP
    if (address.city) {
parts.push(address.city);
}
    if (address.province && address.postalCode) {
      parts.push(`${address.province} ${address.postalCode}`);
    } else if (address.province) {
      parts.push(address.province);
    } else if (address.postalCode) {
      parts.push(address.postalCode);
    }
  } else {
    // Generic: City Province PostalCode
    if (address.city) {
parts.push(formatLocationCode(address.city));
}
    if (address.province) {
parts.push(formatLocationCode(address.province));
}
    if (address.postalCode) {
parts.push(address.postalCode);
}
  }

  // Country
  if (includeCountry && address.country) {
    parts.push(address.country);
  }

  return parts.filter(Boolean).join(separator);
};

/**
 * Parse location code from display name
 *
 * Reverse of formatLocationCode - converts display name back to code.
 *
 * @param {string} displayName - Display name
 * @returns {string} Location code
 *
 * @example
 * parseLocationCode("Amnat Charoen")
 * // → "AMNAT_CHAROEN"
 *
 * @example
 * parseLocationCode("New York")
 * // → "NEW_YORK"
 */
export const parseLocationCode = (displayName) => {
  if (!displayName) {
return '';
}

  return displayName
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z_]/g, '');
};

/**
 * Validate location code format
 *
 * @param {string} code - Location code
 * @param {Object} [rules] - Validation rules
 * @param {number} [rules.minLength=2] - Minimum code length
 * @param {number} [rules.maxLength=50] - Maximum code length
 * @param {boolean} [rules.allowNumbers=false] - Allow numbers in code
 * @returns {Object} Validation result
 *
 * @example
 * validateLocationCode("BANGKOK")
 * // → { isValid: true, errors: [] }
 *
 * @example
 * validateLocationCode("123")
 * // → { isValid: false, errors: ['Location code contains numbers'] }
 */
export const validateLocationCode = (code, rules = {}) => {
  const {
    minLength = 2,
    maxLength = 50,
    allowNumbers = false
  } = rules;

  const errors = [];

  if (!code) {
    errors.push('Location code is required');
    return { isValid: false, errors };
  }

  if (code.length < minLength) {
    errors.push(`Location code must be at least ${minLength} characters`);
  }

  if (code.length > maxLength) {
    errors.push(`Location code must be no more than ${maxLength} characters`);
  }

  if (!allowNumbers && /\d/.test(code)) {
    errors.push('Location code contains numbers');
  }

  if (!/^[A-Z_0-9]+$/.test(code)) {
    errors.push('Location code must contain only uppercase letters, underscores, and numbers');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Default export containing all location utilities
 */
export default {
  formatLocationCode,
  formatLocationWithTranslations,
  getDisplayValue,
  formatAddress,
  parseLocationCode,
  validateLocationCode
};
