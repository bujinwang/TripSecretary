/**
 * Location Data Loader
 *
 * Centralized utility for loading location data (provinces, districts, sub-districts)
 * for different destinations/countries.
 *
 * This abstraction allows:
 * - Centralized loading logic
 * - Easy addition of new countries
 * - Consistent error handling
 * - Lazy loading of location data
 *
 * @module utils/locationDataLoader
 */

/**
 * @typedef {Object} Province
 * @property {string} code - Province code
 * @property {string} id - Province ID (may be same as code)
 * @property {string} name - English name
 * @property {string} nameZh - Chinese name
 * @property {string} [nameTh] - Thai name (if applicable)
 */

/**
 * @typedef {Object} District
 * @property {string} id - District ID
 * @property {string} nameEn - English name
 * @property {string} nameZh - Chinese name
 * @property {string} [nameTh] - Thai name (if applicable)
 */

/**
 * @typedef {Object} SubDistrict
 * @property {string} id - Sub-district ID
 * @property {string} nameEn - English name
 * @property {string} nameZh - Chinese name
 * @property {string} [nameTh] - Thai name (if applicable)
 * @property {string} [postalCode] - Postal/ZIP code
 */

/**
 * Cache for loaded location data to avoid repeated imports
 * @private
 */
const locationDataCache = {};

/**
 * Destination configuration for location data loading
 * Maps destination IDs to their data module paths and export keys
 * @private
 *
 * NOTE: Only include destinations with existing data files.
 * Vietnam and Malaysia location data exists, but province/state data files
 * need to be created before adding them here.
 */
const DESTINATION_CONFIG = {
  th: {
    provinceModule: '../data/thailandProvinces',
    provinceKey: 'thailandProvinces',
    locationModule: '../data/thailandLocations',
    districtGetter: 'getDistrictsByProvince',
    subDistrictGetter: 'getSubDistrictsByDistrictId',
  },
  thailand: {
    provinceModule: '../data/thailandProvinces',
    provinceKey: 'thailandProvinces',
    locationModule: '../data/thailandLocations',
    districtGetter: 'getDistrictsByProvince',
    subDistrictGetter: 'getSubDistrictsByDistrictId',
  },
  sg: {
    // Singapore doesn't have provinces/states
    provinceModule: null,
    provinceKey: null,
    locationModule: null,
    districtGetter: null,
    subDistrictGetter: null,
  },
  singapore: {
    // Singapore doesn't have provinces/states
    provinceModule: null,
    provinceKey: null,
    locationModule: null,
    districtGetter: null,
    subDistrictGetter: null,
  },

  // TODO: Add these when province/state data files are created:
  // vn/vietnam - needs vietnamProvinces.js
  // my/malaysia - needs malaysiaStates.js
};

/**
 * Validate province/region data array
 * @private
 * @param {*} data - Data to validate
 * @param {string} destinationId - Destination ID for error messages
 * @throws {Error} If data is invalid
 */
const validateProvinceData = (data, destinationId) => {
  if (!Array.isArray(data)) {
    throw new Error(`Province data for ${destinationId} is not an array. Got: ${typeof data}`);
  }

  if (data.length === 0) {
    console.warn(`⚠️ Province data for ${destinationId} is empty`);
    return;
  }

  // Validate first item has required structure
  const sample = data[0];
  if (!sample.code && !sample.id) {
    throw new Error(`Province data for ${destinationId} is missing required 'code' or 'id' field`);
  }
  if (!sample.name && !sample.nameEn) {
    throw new Error(`Province data for ${destinationId} is missing required 'name' or 'nameEn' field`);
  }
};

/**
 * Load province/region data for a destination
 *
 * @param {string} destinationId - Destination ID (e.g., 'th', 'vn', 'my')
 * @returns {Array<Province>} Array of provinces/regions
 * @throws {Error} If destination location data is not found
 *
 * @example
 * const thailandProvinces = loadProvinces('th');
 * // → Array of Thai provinces
 *
 * @example
 * const vietnamProvinces = loadProvinces('vn');
 * // → Array of Vietnamese provinces
 */
