/**
 * Thailand Destination Configuration
 *
 * Aggregates all Thailand-specific configuration including:
 * - Metadata (IDs, names, currency)
 * - Financial information (ATM fees, cash recommendations)
 * - Emergency contacts (police, embassy, hospitals)
 * - Entry guide (separate file - existing)
 * - Validation rules (to be migrated)
 *
 * This serves as the single source of truth for Thailand configuration.
 */

import metadata from './metadata';
import financialInfo from './financialInfo';
import emergencyInfo from './emergencyInfo';
import accommodationTypes from './accommodationTypes';
import travelPurposes from './travelPurposes';

// Entry guide is kept in its existing location for now
// Will be migrated as part of Phase 1.5
import entryGuideConfig from '../../entryGuide/thailand';

/**
 * Complete Thailand destination configuration
 * @type {import('../types').DestinationConfig}
 */
const thailandConfig = {
  // Core Metadata
  ...metadata,

  // Financial Information
  financial: financialInfo,

  // Emergency Contacts
  emergency: emergencyInfo,

  // Entry Guide (7-step airport process)
  entryGuide: entryGuideConfig,

  // Accommodation Types Configuration
  accommodationTypes,

  // Travel Purpose Configuration
  travelPurposes,

  // Validation Rules (to be added in Phase 2)
  // validation: validationRules,

  // Location Data (provinces, districts, sub-districts)
  // Kept in existing location for now: app/data/thailandProvinces.js
  dataPath: {
    provinces: '@data/thailandProvinces',
    locations: '@data/thailandLocations',
  },

  // Service Mappings
  services: {
    // Digital arrival card service
    digitalCard: {
      serviceClass: 'TDACAPIService',
      submissionService: 'TDACSubmissionService',
      validationService: 'TDACValidationService',
      contextBuilder: 'ThailandTravelerContextBuilder',
    },

    // Entry info service (generic, not Thailand-specific)
    entryInfo: {
      serviceClass: 'EntryInfoService',
    },
  },

  // Screen Mappings (for navigation)
  screens: {
    info: 'ThailandInfo',
    entryFlow: 'ThailandEntryFlow',
    entryQuestions: 'ThailandEntryQuestions',
    travelInfo: 'ThailandTravelInfo',
    requirements: 'ThailandRequirements',
    guide: 'ThailandInteractiveGuide',
    tdacWebView: 'TDACWebView',
    tdacHybrid: 'TDACHybrid',
  },

  // Feature Flags
  features: {
    digitalArrivalCard: true,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: false, // TDAC requires internet
    qrCodeExtraction: false, // Not yet implemented
  },
};

export default thailandConfig;
