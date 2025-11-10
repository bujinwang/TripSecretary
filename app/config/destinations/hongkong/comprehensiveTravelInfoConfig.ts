/**
 * Hong Kong Comprehensive Travel Info Config (Template V2)
 */

import { hongkongTravelInfoConfig } from './travelInfoConfig';

export const hongkongComprehensiveTravelInfoConfig = {
  ...hongkongTravelInfoConfig,

  version: '2.0' as const,
  template: 'enhanced' as const,

  navigation: {
    previous: 'HongKongRequirements' as const,
    next: 'HongKongEntryFlow' as const,
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: {
        incomplete: 0.55,
        almostDone: 0.8,
        ready: 0.95,
      },
      labels: {
        incomplete: 'hk.navigation.submitButton.incomplete' as const,
        almostDone: 'hk.navigation.submitButton.almostDone' as const,
        ready: 'hk.navigation.submitButton.ready' as const,
      },
      default: 'hk.navigation.submitButton.default' as const,
    },
  },

  fieldState: {
    enabled: true,
    trackUserModifications: true,
    saveModifiedOnly: true,
    markTouchedOnInteraction: true,
    immediateSaveFields: [
      'surname' as const,
      'givenName' as const,
      'passportNo' as const,
      'nationality' as const,
      'dob' as const,
      'arrivalDate' as const,
      'arrivalFlightNumber' as const,
      'province' as const,
      'district' as const,
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
          messageKey: 'hongkong.validation.warnings.noDeparture.message' as const,
          severity: 'medium' as const,
        },
        lowFunds: {
          messageKey: 'hongkong.validation.warnings.lowFunds.message' as const,
          severity: 'medium' as const,
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
} as const;

export default hongkongComprehensiveTravelInfoConfig;