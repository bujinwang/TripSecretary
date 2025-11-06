/**
 * Hong Kong Comprehensive Travel Info Config (Template V2)
 */

import { hongkongTravelInfoConfig } from './travelInfoConfig';

export const hongkongComprehensiveTravelInfoConfig = {
  ...hongkongTravelInfoConfig,

  version: '2.0',
  template: 'enhanced',

  navigation: {
    previous: 'HongKongRequirements',
    next: 'HongKongEntryFlow',
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: {
        incomplete: 0.55,
        almostDone: 0.8,
        ready: 0.95,
      },
      labels: {
        incomplete: 'hongkong.navigation.submitButton.incomplete',
        almostDone: 'hongkong.navigation.submitButton.almostDone',
        ready: 'hongkong.navigation.submitButton.ready',
      },
      default: 'hongkong.navigation.submitButton.default',
    },
  },

  fieldState: {
    enabled: true,
    trackUserModifications: true,
    saveModifiedOnly: true,
    markTouchedOnInteraction: true,
    immediateSaveFields: [
      'surname',
      'givenName',
      'passportNo',
      'nationality',
      'dob',
      'arrivalDate',
      'arrivalFlightNumber',
      'province',
      'district',
    ],
  },

  userInteraction: {
    enabled: true,
    preventDataOverwrites: true,
    logInteractions: __DEV__,
  },

  features: {
    ...hongkongTravelInfoConfig.features,
    autoSave: {
      enabled: true,
      delay: 1000,
      maxRetries: 3,
      retryDelay: 1200,
    },
    softValidation: true,
  },

  validation: {
    ...hongkongTravelInfoConfig.validation,
    softValidation: {
      enabled: true,
      warnings: {
        noDeparture: {
          messageKey: 'hongkong.validation.warnings.noDeparture.message',
          severity: 'medium',
        },
        lowFunds: {
          messageKey: 'hongkong.validation.warnings.lowFunds.message',
          severity: 'medium',
        },
      },
    },
  },

  completion: {
    ...hongkongTravelInfoConfig.completion,
    historicalTracking: {
      enabled: true,
      maxSnapshots: 6,
    },
  },
};

export default hongkongComprehensiveTravelInfoConfig;
