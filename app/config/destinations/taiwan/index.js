import metadata from './metadata.js';
import travelInfoConfig from './travelInfoConfig.js';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig.js';
import entryFlowConfig from './entryFlowConfig.js';
import entryPackPreviewConfig from './entryPackPreviewConfig.js';
import infoScreenConfig from './infoScreenConfig.js';
import requirementsScreenConfig from './requirementsScreenConfig.js';

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
