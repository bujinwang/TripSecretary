/**
 * Countries Service
 * 
 * Centralized service for managing country/destination data and navigation.
 */

import { 
  getAllDestinations, 
  getActiveDestinations, 
  getDestination,
  getScreenMappings,
  isDestinationAvailable 
} from '../config/destinations';

interface CountryData {
  id: string;
  flag: string;
  name: string;
  nameZh?: string;
  nameZhTW?: string;
  flightTimeKey: string;
  enabled: boolean;
  priority: number;
  screens: Record<string, string>;
  visaRequirement: Record<string, string>;
}

export interface CountryDisplay {
  id: string;
  flag: string;
  name: string;
  nameZh?: string;
  displayName: string;
  flightTimeKey: string;
  flightTime: string;
  enabled: boolean;
  priority: number;
  screens: Record<string, string>;
  visaRequirement: string;
  visaPriority: number;
}

export type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

const FALLBACK_COUNTRIES: Record<string, CountryData> = {
  ca: {
    id: 'ca', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada', nameZh: '加拿大',
    flightTimeKey: 'home.destinations.canada.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_required' },
  },
  au: {
    id: 'au', flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia', nameZh: '澳大利亚',
    flightTimeKey: 'home.destinations.australia.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_required' },
  },
  nz: {
    id: 'nz', flag: '\u{1F1F3}\u{1F1FF}', name: 'New Zealand', nameZh: '新西兰',
    flightTimeKey: 'home.destinations.newZealand.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_required' },
  },
  gb: {
    id: 'gb', flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom', nameZh: '英国',
    flightTimeKey: 'home.destinations.uk.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_free' },
  },
  fr: {
    id: 'fr', flag: '\u{1F1EB}\u{1F1F7}', name: 'France', nameZh: '法国',
    flightTimeKey: 'home.destinations.france.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_free' },
  },
  de: {
    id: 'de', flag: '\u{1F1E9}\u{1F1EA}', name: 'Germany', nameZh: '德国',
    flightTimeKey: 'home.destinations.germany.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_free' },
  },
  it: {
    id: 'it', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italy', nameZh: '意大利',
    flightTimeKey: 'home.destinations.italy.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_free' },
  },
  es: {
    id: 'es', flag: '\u{1F1EA}\u{1F1F8}', name: 'Spain', nameZh: '西班牙',
    flightTimeKey: 'home.destinations.spain.flightTime', enabled: false, priority: 10,
    screens: { info: 'TravelInfo' },
    visaRequirement: { 'CHN': 'visa_required', 'default': 'visa_free' },
  },
};

export const getVisaRequirement = (countryId: string, passportNationality = 'CHN'): string => {
  try {
    const destination = getDestination(countryId);
    if (destination.visaRequirement) {
      return destination.visaRequirement[passportNationality] || 
             destination.visaRequirement.default || 
             'unknown';
    }
  } catch (_error) {
    // Fallback to fallback countries
  }

  const fallback = FALLBACK_COUNTRIES[countryId];
  if (fallback?.visaRequirement) {
    return fallback.visaRequirement[passportNationality] || 
           fallback.visaRequirement.default || 
           'unknown';
  }

  return 'unknown';
};

export const getVisaPriority = (requirement: string): number => {
  const priorityMap: Record<string, number> = {
    visa_free: 1,
    visa_on_arrival: 2,
    evisa: 3,
    eta: 3,
    keta: 3,
    hk_permit: 3,
    tw_entry_permit: 3,
    visa_required: 4,
    unknown: 5,
  };
  return priorityMap[requirement] ?? 5;
};

export const getCountryScreen = (countryId: string, screenType = 'info'): string | null => {
  try {
    const screens = getScreenMappings(countryId);
    return screens?.[screenType] || null;
  } catch (_error) {
    const fallback = FALLBACK_COUNTRIES[countryId];
    return fallback?.screens?.[screenType] || null;
  }
};

