/**
 * Vietnam Destination Configuration
 *
 * Aggregates all Vietnam-specific configuration including:
 * - Metadata (IDs, names, currency)
 * - Entry guide configuration
 *
 * This serves as the single source of truth for Vietnam configuration.
 * Note: Vietnam has a simpler configuration than Thailand as it doesn't
 * have digital arrival card systems like TDAC.
 */

import metadata from './metadata';
import entryPackPreviewConfig from './entryPackPreviewConfig';

// Entry guide is kept in its existing location
import entryGuideConfig from '../../entryGuide/vietnam';

/**
 * Complete Vietnam destination configuration
 * @type {import('../types').DestinationConfig}
 */
const vietnamConfig = {
  // Core Metadata
  ...metadata,

  // Entry pack preview configuration
  entryPackPreview: entryPackPreviewConfig,

  // Entry Guide (airport process)
  entryGuide: entryGuideConfig,

  // Location Data (provinces, districts)
  // Note: Vietnam uses 2-level hierarchy (provinces -> districts)
  // No sub-districts like Thailand
  dataPath: {
    provinces: '@data/vietnamLocations',
    locations: '@data/vietnamLocations',
  },

  // Service Mappings
  services: {
    // Entry info service (generic, not Vietnam-specific)
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // Screen Mappings (for navigation)
  screens: {
    info: 'VietnamInfo',
    requirements: 'VietnamRequirements',
    travelInfo: 'VietnamTravelInfo',
  },

  // Feature Flags
  features: {
    digitalArrivalCard: false, // Vietnam doesn't have digital arrival card yet
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true, // Can work offline (no digital card submission needed)
    eVisaInfo: true, // Show e-Visa information
  },
};

export default vietnamConfig;
