/**
 * Thailand Travel Purpose Configuration
 *
 * Centralizes all travel purpose mappings, translations, and display values
 * for Thailand destination.
 *
 * @module destinations/thailand/travelPurposes
 */

/**
 * @typedef {Object} TravelPurposeInfo
 * @property {string} key - Normalized key for TDAC API (e.g., 'HOLIDAY', 'BUSINESS')
 * @property {string} displayEn - English display name
 * @property {string} displayZh - Chinese display name
 * @property {string} display - Combined display name
 * @property {Array<string>} aliases - Alternative names/inputs that map to this purpose
 * @property {string} [description] - Optional description
 */

/**
 * Travel purpose definitions
 * Maps normalized keys to display information
 */
export const TRAVEL_PURPOSES = {
  HOLIDAY: {
    key: 'HOLIDAY',
    displayEn: 'Holiday/Tourism',
    displayZh: '度假旅游',
    display: 'Holiday/Tourism (度假旅游)',
    aliases: ['HOLIDAY', 'VACATION', 'TOURISM', '度假', '旅游', '度假旅游', '奖励旅游']
  },
  BUSINESS: {
    key: 'BUSINESS',
    displayEn: 'Business',
    displayZh: '商务',
    display: 'Business (商务)',
    aliases: ['BUSINESS', '商务', '会议', '会展', '展览']  // Meeting/Exhibition often map to business
  },
  MEETING: {
    key: 'MEETING',
    displayEn: 'Meeting',
    displayZh: '会议',
    display: 'Meeting (会议)',
    aliases: ['MEETING']
  },
  SPORTS: {
    key: 'SPORTS',
    displayEn: 'Sports',
    displayZh: '体育',
    display: 'Sports (体育)',
    aliases: ['SPORTS', 'SPORT', '体育', '体育活动']
  },
  INCENTIVE: {
    key: 'INCENTIVE',
    displayEn: 'Incentive',
    displayZh: '奖励',
    display: 'Incentive (奖励)',
    aliases: ['INCENTIVE', '奖励']
  },
  MEDICAL_WELLNESS: {
    key: 'MEDICAL_WELLNESS',
    displayEn: 'Medical/Wellness',
    displayZh: '医疗保健',
    display: 'Medical/Wellness (医疗保健)',
    aliases: ['MEDICAL', 'WELLNESS', 'MEDICAL_WELLNESS', '医疗', '保健', '医疗保健']
  },
  EDUCATION: {
    key: 'EDUCATION',
    displayEn: 'Education',
    displayZh: '教育',
    display: 'Education (教育)',
    aliases: ['EDUCATION', 'STUDY', '教育', '学习', '学业']
  },
  CONVENTION: {
    key: 'CONVENTION',
    displayEn: 'Convention',
    displayZh: '会展',
    display: 'Convention (会展)',
    aliases: ['CONVENTION']
  },
  EMPLOYMENT: {
    key: 'EMPLOYMENT',
    displayEn: 'Employment',
    displayZh: '就业',
    display: 'Employment (就业)',
    aliases: ['EMPLOYMENT', 'WORK', '就业', '工作']
  },
  EXHIBITION: {
    key: 'EXHIBITION',
    displayEn: 'Exhibition',
    displayZh: '展览',
    display: 'Exhibition (展览)',
    aliases: ['EXHIBITION']
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
 * Default travel purpose
 */
export const DEFAULT_TRAVEL_PURPOSE = 'HOLIDAY';

/**
 * Build reverse lookup map for aliases
 * This allows quick lookup from any alias to the normalized key
 * @returns {Map<string, string>} Map from alias (uppercase) to normalized key
 */
const buildAliasMap = () => {
  const aliasMap = new Map();

  Object.entries(TRAVEL_PURPOSES).forEach(([key, info]) => {
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
 * Normalize travel purpose input to standard TDAC key
 *
 * @param {string} input - Raw input (can be English, Chinese, or various formats)
 * @returns {string} Normalized key (e.g., 'HOLIDAY', 'BUSINESS')
 *
 * @example
 * normalizeTravelPurpose('度假')
 * // → 'HOLIDAY'
 *
 * @example
 * normalizeTravelPurpose('VACATION')
 * // → 'HOLIDAY'
 */
export const normalizeTravelPurpose = (input) => {
  if (!input) return DEFAULT_TRAVEL_PURPOSE;

  const normalized = input.toString().toUpperCase().trim();
  return ALIAS_MAP.get(normalized) || DEFAULT_TRAVEL_PURPOSE;
};

/**
 * Get display value for travel purpose
 *
 * @param {string} input - Raw travel purpose input
 * @param {Object} [options] - Display options
 * @param {string} [options.format='combined'] - Format: 'combined', 'en', 'zh'
 * @returns {string} Formatted display string
 *
 * @example
 * getTravelPurposeDisplay('HOLIDAY')
 * // → 'Holiday/Tourism (度假旅游)'
 *
 * @example
 * getTravelPurposeDisplay('HOLIDAY', { format: 'en' })
 * // → 'Holiday/Tourism'
 */
export const getTravelPurposeDisplay = (input, options = {}) => {
  const { format = 'combined' } = options;

  if (!input) return '';

  const key = normalizeTravelPurpose(input);
  const purposeInfo = TRAVEL_PURPOSES[key];

  if (!purposeInfo) return input;

  switch (format) {
    case 'en':
      return purposeInfo.displayEn;
    case 'zh':
      return purposeInfo.displayZh;
    case 'combined':
    default:
      return purposeInfo.display;
  }
};

/**
 * Get all available travel purposes
 * Useful for UI dropdowns and validation
 *
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeAliases=false] - Include aliases in result
 * @returns {Array<Object>} Array of travel purpose options
 *
 * @example
 * getAllTravelPurposes()
 * // → [
 * //   { key: 'HOLIDAY', display: 'Holiday/Tourism (度假旅游)', displayEn: 'Holiday/Tourism', displayZh: '度假旅游' },
 * //   ...
 * // ]
 */
export const getAllTravelPurposes = (options = {}) => {
  const { includeAliases = false } = options;

  return Object.entries(TRAVEL_PURPOSES).map(([key, info]) => {
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
 * Validate travel purpose
 *
 * @param {string} input - Travel purpose to validate
 * @returns {Object} Validation result
 *
 * @example
 * validateTravelPurpose('HOLIDAY')
 * // → { isValid: true, normalized: 'HOLIDAY' }
 *
 * @example
 * validateTravelPurpose('INVALID')
 * // → { isValid: false, normalized: 'HOLIDAY', error: 'Unknown travel purpose, defaulting to HOLIDAY' }
 */
export const validateTravelPurpose = (input) => {
  if (!input) {
    return {
      isValid: false,
      normalized: DEFAULT_TRAVEL_PURPOSE,
      error: 'Travel purpose is required, defaulting to HOLIDAY'
    };
  }

  const normalized = normalizeTravelPurpose(input);
  const inputUpper = input.toString().toUpperCase().trim();

  // Check if input matched a known purpose
  const isKnownPurpose = ALIAS_MAP.has(inputUpper);

  if (!isKnownPurpose) {
    return {
      isValid: false,
      normalized: DEFAULT_TRAVEL_PURPOSE,
      error: `Unknown travel purpose: ${input}, defaulting to HOLIDAY`
    };
  }

  return {
    isValid: true,
    normalized
  };
};

/**
 * Legacy method for backward compatibility
 * Transforms Chinese purpose names to English keys
 * @deprecated Use normalizeTravelPurpose instead
 * @param {string} purpose - Travel purpose from user input
 * @returns {string} Normalized purpose key
 */
export const transformTravelPurpose = (purpose) => {
  if (!purpose) return '';
  return normalizeTravelPurpose(purpose);
};

/**
 * Default export
 */
export default {
  TRAVEL_PURPOSES,
  DEFAULT_TRAVEL_PURPOSE,
  normalizeTravelPurpose,
  getTravelPurposeDisplay,
  getAllTravelPurposes,
  validateTravelPurpose,
  transformTravelPurpose
};
