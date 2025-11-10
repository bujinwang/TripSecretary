// @ts-nocheck

/**
 * Japan Destination Configuration
 *
 * Mirrors the Malaysia setup so all shared templates are plug-and-play.
 */

import metadata from './metadata';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';
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
  // Core metadata
  ...metadata,

  // Travel info configs
  travelInfo: travelInfoConfig,
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  // Entry flow & pack preview
  entryFlow: entryFlowConfig,
  entryPackPreview: entryPackPreviewConfig,

  // Info/requirements screens
  infoScreen: infoScreenConfig,
  requirementsScreen: requirementsScreenConfig,

  // Entry guide (airport process)
  entryGuide: entryGuideConfig,

  // Location data bindings
  dataPath: {
    prefectures: '@data/japanLocations',
    locations: '@data/japanLocations',
  },

  // Service mappings
  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // Screen mappings
  screens: {
    info: 'JapanInfo',
    requirements: 'JapanRequirements',
    travelInfo: 'JapanTravelInfo',
    entryFlow: 'JapanEntryFlow',
    entryGuide: 'JapanEntryGuide',
    entryPackPreview: 'JapanEntryPackPreview',
  },

  // Feature flags
  features: {
    digitalArrivalCard: false,
    paperArrivalCard: true,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true,
    visaFreeEntry: true,
    arrivalCardRequired: true,
  },
};

export default japanConfig;
