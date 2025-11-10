// @ts-nocheck

/**
 * Unit tests for countriesService
 * 
 * Tests the centralized country data and navigation logic
 */

import {
  getAllCountries,
  getHotCountries,
  getCountryForDisplay,
  getVisaRequirement,
  getVisaPriority,
  getCountryScreen,
  navigateToCountry,
  getCountryFlag,
  getCountryName,
} from '../countriesService';

// Mock the destinations config
jest.mock('../../config/destinations', () => ({
  getAllDestinations: jest.fn(() => [
    {
      id: 'th',
      flag: '🇹🇭',
      name: 'Thailand',
      nameZh: '泰国',
      flightTimeKey: 'home.destinations.thailand.flightTime',
      enabled: true,
      priority: 2,
      screens: {
        info: 'ThailandInfo',
        entryFlow: 'ThailandEntryFlow',
      },
      visaRequirement: {
        'CHN': 'visa_free',
        'default': 'check_requirements',
      },
    },
    {
      id: 'jp',
      flag: '🇯🇵',
      name: 'Japan',
      nameZh: '日本',
      flightTimeKey: 'home.destinations.japan.flightTime',
      enabled: true,
      priority: 1,
      screens: {
        info: 'JapanInfo',
        entryFlow: 'JapanEntryFlow',
      },
      visaRequirement: {
        'CHN': 'visa_free',
        'default': 'visa_free',
      },
    },
  ]),
  getActiveDestinations: jest.fn(() => [
    {
      id: 'th',
      flag: '🇹🇭',
      name: 'Thailand',
      nameZh: '泰国',
      flightTimeKey: 'home.destinations.thailand.flightTime',
      enabled: true,
      priority: 2,
      screens: {
        info: 'ThailandInfo',
        entryFlow: 'ThailandEntryFlow',
      },
      visaRequirement: {
        'CHN': 'visa_free',
        'default': 'check_requirements',
      },
    },
    {
      id: 'jp',
      flag: '🇯🇵',
      name: 'Japan',
      nameZh: '日本',
      flightTimeKey: 'home.destinations.japan.flightTime',
      enabled: true,
      priority: 1,
      screens: {
        info: 'JapanInfo',
        entryFlow: 'JapanEntryFlow',
      },
      visaRequirement: {
        'CHN': 'visa_free',
        'default': 'visa_free',
      },
    },
  ]),
  getDestination: jest.fn((id) => {
    const destinations = {
      th: {
        id: 'th',
        flag: '🇹🇭',
        name: 'Thailand',
        nameZh: '泰国',
        flightTimeKey: 'home.destinations.thailand.flightTime',
        enabled: true,
        priority: 2,
        screens: {
          info: 'ThailandInfo',
          entryFlow: 'ThailandEntryFlow',
        },
        visaRequirement: {
          'CHN': 'visa_free',
          'default': 'check_requirements',
        },
      },
      jp: {
        id: 'jp',
        flag: '🇯🇵',
        name: 'Japan',
        nameZh: '日本',
        flightTimeKey: 'home.destinations.japan.flightTime',
        enabled: true,
        priority: 1,
        screens: {
          info: 'JapanInfo',
          entryFlow: 'JapanEntryFlow',
        },
        visaRequirement: {
          'CHN': 'visa_free',
          'default': 'visa_free',
        },
      },
    };
    if (!destinations[id]) {
      throw new Error(`Unknown destination: ${id}`);
    }
    return destinations[id];
  }),
  getScreenMappings: jest.fn((id) => {
    const screens = {
      th: {
        info: 'ThailandInfo',
        entryFlow: 'ThailandEntryFlow',
      },
      jp: {
        info: 'JapanInfo',
        entryFlow: 'JapanEntryFlow',
      },
    };
    return screens[id] || null;
  }),
  isDestinationAvailable: jest.fn((id) => {
    return id === 'th' || id === 'jp';
  }),
}));

