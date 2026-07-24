/**
 * Singapore Comprehensive Travel Info Config (Template V2)
 */

import { singaporeTravelInfoConfig } from './travelInfoConfig';

export const singaporeComprehensiveTravelInfoConfig = {
  ...singaporeTravelInfoConfig,

  version: '2.0' as const,
  template: 'enhanced' as const,

  navigation: {
    previous: 'SingaporeRequirements' as const,
    next: 'SingaporeEntryFlow' as const,
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: {
        incomplete: 0.6,
        almostDone: 0.85,
        ready: 0.95,
      },
      labels: {
        incomplete: 'sg.navigation.submitButton.incomplete' as const,
        almostDone: 'sg.navigation.submitButton.almostDone' as const,
        ready: 'sg.navigation.submitButton.ready' as const,
      },
      default: 'sg.navigation.submitButton.default' as const,
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
    ...singaporeTravelInfoConfig.features,
    autoSave: {
      enabled: true,
      delay: 1000,
      maxRetries: 3,
      retryDelay: 1200,
    },
    softValidation: true,
  },

  validation: {
    ...singaporeTravelInfoConfig.validation,
    softValidation: {
      enabled: true,
      warnings: {
        noDeparture: {
          message: '未填写返程信息，建议准备以备移民局询问。',
          severity: 'low' as const,
        },
        lowFunds: {
          message: '建议携带足够现金或信用卡，移民官可能抽查资金证明。',
          severity: 'medium' as const,
        },
      },
    },
  },

  completion: {
    ...singaporeTravelInfoConfig.completion,
    historicalTracking: {
      enabled: true,
      maxSnapshots: 6,
    },
  },
} as const;

export default singaporeComprehensiveTravelInfoConfig;