export const loadProvinces = (destinationId) => {
  if (!destinationId) {
    throw new Error('destinationId is required');
  }

  // Check cache first
  const cacheKey = `provinces_${destinationId}`;
  if (locationDataCache[cacheKey]) {
    return locationDataCache[cacheKey];
  }

  try {
    // Get destination configuration
    const config = DESTINATION_CONFIG[destinationId.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported destination: ${destinationId}. Supported destinations: ${Object.keys(DESTINATION_CONFIG).filter(k => !k.includes('_')).join(', ')}`);
    }

    // Handle special cases (e.g., Singapore has no provinces)
    if (!config.provinceModule) {
      locationDataCache[cacheKey] = [];
      return [];
    }

    // Load province data using configuration
    const provinceModule = require(config.provinceModule);
    const data = provinceModule[config.provinceKey] || provinceModule.default || provinceModule;

    // Validate the loaded data
    validateProvinceData(data, destinationId);

    // Cache and return
    locationDataCache[cacheKey] = data;
    return data;

  } catch (error) {
    console.error(`Error loading provinces for ${destinationId}:`, error);
    throw new Error(`Failed to load province data for ${destinationId}: ${error.message}`);
  }
};

/**
 * Get display name for a province (bilingual format)
 *
 * @param {string} destinationId - Destination ID
 * @param {string} provinceCode - Province code
 * @returns {string} Display name (e.g., "Bangkok - 曼谷")
 *
 * @example
 * getProvinceDisplayName('th', 'BANGKOK')
 * // → "Bangkok - 曼谷"
 */
export const getProvinceDisplayName = (destinationId, provinceCode) => {
  if (!provinceCode) return '';

  try {
    const provinces = loadProvinces(destinationId);
    const province = provinces.find(p => p.code === provinceCode || p.id === provinceCode);

    if (province) {
      return `${province.name} - ${province.nameZh}`;
    }

    return provinceCode;
  } catch (error) {
    console.error('Error getting province display name:', error);
    return provinceCode;
  }
};

/**
 * Load district data functions for a destination
 *
 * Different countries have different location data structures,
 * so this returns a function that can be used to get districts.
 *
 * @param {string} destinationId - Destination ID
 * @returns {Function} Function that takes provinceCode and returns districts
 * @throws {Error} If destination location data is not found
 *
 * @example
 * const getDistricts = loadDistrictGetter('th');
 * const districts = getDistricts('BANGKOK');
 * // → Array of districts in Bangkok
 */
export const loadDistrictGetter = (destinationId) => {
  if (!destinationId) {
    throw new Error('destinationId is required');
  }

  try {
    // Get destination configuration
    const config = DESTINATION_CONFIG[destinationId.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported destination: ${destinationId}`);
    }

    // Handle destinations without districts (e.g., Singapore)
    if (!config.locationModule || !config.districtGetter) {
      return () => [];
    }

    // Load location module and get district getter function
    const locationModule = require(config.locationModule);
    const getterFunc = locationModule[config.districtGetter];

    if (typeof getterFunc !== 'function') {
      console.warn(`⚠️ District getter for ${destinationId} is not a function`);
      return () => [];
    }

    return getterFunc;

  } catch (error) {
    console.error(`Error loading district getter for ${destinationId}:`, error);
    // Return safe fallback function
    return () => [];
  }
};

/**
 * Load sub-district data functions for a destination
 *
 * @param {string} destinationId - Destination ID
 * @returns {Function} Function that takes districtId and returns sub-districts
 * @throws {Error} If destination location data is not found
 *
 * @example
 * const getSubDistricts = loadSubDistrictGetter('th');
 * const subDistricts = getSubDistricts('district_id_123');
 * // → Array of sub-districts
 */
export const loadSubDistrictGetter = (destinationId) => {
  if (!destinationId) {
    throw new Error('destinationId is required');
  }

  try {
    // Get destination configuration
    const config = DESTINATION_CONFIG[destinationId.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported destination: ${destinationId}`);
    }

    // Handle destinations without sub-districts
    if (!config.locationModule || !config.subDistrictGetter) {
      return () => [];
    }

    // Load location module and get sub-district getter function
    const locationModule = require(config.locationModule);
    const getterFunc = locationModule[config.subDistrictGetter];

    if (typeof getterFunc !== 'function') {
      console.warn(`⚠️ Sub-district getter for ${destinationId} is not a function`);
      return () => [];
    }

    return getterFunc;

  } catch (error) {
    console.error(`Error loading sub-district getter for ${destinationId}:`, error);
    // Return safe fallback function
    return () => [];
  }
};

/**
 * Check if destination has province/region data
 *
 * @param {string} destinationId - Destination ID
 * @returns {boolean} True if destination has province data
 *
 * @example
 * hasProvinceData('th')  // → true
 * hasProvinceData('sg')  // → false (city-state)
 */
export const hasProvinceData = (destinationId) => {
  try {
    const provinces = loadProvinces(destinationId);
    return Array.isArray(provinces) && provinces.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Check if destination has district data
 *
 * @param {string} destinationId - Destination ID
 * @returns {boolean} True if destination has district data
 */
export const hasDistrictData = (destinationId) => {
  try {
    const getter = loadDistrictGetter(destinationId);
    return typeof getter === 'function';
  } catch (error) {
    return false;
  }
};

/**
 * Check if destination has sub-district data
 *
 * @param {string} destinationId - Destination ID
 * @returns {boolean} True if destination has sub-district data
 */
export const hasSubDistrictData = (destinationId) => {
  try {
    const getter = loadSubDistrictGetter(destinationId);
    return typeof getter === 'function';
  } catch (error) {
    return false;
  }
};

/**
 * Clear location data cache
 * Useful for testing or forcing reload
 */
export const clearLocationDataCache = () => {
  Object.keys(locationDataCache).forEach(key => {
    delete locationDataCache[key];
  });
};

/**
 * Get all location data loaders for a destination
 * Convenience function that returns all three loaders at once
 *
 * @param {string} destinationId - Destination ID
 * @returns {Object} Object with provinces, getDistricts, and getSubDistricts
 *
 * @example
 * const { provinces, getDistricts, getSubDistricts } = getLocationLoaders('th');
 * const thailandProvinces = provinces;
 * const bangkokDistricts = getDistricts('BANGKOK');
 */
export const getLocationLoaders = (destinationId) => {
  return {
    provinces: loadProvinces(destinationId),
    getDistricts: loadDistrictGetter(destinationId),
    getSubDistricts: loadSubDistrictGetter(destinationId),
  };
};

/**
 * Default export
 */
export default {
  loadProvinces,
  getProvinceDisplayName,
  loadDistrictGetter,
  loadSubDistrictGetter,
  hasProvinceData,
  hasDistrictData,
  hasSubDistrictData,
  clearLocationDataCache,
  getLocationLoaders,
};
