/**
 * South Korea Destination Configuration
 *
 * Aggregates all South Korea-specific configuration including:
 * - Metadata (IDs, names, currency)
 * - Entry guide configuration
 *
 * This serves as the single source of truth for South Korea configuration.
 * Note: Korea requires K-ETA (Korean Electronic Travel Authorization) for most visitors.
 */

import metadata from './metadata';

// Entry guide is kept in its existing location
import entryGuideConfig from '../../entryGuide/korea';

/**
 * Complete South Korea destination configuration
 * @type {import('../types').DestinationConfig}
 */
const koreaConfig = {
  // Core Metadata
  ...metadata,

  // Entry Guide (airport process)
  entryGuide: entryGuideConfig,

  // Location Data (provinces, cities)
  // Note: Korea uses provinces and cities structure
  dataPath: {
    provinces: '@data/koreaLocations',
    locations: '@data/koreaLocations',
  },

  // Service Mappings
  services: {
    // Entry info service (generic, not Korea-specific)
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // Screen Mappings (for navigation)
  screens: {
    info: 'KoreaInfo',
    requirements: 'KoreaRequirements',
    travelInfo: 'KoreaTravelInfo',
    entryFlow: 'KoreaEntryFlow',
    entryPackPreview: 'KoreaEntryPackPreview',
  },

  // Feature Flags
  features: {
    digitalArrivalCard: false, // Korea uses paper arrival cards
    keta: true, // K-ETA electronic travel authorization required
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true, // Can work offline (no digital card submission needed)
    biometricRequired: true, // Requires biometric information for K-ETA
  },
};

export default koreaConfig;

