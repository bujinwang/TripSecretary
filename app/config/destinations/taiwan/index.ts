// @ts-nocheck

import metadata from './metadata';
import travelInfoConfig from './travelInfoConfig';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig';
import entryFlowConfig from './entryFlowConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';

const taiwanConfig = {
  ...metadata,

  travelInfo: travelInfoConfig,
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  entryFlow: entryFlowConfig,
  entryPackPreview: entryPackPreviewConfig,

  infoScreen: infoScreenConfig,
  requirementsScreen: requirementsScreenConfig,

  dataPath: {
    locations: '@data/taiwanLocations',
    cities: '@data/taiwanLocations',
  },

  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  screens: {
    info: 'TaiwanInfo',
    requirements: 'TaiwanRequirements',
    travelInfo: 'TaiwanTravelInfo',
    entryFlow: 'TaiwanEntryFlow',
    entryGuide: 'TWArrivalGuide',
    entryPackPreview: 'TaiwanEntryPackPreview',
  },

  features: {
    digitalArrivalCard: true,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true,
    visaFreeEntry: false,
    arrivalCardRequired: true,
  },
};

export default taiwanConfig;
