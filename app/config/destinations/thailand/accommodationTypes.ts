// @ts-nocheck

/**
 * Thailand Accommodation Type Configuration
 *
 * Centralizes all accommodation type mappings, translations, and display values
 * for Thailand destination.
 *
 * @module destinations/thailand/accommodationTypes
 */

/**
 * @typedef {Object} AccommodationTypeInfo
 * @property {string} key - Normalized key for TDAC API (e.g., 'HOTEL', 'GUEST_HOUSE')
 * @property {string} displayEn - English display name
 * @property {string} displayZh - Chinese display name
 * @property {string} display - Combined display name
 * @property {Array<string>} aliases - Alternative names/inputs that map to this type
 */

/**
 * Accommodation type definitions
 * Maps normalized keys to display information
 */
export const ACCOMMODATION_TYPES = {
  HOTEL: {
    key: 'HOTEL',
    displayEn: 'Hotel',
    displayZh: '酒店',
    display: 'Hotel (酒店)',
    aliases: ['HOTEL', '酒店', 'RESORT']  // TDAC doesn't have resort option, map to HOTEL
  },
  YOUTH_HOSTEL: {
    key: 'YOUTH_HOSTEL',
    displayEn: 'Youth Hostel',
    displayZh: '青年旅舍',
    display: 'Youth Hostel (青年旅舍)',
    aliases: ['YOUTH HOSTEL', 'HOSTEL', '青年旅舍']
  },
  GUEST_HOUSE: {
    key: 'GUEST_HOUSE',
    displayEn: 'Guest House',
    displayZh: '民宿',
    display: 'Guest House (民宿)',
    aliases: ['GUEST HOUSE', 'GUESTHOUSE', '民宿']
  },
  FRIEND_HOUSE: {
    key: 'FRIEND_HOUSE',
    displayEn: "Friend's House",
    displayZh: '朋友家',
    display: "Friend's House (朋友家)",
    aliases: ["FRIEND'S HOUSE", 'FRIENDS HOUSE', 'FRIEND', '朋友家']  // Map UI's FRIEND to TDAC's FRIEND_HOUSE
  },
  APARTMENT: {
    key: 'APARTMENT',
    displayEn: 'Apartment',
    displayZh: '公寓',
    display: 'Apartment (公寓)',
    aliases: ['APARTMENT', '公寓']
  },
  OTHERS: {
    key: 'OTHERS',
    displayEn: 'Other',
    displayZh: '其他',
    display: 'Other (其他)',
    aliases: ['OTHER', 'OTHERS', '其他']
  }
};

/**
 * Default accommodation type
 */
export const DEFAULT_ACCOMMODATION_TYPE = 'HOTEL';

/**
 * Build reverse lookup map for aliases
 * This allows quick lookup from any alias to the normalized key
 * @returns {Map<string, string>} Map from alias (uppercase) to normalized key
 */
const buildAliasMap = () => {
  const aliasMap = new Map();

  Object.entries(ACCOMMODATION_TYPES).forEach(([key, info]) => {
    // Add the key itself
    aliasMap.set(key.toUpperCase(), key);

    // Add all aliases
    info.aliases.forEach(alias => {
      aliasMap.set(alias.toUpperCase(), key);
    });
  });

  return aliasMap;
};

/**
 * Cached alias map (built once)
 */
const ALIAS_MAP = buildAliasMap();

/**
 * Normalize accommodation type input to standard TDAC key
 *
 * @param {string} input - Raw input (can be English, Chinese, or various formats)
 * @returns {string} Normalized key (e.g., 'HOTEL', 'GUEST_HOUSE')
 *
 * @example
 * normalizeAccommodationType('酒店')
 * // → 'HOTEL'
 *
 * @example
 * normalizeAccommodationType('Friend')
 * // → 'FRIEND_HOUSE'
 */
export const normalizeAccommodationType = (input) => {
  if (!input) {
return DEFAULT_ACCOMMODATION_TYPE;
}

  const normalized = input.toString().toUpperCase().trim();
  return ALIAS_MAP.get(normalized) || DEFAULT_ACCOMMODATION_TYPE;
};

