import { taiwanTravelInfoConfig } from './travelInfoConfig';

export const taiwanComprehensiveTravelInfoConfig = {
  ...taiwanTravelInfoConfig,

  version: '2.0',
  template: 'enhanced',

  submitButton: {
    dynamic: true,
    thresholds: {
      incomplete: 0.6,
      almostDone: 0.85,
      ready: 0.95,
    },
    labels: {
      incomplete: '繼續補齊必填資訊',
      almostDone: '快完成了，繼續！',
      ready: '前往入境準備',
    },
    default: '繼續',
  },

  navigation: {
    previous: 'TaiwanRequirements',
    next: 'TaiwanEntryFlow',
    saveBeforeNavigate: true,
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
