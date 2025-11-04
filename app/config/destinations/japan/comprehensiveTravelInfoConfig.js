/**
 * Japan Comprehensive Travel Info Configuration
 *
 * Enhanced configuration for JapanTravelInfoScreen with advanced features.
 * V2 Template configuration with smart button, field state filtering, and auto-save.
 */

import { japanTravelInfoConfig } from './travelInfoConfig';

/**
 * Japan V2 Travel Info Configuration
 * 
 * This extends the basic travelInfoConfig with V2 features:
 * - Smart button with dynamic labels
 * - Field state filtering (only save user-modified fields)
 * - Auto-save with debouncing
 * - User interaction tracking
 * - Immediate save for critical fields
 */

export const japanComprehensiveTravelInfoConfig = {
  // Inherit all basic config
  ...japanTravelInfoConfig,

  // Enhanced Metadata
  version: '2.0',
  template: 'enhanced',

  // Smart button configuration (V2 feature)
  submitButton: {
    dynamic: true, // Enable smart button with dynamic labels

    // Thresholds for label changes (0-1 scale)
    thresholds: {
      incomplete: 0.7,   // Below 70% shows "incomplete" label
      almostDone: 0.9,   // 70-90% shows "almostDone" label
      ready: 0.9,        // 90%+ shows "ready" label
    },

    // Labels for each state
    labels: {
      incomplete: '完成必填项 - Complete Required Fields',
      almostDone: '快完成了 - Almost Done',
      ready: '继续 - Continue',
    },

    // Default fallback if dynamic is disabled
    default: '继续 - Continue',
  },

  // Navigation flow
  navigation: {
    previous: 'JapanRequirements',
    next: 'JapanEntryFlow',
    saveBeforeNavigate: true, // Auto-save before navigation
  },

  // Field state management (V2 feature)
  fieldState: {
    enabled: true,
    
    // Track which fields have been modified by user
    trackUserModifications: true,
    
    // Only save fields that user has actually touched
    saveModifiedOnly: true,
    
    // Critical fields that should save immediately
    immediateSaveFields: [
      'surname',
      'givenName', 
      'passportNo',
      'nationality',
      'dob',
      'arrivalFlightNumber',
      'arrivalArrivalDate'
    ],
    
    // Mark fields as touched on first interaction
    markTouchedOnInteraction: true,
  },

  // User interaction tracking (V2 feature)
  userInteraction: {
    enabled: true,
    
    // Prevent data overwrites if user has made manual changes
    preventDataOverwrites: true,
    
    // Show confirmation if trying to overwrite user-modified data
    confirmOverwrites: true,
    
    // Log user interactions for debugging
    logInteractions: __DEV__, // Only in development
  },

  // Enhanced auto-save (V2 feature)
  autoSave: {
    enabled: true,
    debounceDuration: 2000, // 2 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    
    // Save strategies
    strategies: {
      // Save immediately for critical fields
      critical: 'immediate',
      // Save after delay for normal fields
      normal: 'debounced',
      // Save on blur for text inputs
      text: 'onBlur',
    },
    
    // Background save settings
    backgroundSave: {
      enabled: true,
      interval: 30000, // Save every 30 seconds
      conditions: {
        hasUnsavedChanges: true,
        userIsActive: false, // Save even when user is not actively editing
      },
    },
  },

  // Enhanced validation with soft validation (V2 feature)
  validation: {
    ...japanTravelInfoConfig.validation,
    
    softValidation: {
      enabled: true,
      
      // Show warnings without blocking progression
      showWarnings: true,
      
      // Allow progression with warnings
      allowProgressionWithWarnings: true,
      
      // Warning messages
      warnings: {
        lowFunds: {
          message: '建议携带更多资金以确保顺利入境',
          severity: 'medium',
        },
        shortStay: {
          message: '确保停留时间符合签证要求',
          severity: 'low',
        },
        missingContact: {
          message: '建议填写联系方式以便紧急联系',
          severity: 'low',
        },
      },
    },
    
    // Real-time validation
    realTime: {
      enabled: true,
      debounce: 500, // Validate 500ms after user stops typing
    },
  },

  // Enhanced completion tracking
  completion: {
    ...japanTravelInfoConfig.completion,
    
    // Track completion over time
    historicalTracking: {
      enabled: true,
      storeSnapshots: true,
      maxSnapshots: 10,
    },
    
    // Smart completion calculation
    smartCalculation: {
      enabled: true,
      weightFields: {
        // Give more weight to critical fields
        passportNo: 2.0,
        surname: 2.0,
        givenName: 2.0,
        arrivalFlightNumber: 1.5,
        prefecture: 1.5,
      },
    },
  },

  // V2 Features
  v2Features: {
    // Enable all V2 enhancements
    enhancedUI: true,
    smartButton: true,
    fieldStateFiltering: true,
    userInteractionTracking: true,
    immediateSave: true,
    backgroundAutoSave: true,
    softValidation: true,
    realTimeValidation: true,
    historicalTracking: true,
  },

  // Japan-specific enhancements
  japanEnhancements: {
    // Prefecture-specific validation
    prefectureValidation: {
      enabled: true,
      popularDestinations: [
        'Tokyo', 'Osaka', 'Kyoto', 'Kanagawa', 'Aichi',
        'Hokkaido', 'Fukuoka', 'Hyogo', 'Saitama', 'Chiba'
      ],
    },
    
    // Flight validation for Japan routes
    flightValidation: {
      enabled: true,
      commonAirportCodes: ['NRT', 'HND', 'KIX', 'NGO', 'FUK'],
      warnOnInvalidCode: true,
    },
    
    // Currency handling
    currency: {
      displayJPY: true,
      showExchangeRate: false, // Keep simple for now
      formatJPY: true,
    },
  },

  // Deprecated - kept for backward compatibility
  submitButtonLabel: {
    key: 'japan.travelInfo.submitButton',
    default: '继续 - Continue',
  },
};

export default japanComprehensiveTravelInfoConfig;