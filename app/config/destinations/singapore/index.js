/**
 * Singapore Destination Configuration
 *
 * Aligns with the shared template-based implementation.
 */

import metadata from './metadata.js';
import travelInfoConfig from './travelInfoConfig.js';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig.js';
import entryFlowConfig from './entryFlowConfig.js';
import entryPackPreviewConfig from './entryPackPreviewConfig.js';
import infoScreenConfig from './infoScreenConfig.js';
import requirementsScreenConfig from './requirementsScreenConfig.js';

import entryGuideConfig from '../../entryGuide/singapore.js';

const singaporeConfig = {
  ...metadata,

  travelInfo: travelInfoConfig,
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  entryFlow: entryFlowConfig,
  entryPackPreview: entryPackPreviewConfig,

  infoScreen: infoScreenConfig,
  requirementsScreen: requirementsScreenConfig,

  entryGuide: entryGuideConfig,

  dataPath: {
    locations: '@data/singaporeRegions',
    planningAreas: '@data/singaporeRegions',
  },

  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  screens: {
    info: 'SingaporeInfo',
    requirements: 'SingaporeRequirements',
    travelInfo: 'SingaporeTravelInfo',
    entryFlow: 'SingaporeEntryFlow',
    entryGuide: 'SingaporeEntryGuide',
    entryPackPreview: 'SingaporeEntryPackPreview',
    sgacSelection: 'SGACSelection',
  },

  features: {
    digitalArrivalCard: true,
    sgac: true,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true,
    visaFreeEntry: true,
    arrivalCardRequired: true,
  },
};

export default singaporeConfig;
