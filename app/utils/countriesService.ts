// @ts-nocheck

/**
 * Countries Service
 * 
 * Centralized service for managing country/destination data and navigation.
 * This replaces hardcoded country lists and screen mappings across the app.
 * 
 * Features:
 * - Single source of truth for all countries
 * - Automatic navigation mapping from destination configs
 * - Visa requirement resolution
 * - Localized country data
 * - Support for countries not yet in config system (fallback)
 */

import { 
  getAllDestinations, 
  getActiveDestinations, 
  getDestination,
  getScreenMappings,
  isDestinationAvailable 
} from '../config/destinations';

/**
 * Fallback country data for countries not yet in the config system
 * This should be migrated to proper config files over time
 * 
 * Note: Japan (jp), Vietnam (vn), and Korea (kr) are now in the config system and should not be here
 */
const FALLBACK_COUNTRIES = {
  // Additional countries that may appear in SelectDestinationScreen
  ca: {
    id: 'ca',
    flag: '🇨🇦',
    name: 'Canada',
    nameZh: '加拿大',
    flightTimeKey: 'home.destinations.canada.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo', // Fallback to generic screen
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_required',
    },
  },
  au: {
    id: 'au',
    flag: '🇦🇺',
    name: 'Australia',
    nameZh: '澳大利亚',
    flightTimeKey: 'home.destinations.australia.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_required',
    },
  },
  nz: {
    id: 'nz',
    flag: '🇳🇿',
    name: 'New Zealand',
    nameZh: '新西兰',
    flightTimeKey: 'home.destinations.newZealand.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_required',
    },
  },
  gb: {
    id: 'gb',
    flag: '🇬🇧',
    name: 'United Kingdom',
    nameZh: '英国',
    flightTimeKey: 'home.destinations.uk.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_free',
    },
  },
  fr: {
    id: 'fr',
    flag: '🇫🇷',
    name: 'France',
    nameZh: '法国',
    flightTimeKey: 'home.destinations.france.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_free',
    },
  },
  de: {
    id: 'de',
    flag: '🇩🇪',
    name: 'Germany',
    nameZh: '德国',
    flightTimeKey: 'home.destinations.germany.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_free',
    },
  },
  it: {
    id: 'it',
    flag: '🇮🇹',
    name: 'Italy',
    nameZh: '意大利',
    flightTimeKey: 'home.destinations.italy.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_free',
    },
  },
  es: {
    id: 'es',
    flag: '🇪🇸',
    name: 'Spain',
    nameZh: '西班牙',
    flightTimeKey: 'home.destinations.spain.flightTime',
    enabled: false,
    priority: 10,
    screens: {
      info: 'TravelInfo',
    },
    visaRequirement: {
      'CHN': 'visa_required',
      'default': 'visa_free',
    },
  },
};

/**
 * Get visa requirement for a country based on passport nationality
 * @param {string} countryId - Destination country ID
 * @param {string} passportNationality - Passport nationality code (e.g., 'CHN', 'USA')
 * @returns {string} Visa requirement type
 */
export const getVisaRequirement = (countryId, passportNationality = 'CHN') => {
  try {
    // Try to get from destination config first
    const destination = getDestination(countryId);
    if (destination.visaRequirement) {
      return destination.visaRequirement[passportNationality] || 
             destination.visaRequirement.default || 
             'unknown';
    }
  } catch (error) {
    // Fallback to fallback countries
  }

  // Check fallback countries
  const fallback = FALLBACK_COUNTRIES[countryId];
  if (fallback?.visaRequirement) {
    return fallback.visaRequirement[passportNationality] || 
           fallback.visaRequirement.default || 
           'unknown';
  }

  return 'unknown';
};

/**
 * Get visa priority for sorting (lower = higher priority)
 * @param {string} requirement - Visa requirement type
 * @returns {number} Priority value
 */
export const getVisaPriority = (requirement) => {
  const priorityMap = {
    visa_free: 1,
    visa_on_arrival: 2,
    evisa: 3,
    eta: 3,
    keta: 3, // K-ETA (Korean Electronic Travel Authorization) - similar to ETA
    hk_permit: 3,
    tw_entry_permit: 3,
    visa_required: 4,
    unknown: 5,
  };
  return priorityMap[requirement] ?? 5;
};

/**
 * Get screen name for navigation based on destination config
 * @param {string} countryId - Destination country ID
 * @param {string} screenType - Type of screen ('info', 'entryFlow', 'travelInfo', etc.)
 * @returns {string|null} Screen name or null if not found
 */
export const getCountryScreen = (countryId, screenType = 'info') => {
  try {
    const screens = getScreenMappings(countryId);
    return screens?.[screenType] || null;
  } catch (error) {
    // Check fallback countries
    const fallback = FALLBACK_COUNTRIES[countryId];
    return fallback?.screens?.[screenType] || null;
  }
};

/**
 * Get all countries (from configs + fallbacks)
 * @param {Object} options - Options
 * @param {boolean} options.enabledOnly - Only return enabled countries
 * @param {boolean} options.includeFallbacks - Include fallback countries
 * @returns {Array} Array of country objects
 */
