/**
 * Malaysia Destination Configuration
 *
 * Aggregates Malaysia-specific metadata and feature flags.
 * Mirrors Vietnam's structure for template-driven screens.
 */

import metadata from './metadata';
import entryGuideConfig from '../../entryGuide/malaysia';

const malaysiaConfig = {
  ...metadata,

  entryGuide: entryGuideConfig,

  services: {
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  screens: {
    info: 'MalaysiaInfo',
    requirements: 'MalaysiaRequirements',
    travelInfo: 'MalaysiaTravelInfo',
    entryFlow: 'MalaysiaEntryFlow',
    entryGuide: 'MalaysiaEntryGuide',
    mdacSelection: 'MDACSelection',
    mdacGuide: 'MDACGuide',
  },

  features: {
    digitalArrivalCard: true,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true,
    mdac: true,
  },
};

export default malaysiaConfig;
