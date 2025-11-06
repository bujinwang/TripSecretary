/**
 * United States Comprehensive Travel Info Config (Template V2)
 */

import { usaTravelInfoConfig } from './travelInfoConfig';

export const usaComprehensiveTravelInfoConfig = {
  ...usaTravelInfoConfig,

  version: '2.0',
  template: 'enhanced',

  submitButton: {
    dynamic: true,
    thresholds: {
      incomplete: 0.5,
      almostDone: 0.8,
      ready: 0.95,
    },
    labels: {
      incomplete: '继续完善必填项',
      almostDone: '快完成了',
      ready: '继续查看入境准备',
    },
    default: '继续',
  },

  navigation: {
    previous: 'USARequirements',
    next: 'USAEntryFlow',
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
          severity: 'medium',
        },
        evusExpired: {
          message: 'EVUS 状态未标记为有效，建议出发前更新。',
          severity: 'high',
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
};

export default usaComprehensiveTravelInfoConfig;
