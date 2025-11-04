/**
 * Malaysia Destination Configuration
 *
 * Aggregates all Malaysia-specific configuration including:
 * - Metadata (IDs, names, currency)
 * - Entry guide configuration
 * - Travel info configuration
 * - Entry flow configuration
 * - Entry pack preview configuration
 *
 * This serves as the single source of truth for Malaysia configuration.
 * Note: Malaysia uses the MDAC (Malaysia Digital Arrival Card) system.
 */

import metadata from './metadata';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig';
import entryFlowConfig from './entryFlowConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';

// Entry guide configuration
import entryGuideConfig from '../../entryGuide/malaysia';

/**
 * Complete Malaysia destination configuration
 * @type {import('../types').DestinationConfig}
 */
const malaysiaConfig = {
  // Core Metadata
  ...metadata,

  // Enhanced travel info config (V2 template)
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  // Basic travel info config
  travelInfo: comprehensiveTravelInfoConfig, // Reuse comprehensive config for travel info

  // Entry flow configuration
  entryFlow: entryFlowConfig,

  // Entry pack preview configuration
  entryPackPreview: entryPackPreviewConfig,

  // Info screen configuration
  infoScreen: infoScreenConfig,

  // Requirements screen configuration
  requirementsScreen: requirementsScreenConfig,

  // Entry Guide (airport process)
  entryGuide: entryGuideConfig,

  // Location Data (states, districts)
  // Malaysia uses 2-level hierarchy (states -> districts)
  dataPath: {
    states: '@data/malaysiaLocations',
    districts: '@data/malaysiaLocations',
    locations: '@data/malaysiaLocations',
  },

  // Service Mappings
  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // Screen Mappings (for navigation)
  screens: {
    info: 'MalaysiaInfo',
    requirements: 'MalaysiaRequirements',
    travelInfo: 'MalaysiaTravelInfo',
    entryFlow: 'MalaysiaEntryFlow',
    entryGuide: 'MalaysiaEntryGuide',
    entryPackPreview: 'MalaysiaEntryPackPreview',
    mdacSelection: 'MDACSelection',
    mdacGuide: 'MDACGuide',
  },

  // Feature Flags
  features: {
    digitalArrivalCard: true, // Malaysia uses MDAC (Malaysia Digital Arrival Card)
    mdac: true, // MDAC specific features
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true, // Can work offline and submit later
    visaFreeEntry: true, // Malaysia offers visa-free entry for many countries
    arrivalCardRequired: true, // Digital arrival card required
  },

  // Malaysia-specific configurations
  malaysia: {
    // MDAC (Malaysia Digital Arrival Card) details
    mdac: {
      type: 'digital',
      languages: ['en', 'zh', 'ms'],
      required: true,
      canBeFilledOnline: true,
      submissionMethod: 'digital', // Submit via MDAC website
      submissionWindow: 72, // Must submit within 3 days (72 hours) before arrival
    },

    // Visa-free entry information
    visaFreeEntry: {
      allowed: true,
      duration: 30, // days
      eligibleCountries: [
        'CHN', 'HKG', 'MAC', 'TWN', 'USA', 'GBR', 'CAN', 'AUS',
        'SGP', 'THA', 'VNM', 'IDN', 'PHL', 'JPN', 'KOR', 'IND'
      ],
      conditions: 'tourism_business', // Tourism and business purposes
    },

    // Location hierarchy
    locationHierarchy: {
      levels: 2,
      level1Name: 'State',
      level2Name: 'District',
    },
  },

  // Localization
  localization: {
    primaryLanguage: 'en',
    supportedLanguages: ['en', 'zh-CN', 'zh-TW', 'ms'],
    fallbackLanguage: 'en',
  },
};

export default malaysiaConfig;