export const getAllCountries = ({ enabledOnly = false, includeFallbacks = true }: { enabledOnly?: boolean; includeFallbacks?: boolean } = {}): CountryData[] => {
  const countries: CountryData[] = [];

  const destinations = enabledOnly ? getActiveDestinations() : getAllDestinations();
  
  destinations.forEach(dest => {
    countries.push({
      id: dest.id,
      flag: dest.flag,
      name: dest.name,
      nameZh: dest.nameZh,
      nameZhTW: dest.nameZhTW,
      flightTimeKey: dest.flightTimeKey,
      enabled: dest.enabled !== false,
      priority: dest.priority || 99,
      screens: dest.screens || {},
      visaRequirement: dest.visaRequirement || {},
    });
  });

  if (includeFallbacks) {
    Object.values(FALLBACK_COUNTRIES).forEach(fallback => {
      if (!countries.find(c => c.id === fallback.id)) {
        if (!enabledOnly || fallback.enabled) {
          countries.push(fallback);
        }
      }
    });
  }

  return countries;
};

export const getCountryForDisplay = (countryId: string, t: TranslateFunction, language = 'en'): CountryDisplay | null => {
  let country: CountryDisplay | null = null;

  try {
    const dest = getDestination(countryId);
    let displayName: string;
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
      flightTime: t(dest.flightTimeKey || `home.destinations.${dest.id}.flightTime`, { defaultValue: '\u2014' }),
      enabled: dest.enabled !== false,
      priority: dest.priority || 99,
      screens: dest.screens || {},
      visaRequirement: getVisaRequirement(countryId),
      visaPriority: getVisaPriority(getVisaRequirement(countryId)),
    };
  } catch (_error) {
    const fallback = FALLBACK_COUNTRIES[countryId];
    if (fallback) {
      const displayName = language === 'zh-CN' || language === 'zh-TW'
        ? (fallback.nameZh || fallback.name)
        : fallback.name;
      
      country = {
        ...fallback,
        displayName,
        flightTime: t(fallback.flightTimeKey, { defaultValue: '\u2014' }),
        visaRequirement: getVisaRequirement(countryId),
        visaPriority: getVisaPriority(getVisaRequirement(countryId)),
      };
    }
  }

  return country;
};

export const getHotCountries = (t: TranslateFunction, language = 'en', excludeIds: string[] = []): (CountryDisplay | null)[] => {
  const allCountries = getAllCountries({ enabledOnly: false, includeFallbacks: true });
  
  const countriesWithDisplay = allCountries
    .filter(country => !excludeIds.includes(country.id))
    .map(country => getCountryForDisplay(country.id, t, language))
    .filter(Boolean);

  return countriesWithDisplay.sort((a, b) => {
    if (!a || !b) { return 0; }
    if (a.visaPriority !== b.visaPriority) {
      return a.visaPriority - b.visaPriority;
    }
    return (a.priority || 99) - (b.priority || 99);
  });
};

export const navigateToCountry = (navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void }, countryId: string, screenType = 'info', params: Record<string, unknown> = {}): void => {
  const screenName = getCountryScreen(countryId, screenType);
  
  if (screenName) {
    navigation.navigate(screenName, params);
  } else {
    navigation.navigate('TravelInfo', params);
  }
};

export const getCountryFlag = (countryId: string): string => {
  try {
    const dest = getDestination(countryId);
    return dest.flag || '\u{1F30D}';
  } catch (_error) {
    return FALLBACK_COUNTRIES[countryId]?.flag || '\u{1F30D}';
  }
};

export const getCountryName = (countryId: string, language = 'en'): string => {
  try {
    const dest = getDestination(countryId);
    if (language === 'zh-TW') {
      return dest.nameZhTW || dest.nameZh || dest.name;
    }
    if (language === 'zh-CN' || language === 'zh') {
      return dest.nameZh || dest.nameZhTW || dest.name;
    }
    return dest.name;
  } catch (_error) {
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
