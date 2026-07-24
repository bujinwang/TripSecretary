/**
 * Thailand Destination Configuration
 *
 * Aggregates all Thailand-specific configuration including:
 * - Metadata (IDs, names, currency)
 * - Financial information (ATM fees, cash recommendations)
 * - Emergency contacts (police, embassy, hospitals)
 * - Entry guide (separate file - existing)
 * - Validation rules (to be migrated)
 * - Entry flow, info screen, requirements screen configs
 *
 * This serves as the single source of truth for Thailand configuration.
 */

import metadata from './metadata';
import financialInfo from './financialInfo';
import emergencyInfo from './emergencyInfo';
import accommodationTypes from './accommodationTypes';
import travelPurposes from './travelPurposes';
import validationRules from './validationRules';
import entryFlowConfig from './entryFlowConfig';
import infoScreenConfig from './infoScreenConfig';
import requirementsScreenConfig from './requirementsScreenConfig';
import entryPackPreviewConfig from './entryPackPreviewConfig';

// Entry guide is kept in its existing location for now
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

  // Validation Rules
  validation: validationRules,

  // Screen configs
  entryFlow: entryFlowConfig,
  infoScreen: infoScreenConfig,
  requirementsScreen: requirementsScreenConfig,
  entryPackPreview: entryPackPreviewConfig,

  // Location Data (provinces, districts, sub-districts)
  dataPath: {
    provinces: '@data/thailandProvinces',
    locations: '@data/thailandLocations',
  },

  // Service Mappings
  services: {
    digitalCard: {
      serviceClass: 'TDACAPIService',
      submissionService: 'TDACSubmissionService',
      validationService: 'TDACValidationService',
      contextBuilder: 'ThailandTravelerContextBuilder',
    },
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
    offlineMode: false,
    qrCodeExtraction: false,
  },
};

export default thailandConfig;
