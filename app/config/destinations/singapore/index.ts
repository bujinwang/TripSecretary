// @ts-nocheck

/**
 * Singapore Destination Configuration
 *
 * Aligns with the shared template-based implementation.
 */

import metadata from './metadata';
import travelInfoConfig from './travelInfoConfig';
import comprehensiveTravelInfoConfig from './comprehensiveTravelInfoConfig';
import entryFlowConfig from './entryFlowConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';

import entryGuideConfig from '../../entryGuide/singapore';

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
