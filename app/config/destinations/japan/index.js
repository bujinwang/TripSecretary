/**
 * Japan Destination Configuration
 *
 * Aggregates all Japan-specific configuration including:
 * - Metadata (IDs, names, currency)
 * - Entry guide configuration
 * - Travel info configuration
 * - Entry flow configuration
 *
 * This serves as the single source of truth for Japan configuration.
 * Note: Japan doesn't have digital arrival card systems like TDAC,
 * so it follows a similar pattern to Vietnam with paper-based arrival cards.
 */

import metadata from './metadata';
import travelInfoConfig from './travelInfoConfig';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig';
import entryFlowConfig from './entryFlowConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';

// Entry guide configuration
import entryGuideConfig from '../../entryGuide/japan';

/**
 * Complete Japan destination configuration
 * @type {import('../types').DestinationConfig}
 */
const japanConfig = {
  // Core Metadata
  ...metadata,

  // Enhanced travel info config (V2 template)
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  // Basic travel info config
  travelInfo: travelInfoConfig,

  // Entry flow configuration
  entryFlow: entryFlowConfig,

  // Entry pack preview configuration
  entryPackPreview: entryPackPreviewConfig,

  // Entry Guide (airport process)
  entryGuide: entryGuideConfig,

  // Location Data (prefectures, cities)
  // Japan uses 2-level hierarchy (prefectures -> cities)
  dataPath: {
    prefectures: '@data/japanLocations',
    locations: '@data/japanLocations',
  },

  // Service Mappings
  services: {
    // Entry info service (generic, not Japan-specific)
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // Screen Mappings (for navigation)
  screens: {
    info: 'JapanInfo',
    requirements: 'JapanRequirements',
    travelInfo: 'JapanTravelInfo',
    entryFlow: 'JapanEntryFlow',
    entryGuide: 'JapanEntryGuide',
    entryPackPreview: 'JapanEntryPackPreview',
  },

  // Feature Flags
  features: {
    digitalArrivalCard: false, // Japan doesn't have digital arrival card yet (paper only)
    paperArrivalCard: true, // Japan still uses paper arrival cards
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true, // Can work offline (no digital card submission needed)
    visaFreeEntry: true, // Japan offers visa-free entry for many countries
    arrivalCardRequired: true, // Paper arrival card still required
  },

  // Japan-specific configurations
  japan: {
    // Arrival card details
    arrivalCard: {
      type: 'paper',
      languages: ['ja', 'en', 'zh'],
      required: true,
      canBeFilledOnline: false,
      submissionMethod: 'physical', // Hand to immigration officer
    },

    // Visa-free entry information
    visaFreeEntry: {
      allowed: true,
      duration: 90, // days
      eligibleCountries: [
        'CHN', 'HKG', 'MAC', 'TWN', 'USA', 'GBR', 'CAN', 'AUS', 
        'SGP', 'MYS', 'THA', 'VNM', 'IDN', 'PHL'
      ],
      conditions: 'tourism_only', // Tourism purposes only
    },

    // Customs declaration threshold
    customsDeclaration: {
      required: true,
      threshold: 100000, // JPY
      currency: 'JPY',
    },
  },

  // Localization
  localization: {
    primaryLanguage: 'ja',
    supportedLanguages: ['ja', 'en', 'zh-CN', 'zh-TW'],
    fallbackLanguage: 'en',
  },
};

export default japanConfig;