describe('countriesService', () => {
  const mockT = jest.fn((key, options = {}) => {
    const translations = {
      'home.destinations.thailand.flightTime': '3 hours',
      'home.destinations.japan.flightTime': '3 hours',
    };
    return translations[key] || options.defaultValue || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCountries', () => {
    it('should return all countries from config system', () => {
      const countries = getAllCountries({ enabledOnly: false, includeFallbacks: false });
      expect(countries).toHaveLength(2);
      expect(countries[0].id).toBe('th');
      expect(countries[1].id).toBe('jp');
    });

    it('should return only enabled countries when enabledOnly is true', () => {
      const countries = getAllCountries({ enabledOnly: true, includeFallbacks: false });
      expect(countries).toHaveLength(2);
      expect(countries.every(c => c.enabled)).toBe(true);
    });

    it('should include fallback countries when includeFallbacks is true', () => {
      const countries = getAllCountries({ enabledOnly: false, includeFallbacks: true });
      expect(countries.length).toBeGreaterThan(2);
    });
  });

  describe('getVisaRequirement', () => {
    it('should return visa requirement for Chinese passport', () => {
      const requirement = getVisaRequirement('th', 'CHN');
      expect(requirement).toBe('visa_free');
    });

    it('should return default requirement when nationality not found', () => {
      const requirement = getVisaRequirement('th', 'UNKNOWN');
      expect(requirement).toBe('check_requirements');
    });

    it('should return unknown for non-existent country', () => {
      const requirement = getVisaRequirement('xx', 'CHN');
      expect(requirement).toBe('unknown');
    });
  });

  describe('getVisaPriority', () => {
    it('should return correct priority for visa_free', () => {
      expect(getVisaPriority('visa_free')).toBe(1);
    });

    it('should return correct priority for evisa', () => {
      expect(getVisaPriority('evisa')).toBe(3);
    });

    it('should return correct priority for keta', () => {
      expect(getVisaPriority('keta')).toBe(3);
    });

    it('should return correct priority for visa_required', () => {
      expect(getVisaPriority('visa_required')).toBe(4);
    });

    it('should return 5 for unknown requirements', () => {
      expect(getVisaPriority('unknown')).toBe(5);
      expect(getVisaPriority('nonexistent')).toBe(5);
    });
  });

  describe('getCountryScreen', () => {
    it('should return correct screen name for info screen', () => {
      const screen = getCountryScreen('th', 'info');
      expect(screen).toBe('ThailandInfo');
    });

    it('should return correct screen name for entryFlow screen', () => {
      const screen = getCountryScreen('th', 'entryFlow');
      expect(screen).toBe('ThailandEntryFlow');
    });

    it('should return null for non-existent screen type', () => {
      const screen = getCountryScreen('th', 'nonexistent');
      expect(screen).toBeNull();
    });

    it('should return null for non-existent country', () => {
      const screen = getCountryScreen('xx', 'info');
      expect(screen).toBeNull();
    });
  });

  describe('getCountryForDisplay', () => {
    it('should return country data with localized name for English', () => {
      const country = getCountryForDisplay('th', mockT, 'en');
      expect(country).toBeTruthy();
      expect(country.id).toBe('th');
      expect(country.displayName).toBe('Thailand');
      expect(country.flag).toBe('🇹🇭');
    });

    it('should return country data with localized name for Chinese', () => {
      const country = getCountryForDisplay('th', mockT, 'zh-CN');
      expect(country).toBeTruthy();
      expect(country.displayName).toBe('泰国');
    });

    it('should include visa requirement and priority', () => {
      const country = getCountryForDisplay('th', mockT, 'en');
      expect(country.visaRequirement).toBeDefined();
      expect(country.visaPriority).toBeDefined();
    });

    it('should return null for non-existent country', () => {
      const country = getCountryForDisplay('xx', mockT, 'en');
      expect(country).toBeNull();
    });
  });

  describe('getHotCountries', () => {
    it('should return sorted countries by visa priority', () => {
      const countries = getHotCountries(mockT, 'en', []);
      expect(countries.length).toBeGreaterThan(0);
      // Countries should be sorted by visa priority (lower = higher priority)
      for (let i = 1; i < countries.length; i++) {
        expect(countries[i].visaPriority).toBeGreaterThanOrEqual(countries[i - 1].visaPriority);
      }
    });

    it('should exclude specified country IDs', () => {
      const countries = getHotCountries(mockT, 'en', ['th']);
      expect(countries.find(c => c.id === 'th')).toBeUndefined();
    });

    it('should include display names and flight times', () => {
      const countries = getHotCountries(mockT, 'en', []);
      expect(countries.length).toBeGreaterThan(0);
      countries.forEach(country => {
        expect(country.displayName).toBeDefined();
        expect(country.flightTime).toBeDefined();
      });
    });
  });

  describe('navigateToCountry', () => {
    it('should navigate to correct screen', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };
      const params = { passport: {}, destination: {} };

      navigateToCountry(mockNavigation, 'th', 'info', params);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ThailandInfo', params);
    });

    it('should navigate to entryFlow screen', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };
      const params = { passport: {}, destination: {} };

      navigateToCountry(mockNavigation, 'th', 'entryFlow', params);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ThailandEntryFlow', params);
    });

    it('should fallback to TravelInfo for non-existent screen', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };
      const params = { passport: {}, destination: {} };

      navigateToCountry(mockNavigation, 'xx', 'info', params);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TravelInfo', params);
    });
  });

  describe('getCountryFlag', () => {
    it('should return correct flag for existing country', () => {
      const flag = getCountryFlag('th');
      expect(flag).toBe('🇹🇭');
    });

    it('should return fallback flag for non-existent country', () => {
      const flag = getCountryFlag('xx');
      expect(flag).toBe('🌍');
    });
  });

  describe('getCountryName', () => {
    it('should return English name for English locale', () => {
      const name = getCountryName('th', 'en');
      expect(name).toBe('Thailand');
    });

    it('should return Chinese name for Chinese locale', () => {
      const name = getCountryName('th', 'zh-CN');
      expect(name).toBe('泰国');
    });

    it('should return country ID for non-existent country', () => {
      const name = getCountryName('xx', 'en');
      expect(name).toBe('xx');
    });
  });
});

