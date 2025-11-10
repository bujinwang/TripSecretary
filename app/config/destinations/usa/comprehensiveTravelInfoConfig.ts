/**
 * United States Comprehensive Travel Info Config (Template V2)
 */

import { usaTravelInfoConfig } from './travelInfoConfig';

export const usaComprehensiveTravelInfoConfig = {
  ...usaTravelInfoConfig,

  version: '2.0' as const,
  template: 'enhanced' as const,

  navigation: {
    previous: 'USARequirements' as const,
    next: 'USAEntryFlow' as const,
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: {
        incomplete: 0.5,
        almostDone: 0.8,
        ready: 0.95,
      },
      labels: {
        incomplete: 'us.navigation.submitButton.incomplete' as const,
        almostDone: 'us.navigation.submitButton.almostDone' as const,
        ready: 'us.navigation.submitButton.ready' as const,
      },
      default: 'us.navigation.submitButton.default' as const,
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
    ],
  },

  userInteraction: {
    enabled: true,
    preventDataOverwrites: true,
    logInteractions: __DEV__,
  },

  features: {
    ...usaTravelInfoConfig.features,
    autoSave: {
      enabled: true,
      delay: 1000,
      maxRetries: 3,
      retryDelay: 1200,
    },
    softValidation: true,
  },

  validation: {
    ...usaTravelInfoConfig.validation,
    softValidation: {
      enabled: true,
      warnings: {
        missingDeparture: {
          message: '未填写返程安排，CBP 可能会询问离境计划。',
          severity: 'medium' as const,
        },
        evusExpired: {
          message: 'EVUS 状态未标记为有效，建议出发前更新。',
          severity: 'high' as const,
        },
      },
    },
  },

  completion: {
    ...usaTravelInfoConfig.completion,
    historicalTracking: {
      enabled: true,
      maxSnapshots: 6,
    },
  },
} as const;

export default usaComprehensiveTravelInfoConfig;