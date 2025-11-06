import { taiwanTravelInfoConfig } from './travelInfoConfig';

export const taiwanComprehensiveTravelInfoConfig = {
  ...taiwanTravelInfoConfig,

  version: '2.0',
  template: 'enhanced',

  navigation: {
    previous: 'TaiwanRequirements',
    next: 'TaiwanEntryFlow',
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
        incomplete: 'tw.travelInfo.buttonLabels.incomplete',
        almostDone: 'tw.travelInfo.buttonLabels.almostDone',
        ready: 'tw.travelInfo.buttonLabels.ready',
      },
      default: 'tw.travelInfo.continue',
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
          severity: 'low',
        },
        shortStay: {
          message: '確認停留天數是否符合入臺證規定。',
          severity: 'low',
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
};

export default taiwanComprehensiveTravelInfoConfig;
