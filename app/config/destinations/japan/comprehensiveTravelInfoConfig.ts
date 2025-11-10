/**
 * Japan Comprehensive Travel Info Configuration (Template V2)
 *
 * Extends the base travel info config with enhanced template features
 * similar to the Malaysia implementation.
 */

import { japanTravelInfoConfig } from './travelInfoConfig';

export const japanComprehensiveTravelInfoConfig = {
  ...japanTravelInfoConfig,

  version: '2.0' as const,
  template: 'enhanced' as const,

  // Smart submit button behaviour
  navigation: {
    previous: 'JapanRequirements' as const,
    next: 'JapanEntryFlow' as const,
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: {
        incomplete: 0.6,
        almostDone: 0.85,
        ready: 0.95,
      },
      // Labels for each state (using i18n keys)
      labels: {
        incomplete: {
          key: 'jp.travelInfo.buttonLabels.incomplete' as const,
          default: '完成必填项',
        },
        almostDone: {
          key: 'jp.travelInfo.buttonLabels.almostDone' as const,
          default: '快完成了',
        },
        ready: {
          key: 'jp.travelInfo.buttonLabels.ready' as const,
          default: '继续',
        },
      },
      // Default fallback if dynamic is disabled
      default: {
        key: 'jp.travelInfo.continue' as const,
        default: '继续',
      },
      readyAction: {
        type: 'navigate' as const,
        screen: 'JapanEntryFlow' as const,
      },
    },
    // Fallback submit button label
    submitButtonLabel: {
      key: 'jp.travelInfo.continue' as const,
      default: '继续',
    },
  },

  features: {
    ...japanTravelInfoConfig.features,
    autoSave: {
      enabled: true,
      delay: 1000,
      maxRetries: 3,
      retryDelay: 1200,
    },
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,
    softValidation: true,
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
    ],
  },

  userInteraction: {
    enabled: true,
    preventDataOverwrites: true,
    logInteractions: __DEV__,
  },

  autoSave: {
    enabled: true,
    debounceDuration: 1200,
    maxRetries: 3,
  },

  validation: {
    ...japanTravelInfoConfig.validation,
    softValidation: {
      enabled: true,
      warnings: {
        lowFunds: {
          message: '建议携带足够现金或信用卡，以备不时之需。',
          severity: 'medium' as const,
        },
        missingDeparture: {
          message: '建议填写离境航班，方便入境官员了解行程。',
          severity: 'low' as const,
        },
      },
    },
  },

  completion: {
    ...japanTravelInfoConfig.completion,
    historicalTracking: {
      enabled: true,
      maxSnapshots: 8,
    },
  },
} as const;

export default japanComprehensiveTravelInfoConfig;