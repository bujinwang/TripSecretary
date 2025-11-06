/**
 * Country Code Utilities
 * 
 * Provides utilities for normalizing and working with ISO 3166-1 alpha-2 country codes.
 * Handles backward compatibility with legacy country names.
 */

/**
 * Maps legacy country names to ISO 3166-1 alpha-2 codes
 */
const LEGACY_COUNTRY_MAP = {
  thailand: 'th',
  malaysia: 'my',
  singapore: 'sg',
  vietnam: 'vn',
  hongkong: 'hk',
  usa: 'us',
  taiwan: 'tw',
  japan: 'jp',
  korea: 'kr',
  // Also handle uppercase variants
  Thailand: 'th',
  Malaysia: 'my',
  Singapore: 'sg',
  Vietnam: 'vn',
  Hongkong: 'hk',
  USA: 'us',
  Taiwan: 'tw',
  Japan: 'jp',
  Korea: 'kr',
};

/**
 * Normalizes a country code to ISO 3166-1 alpha-2 (lowercase)
 * 
 * @param {string} countryCode - Country code (can be legacy name or ISO code)
 * @returns {string} Normalized ISO 3166-1 alpha-2 code (lowercase)
 * 
 * @example
 * normalizeCountryCode('thailand') // => 'th'
 * normalizeCountryCode('TH') // => 'th'
 * normalizeCountryCode('th') // => 'th'
 */
export const normalizeCountryCode = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') {
    return 'th'; // Default to Thailand
  }

  const normalized = countryCode.toLowerCase().trim();

  // If it's already a valid ISO alpha-2 code (2 letters), return it
  if (/^[a-z]{2}$/.test(normalized)) {
    return normalized;
  }

  // Check if it's a legacy name
  if (LEGACY_COUNTRY_MAP[normalized] || LEGACY_COUNTRY_MAP[countryCode]) {
    return LEGACY_COUNTRY_MAP[normalized] || LEGACY_COUNTRY_MAP[countryCode];
  }

  // If no mapping found, return as-is (might be a valid code we don't recognize)
  return normalized;
};

/**
 * Checks if a country code is valid (ISO alpha-2 or recognized legacy name)
 * 
 * @param {string} countryCode - Country code to validate
 * @returns {boolean} True if valid
 */
export const isValidCountryCode = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') {
    return false;
  }

  const normalized = normalizeCountryCode(countryCode);
  
  // Valid ISO alpha-2 codes are exactly 2 lowercase letters
  return /^[a-z]{2}$/.test(normalized);
};

/**
 * Gets all supported country codes
 * 
 * @returns {string[]} Array of ISO 3166-1 alpha-2 codes
 */
export const getSupportedCountryCodes = () => {
  return ['th', 'my', 'sg', 'vn', 'hk', 'us', 'tw', 'jp', 'kr'];
};

/**
 * Default export
 */
export default {
  normalizeCountryCode,
  isValidCountryCode,
  getSupportedCountryCodes,
};

