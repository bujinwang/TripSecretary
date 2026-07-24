import { taiwanTravelInfoConfig } from './travelInfoConfig';

export const taiwanComprehensiveTravelInfoConfig = {
  ...taiwanTravelInfoConfig,

  version: '2.0' as const,
  template: 'enhanced' as const,

  navigation: {
    previous: 'TaiwanRequirements' as const,
    next: 'TaiwanEntryFlow' as const,
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: {
        incomplete: 0.6,
        almostDone: 0.85,
        ready: 0.95,
      },
      // Labels will be resolved via i18n: tw.travelInfo.buttonLabels.incomplete/almostDone/ready
      labels: {
        incomplete: 'tw.travelInfo.buttonLabels.incomplete' as const,
        almostDone: 'tw.travelInfo.buttonLabels.almostDone' as const,
        ready: 'tw.travelInfo.buttonLabels.ready' as const,
      },
      default: 'tw.travelInfo.continue' as const,
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
    ...taiwanTravelInfoConfig.features,
    autoSave: {
      enabled: true,
      delay: 1000,
      maxRetries: 3,
      retryDelay: 1200,
    },
    softValidation: true,
  },

  validation: {
    ...taiwanTravelInfoConfig.validation,
    softValidation: {
      enabled: true,
      warnings: {
        noContactNumber: {
          message: '建議填寫在臺聯絡方式，方便必要時聯繫。',
          severity: 'low' as const,
        },
        shortStay: {
          message: '確認停留天數是否符合入臺證規定。',
          severity: 'low' as const,
        },
      },
    },
  },

  completion: {
    ...taiwanTravelInfoConfig.completion,
    historicalTracking: {
      enabled: true,
      maxSnapshots: 6,
    },
  },
} as const;

export default taiwanComprehensiveTravelInfoConfig;