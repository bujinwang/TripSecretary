/**
 * United States Destination Configuration
 */

import metadata from './metadata.js';
import travelInfoConfig from './travelInfoConfig.js';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig.js';
import entryFlowConfig from './entryFlowConfig.js';
import entryPackPreviewConfig from './entryPackPreviewConfig.js';
import infoScreenConfig from './infoScreenConfig.js';
import requirementsScreenConfig from './requirementsScreenConfig.js';

import entryGuideConfig from '../../entryGuide/usa.js';

const usaConfig = {
  ...metadata,

  travelInfo: travelInfoConfig,
  comprehensiveTravelInfo: comprehensiveTravelInfoConfig,

  entryFlow: entryFlowConfig,
  entryPackPreview: entryPackPreviewConfig,

  infoScreen: infoScreenConfig,
  requirementsScreen: requirementsScreenConfig,

  entryGuide: entryGuideConfig,

  dataPath: {
    states: '@data/usaLocations',
  },

  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  screens: {
    info: 'USAInfo',
    requirements: 'USARequirements',
    travelInfo: 'USTravelInfo',
    entryFlow: 'USAEntryFlow',
    entryGuide: null,
    entryPackPreview: 'USAEntryPackPreview',
  },

  features: {
    digitalArrivalCard: false,
    entryGuide: false,
    multiLanguageSupport: true,
    offlineMode: true,
    visaRequired: true,
  },
};

export default usaConfig;