export const getAllCountries = ({ enabledOnly = false, includeFallbacks = true } = {}) => {
  const countries = [];

  // Get countries from config system
  const destinations = enabledOnly ? getActiveDestinations() : getAllDestinations();
  
  destinations.forEach(dest => {
    countries.push({
      id: dest.id,
      flag: dest.flag,
      name: dest.name,
      nameZh: dest.nameZh,
      nameZhTW: dest.nameZhTW,
      flightTimeKey: dest.flightTimeKey,
      enabled: dest.enabled !== false, // Default to true if not specified
      priority: dest.priority || 99,
      screens: dest.screens || {},
      visaRequirement: dest.visaRequirement || {},
    });
  });

  // Add fallback countries if requested
  if (includeFallbacks) {
    Object.values(FALLBACK_COUNTRIES).forEach(fallback => {
      // Don't add if already in config system
      if (!countries.find(c => c.id === fallback.id)) {
        if (!enabledOnly || fallback.enabled) {
          countries.push(fallback);
        }
      }
    });
  }

  return countries;
};

/**
 * Get country data for display (with localized names)
 * @param {string} countryId - Country ID
 * @param {Function} t - Translation function
 * @param {string} language - Current language
 * @returns {Object|null} Country data object or null
 */
export const getCountryForDisplay = (countryId, t, language = 'en') => {
  let country = null;

  try {
    const dest = getDestination(countryId);
    let displayName;
    if (language === 'zh-TW') {
      displayName = dest.nameZhTW || dest.nameZh || dest.name;
    } else if (language === 'zh-CN' || language === 'zh') {
      displayName = dest.nameZh || dest.nameZhTW || dest.name;
    } else {
      displayName = dest.name;
    }
    
    country = {
      id: dest.id,
      flag: dest.flag,
      name: dest.name,
      nameZh: dest.nameZh,
      displayName,
      flightTimeKey: dest.flightTimeKey,
      flightTime: t(dest.flightTimeKey || `home.destinations.${dest.id}.flightTime`, { defaultValue: '—' }),
      enabled: dest.enabled !== false, // Default to true if not specified
      priority: dest.priority || 99,
      screens: dest.screens || {},
      visaRequirement: getVisaRequirement(countryId),
      visaPriority: getVisaPriority(getVisaRequirement(countryId)),
    };
  } catch (error) {
    // Try fallback
    const fallback = FALLBACK_COUNTRIES[countryId];
    if (fallback) {
      const displayName = language === 'zh-CN' || language === 'zh-TW'
        ? (fallback.nameZh || fallback.name)
        : fallback.name;
      
      country = {
        ...fallback,
        displayName,
        flightTime: t(fallback.flightTimeKey, { defaultValue: '—' }),
        visaRequirement: getVisaRequirement(countryId),
        visaPriority: getVisaPriority(getVisaRequirement(countryId)),
      };
    }
  }

  return country;
};

/**
 * Get hot/popular countries for home screen
 * @param {Function} t - Translation function
 * @param {string} language - Current language
 * @param {Array} excludeIds - Country IDs to exclude (e.g., already active)
 * @returns {Array} Sorted array of country objects
 */
export const getHotCountries = (t, language = 'en', excludeIds = []) => {
  const allCountries = getAllCountries({ enabledOnly: false, includeFallbacks: true });
  
  const countriesWithDisplay = allCountries
    .filter(country => !excludeIds.includes(country.id))
    .map(country => getCountryForDisplay(country.id, t, language))
    .filter(Boolean);

  // Sort by visa priority, then by country priority
  return countriesWithDisplay.sort((a, b) => {
    if (a.visaPriority !== b.visaPriority) {
      return a.visaPriority - b.visaPriority;
    }
    return (a.priority || 99) - (b.priority || 99);
  });
};

/**
 * Navigate to appropriate screen for a country
 * @param {Object} navigation - Navigation object
 * @param {string} countryId - Country ID
 * @param {string} screenType - Screen type ('info' or 'entryFlow')
 * @param {Object} params - Navigation parameters
 */
export const navigateToCountry = (navigation, countryId, screenType = 'info', params = {}) => {
  const screenName = getCountryScreen(countryId, screenType);
  
  if (screenName) {
    navigation.navigate(screenName, params);
  } else {
    // Fallback to generic TravelInfo screen
    navigation.navigate('TravelInfo', params);
  }
};

/**
 * Get country flag emoji
 * @param {string} countryId - Country ID
 * @returns {string} Flag emoji or '🌍' as fallback
 */
export const getCountryFlag = (countryId) => {
  try {
    const dest = getDestination(countryId);
    return dest.flag || '🌍';
  } catch (error) {
    return FALLBACK_COUNTRIES[countryId]?.flag || '🌍';
  }
};

/**
 * Get country name (localized)
 * @param {string} countryId - Country ID
 * @param {string} language - Language code
 * @returns {string} Country name
 */
export const getCountryName = (countryId, language = 'en') => {
  try {
    const dest = getDestination(countryId);
    if (language === 'zh-TW') {
      return dest.nameZhTW || dest.nameZh || dest.name;
    }
    if (language === 'zh-CN' || language === 'zh') {
      return dest.nameZh || dest.nameZhTW || dest.name;
    }
    return dest.name;
  } catch (error) {
    const fallback = FALLBACK_COUNTRIES[countryId];
    if (fallback) {
      if (language === 'zh-TW') {
        return fallback.nameZhTW || fallback.nameZh || fallback.name;
      }
      if (language === 'zh-CN' || language === 'zh') {
        return fallback.nameZh || fallback.name;
      }
      return fallback.name;
    }
    return countryId;
  }
};

export default {
  getAllCountries,
  getHotCountries,
  getCountryForDisplay,
  getVisaRequirement,
  getVisaPriority,
  getCountryScreen,
  navigateToCountry,
  getCountryFlag,
  getCountryName,
};

