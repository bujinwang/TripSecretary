/**
 * Hong Kong Destination Configuration
 *
 * Aggregates all Hong Kong specific configuration for the template-based flow.
 */

import metadata from './metadata.js';
import travelInfoConfig from './travelInfoConfig.js';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig.js';
import entryFlowConfig from './entryFlowConfig.js';
import entryPackPreviewConfig from './entryPackPreviewConfig.js';
import infoScreenConfig from './infoScreenConfig.js';
import requirementsScreenConfig from './requirementsScreenConfig.js';

import entryGuideConfig from '../../entryGuide/hongkong.js';

const hongkongConfig = {
  ...metadata,

  travelInfo: travelInfoConfig,
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  entryFlow: entryFlowConfig,
  entryPackPreview: entryPackPreviewConfig,

  infoScreen: infoScreenConfig,
  requirementsScreen: requirementsScreenConfig,

  entryGuide: entryGuideConfig,

  dataPath: {
    regions: '@data/hongkongLocations',
    districts: '@data/hongkongLocations',
  },

  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  screens: {
    info: 'HongKongInfo',
    requirements: 'HongKongRequirements',
    travelInfo: 'HongKongTravelInfo',
    entryFlow: 'HongKongEntryFlow',
    entryGuide: 'HongKongEntryGuide',
    entryPackPreview: 'HongKongEntryPackPreview',
  },

  features: {
    digitalArrivalCard: false,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true,
    visaFreeEntry: true,
    arrivalCardRequired: false,
  },
};

export default hongkongConfig;
