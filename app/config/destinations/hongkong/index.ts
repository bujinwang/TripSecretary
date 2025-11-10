// @ts-nocheck

/**
 * Hong Kong Destination Configuration
 *
 * Aggregates all Hong Kong specific configuration for the template-based flow.
 */

import metadata from './metadata';
import travelInfoConfig from './travelInfoConfig';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig';
import entryFlowConfig from './entryFlowConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';

import entryGuideConfig from '../../entryGuide/hongkong';

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
