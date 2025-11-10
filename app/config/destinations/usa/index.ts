// @ts-nocheck

/**
 * United States Destination Configuration
 */

import metadata from './metadata';
import travelInfoConfig from './travelInfoConfig';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig';
import entryFlowConfig from './entryFlowConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';

import entryGuideConfig from '../../entryGuide/usa';

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
