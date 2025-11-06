/**
 * Hong Kong Comprehensive Travel Info Config (Template V2)
 */

import { hongkongTravelInfoConfig } from './travelInfoConfig';

export const hongkongComprehensiveTravelInfoConfig = {
  ...hongkongTravelInfoConfig,

  version: '2.0',
  template: 'enhanced',

  submitButton: {
    dynamic: true,
    thresholds: {
      incomplete: 0.55,
      almostDone: 0.8,
      ready: 0.95,
    },
    labels: {
      incomplete: '继续完善必填项',
      almostDone: '快完成了',
      ready: '继续前往入境准备',
    },
    default: '继续',
  },

  navigation: {
    previous: 'HongKongRequirements',
    next: 'HongKongEntryFlow',
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
          message: '未填写返程信息，建议准备以备入境官询问。',
          severity: 'medium',
        },
        lowFunds: {
          message: '建议准备足够资金证明，香港海关可能抽查。',
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
