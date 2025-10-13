/**
 * Chinese Language Converter
 * Converts Simplified Chinese (zh-CN) to Traditional Chinese variants (zh-TW, zh-HK)
 * Uses OpenCC for accurate character and phrase conversion
 */

const OpenCC = require('opencc-js');

// Lazy-load converters to avoid initialization overhead
let converters = null;

const initConverters = () => {
  if (!converters) {
    converters = {
      'zh-TW': OpenCC.Converter({ from: 'cn', to: 'tw' }),
      'zh-HK': OpenCC.Converter({ from: 'cn', to: 'hk' }),
    };
  }
  return converters;
};

/**
 * Deep convert an object/array structure from Simplified to Traditional Chinese
 * @param {any} obj - The object to convert (can be string, object, array, or primitive)
 * @param {string} variant - Target variant: 'zh-TW' or 'zh-HK'
 * @returns {any} Converted object with same structure
 */
const deepConvert = (obj, variant) => {
  const converters = initConverters();
  const converter = converters[variant];

  if (!converter) {
    console.warn(`Unknown Chinese variant: ${variant}, returning original`);
    return obj;
  }

  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Convert strings
  if (typeof obj === 'string') {
    return converter(obj);
  }

  // Convert arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepConvert(item, variant));
  }

  // Convert objects
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert both keys and values for completeness
      const convertedKey = converter(key);
      converted[convertedKey] = deepConvert(value, variant);
    }
    return converted;
  }

  // Return other types as-is (numbers, booleans, etc.)
  return obj;
};

/**
 * Convert a Simplified Chinese translation object to Traditional Chinese variant
 * Uses memoization to cache converted objects for performance
 */
const cache = new Map();

const convertToTraditional = (simplifiedObj, variant) => {
  const cacheKey = `${variant}-${JSON.stringify(simplifiedObj).substring(0, 100)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const converted = deepConvert(simplifiedObj, variant);
  cache.set(cacheKey, converted);
  
  return converted;
};

/**
 * Clear the conversion cache (useful for testing or memory management)
 */
const clearCache = () => {
  cache.clear();
};

module.exports = {
  convertToTraditional,
  deepConvert,
  clearCache,
};