/**
 * Get display value for accommodation type
 *
 * @param {string} input - Raw accommodation type input
 * @param {Object} [options] - Display options
 * @param {string} [options.format='combined'] - Format: 'combined', 'en', 'zh'
 * @returns {string} Formatted display string
 *
 * @example
 * getAccommodationTypeDisplay('HOTEL')
 * // → 'Hotel (酒店)'
 *
 * @example
 * getAccommodationTypeDisplay('HOTEL', { format: 'en' })
 * // → 'Hotel'
 */
export const getAccommodationTypeDisplay = (input, options = {}) => {
  const { format = 'combined' } = options;

  if (!input) {
return '';
}

  const key = normalizeAccommodationType(input);
  const typeInfo = ACCOMMODATION_TYPES[key];

  if (!typeInfo) {
return input;
}

  switch (format) {
    case 'en':
      return typeInfo.displayEn;
    case 'zh':
      return typeInfo.displayZh;
    case 'combined':
    default:
      return typeInfo.display;
  }
};

/**
 * Get all available accommodation types
 * Useful for UI dropdowns and validation
 *
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeAliases=false] - Include aliases in result
 * @returns {Array<Object>} Array of accommodation type options
 *
 * @example
 * getAllAccommodationTypes()
 * // → [
 * //   { key: 'HOTEL', display: 'Hotel (酒店)', displayEn: 'Hotel', displayZh: '酒店' },
 * //   ...
 * // ]
 */
export const getAllAccommodationTypes = (options = {}) => {
  const { includeAliases = false } = options;

  return Object.entries(ACCOMMODATION_TYPES).map(([key, info]) => {
    const result = {
      key: info.key,
      display: info.display,
      displayEn: info.displayEn,
      displayZh: info.displayZh
    };

    if (includeAliases) {
      result.aliases = info.aliases;
    }

    return result;
  });
};

/**
 * Validate accommodation type
 *
 * @param {string} input - Accommodation type to validate
 * @returns {Object} Validation result
 *
 * @example
 * validateAccommodationType('HOTEL')
 * // → { isValid: true, normalized: 'HOTEL' }
 *
 * @example
 * validateAccommodationType('INVALID')
 * // → { isValid: false, normalized: 'HOTEL', error: 'Unknown accommodation type, defaulting to HOTEL' }
 */
export const validateAccommodationType = (input) => {
  if (!input) {
    return {
      isValid: false,
      normalized: DEFAULT_ACCOMMODATION_TYPE,
      error: 'Accommodation type is required, defaulting to HOTEL'
    };
  }

  const normalized = normalizeAccommodationType(input);
  const inputUpper = input.toString().toUpperCase().trim();

  // Check if input matched a known type
  const isKnownType = ALIAS_MAP.has(inputUpper);

  if (!isKnownType) {
    return {
      isValid: false,
      normalized: DEFAULT_ACCOMMODATION_TYPE,
      error: `Unknown accommodation type: ${input}, defaulting to HOTEL`
    };
  }

  return {
    isValid: true,
    normalized
  };
};

/**
 * Check if accommodation type requires additional address fields
 * (district, sub-district, postal code)
 *
 * HOTEL accommodation in TDAC does not require these fields
 *
 * @param {string} input - Accommodation type
 * @returns {boolean} True if additional fields are required
 *
 * @example
 * requiresDetailedAddress('HOTEL')
 * // → false
 *
 * @example
 * requiresDetailedAddress('GUEST_HOUSE')
 * // → true
 */
export const requiresDetailedAddress = (input) => {
  const normalized = normalizeAccommodationType(input);
  return normalized !== 'HOTEL';
};

/**
 * Default export
 */
export default {
  ACCOMMODATION_TYPES,
  DEFAULT_ACCOMMODATION_TYPE,
  normalizeAccommodationType,
  getAccommodationTypeDisplay,
  getAllAccommodationTypes,
  validateAccommodationType,
  requiresDetailedAddress
};
