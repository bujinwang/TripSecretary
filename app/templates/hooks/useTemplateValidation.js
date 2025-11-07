/**
 * useTemplateValidation Hook
 *
 * Ported from Thailand's useThailandValidation
 * Manages validation logic for travel info screens.
 * Handles field validation, errors, warnings, and completion metrics.
 *
 * Features:
 * - Config-driven validation rules
 * - Field blur validation
 * - Pattern validation (regex)
 * - Date validation (futureOnly, pastOnly, minMonthsValid)
 * - Format validation (email, phone)
 * - Soft validation (warnings vs errors)
 * - Smart button configuration
 * - Field count calculation
 * - Completion metrics
 */

import { useCallback, useMemo } from 'react';
import TemplateFieldStateManager from '../utils/TemplateFieldStateManager';

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date is in the future
 */
const isFutureDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

/**
 * Validate date is in the past
 */
const isPastDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * Validate date has minimum months of validity
 */
const hasMinMonthsValidity = (dateString, minMonths) => {
  const date = new Date(dateString);
  const now = new Date();
  const monthsDiff = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
  return monthsDiff >= minMonths;
};

/**
 * useTemplateValidation Hook
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.config - Template configuration
 * @param {Object} params.formState - Form state
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Function} params.saveDataToUserDataService - Save function
 * @param {Function} params.debouncedSave - Debounced save function
 * @param {Function} params.t - Translation function (optional)
 * @param {string} params.destinationId - Destination ID for translation keys (optional)
 * @returns {Object} Validation functions and state
 */
export const useTemplateValidation = ({
  config,
  formState,
  userInteractionTracker,
  saveDataToUserDataService,
  debouncedSave,
  t,
  destinationId,
}) => {
  /**
   * Validate a single field based on config rules
   */
  const validateField = useCallback((fieldName, fieldValue, fieldConfig) => {
    if (!fieldConfig) {
return { isValid: true, isWarning: false, errorMessage: '' };
}

    // Required validation
    if (fieldConfig.required && (!fieldValue || fieldValue === '')) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: fieldConfig.validationMessage || 'This field is required'
      };
    }

    // Skip other validations if field is empty and not required
    if (!fieldValue || fieldValue === '') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    // Pattern validation
    if (fieldConfig.pattern && !fieldConfig.pattern.test(fieldValue)) {
      return {
        isValid: false,
        isWarning: fieldConfig.warning || false,
        errorMessage: fieldConfig.validationMessage || 'Invalid format'
      };
    }

    // Email format validation
    if (fieldConfig.format === 'email' && !isValidEmail(fieldValue)) {
      return {
        isValid: false,
        isWarning: fieldConfig.warning || true, // Email usually a warning
        errorMessage: fieldConfig.validationMessage || 'Invalid email format'
      };
    }

    // Date validations
    if (fieldConfig.type === 'date' || fieldConfig.type === 'datetime') {
      // Future only
      if (fieldConfig.futureOnly && !isFutureDate(fieldValue)) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: fieldConfig.validationMessage || 'Date must be in the future'
        };
      }

      // Past only
      if (fieldConfig.pastOnly && !isPastDate(fieldValue)) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: fieldConfig.validationMessage || 'Date must be in the past'
        };
      }

      // Minimum months validity
      if (fieldConfig.minMonthsValid && !hasMinMonthsValidity(fieldValue, fieldConfig.minMonthsValid)) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: fieldConfig.validationMessage || `Must be valid for at least ${fieldConfig.minMonthsValid} months`
        };
      }
    }

    // Max length validation
    if (fieldConfig.maxLength && fieldValue.length > fieldConfig.maxLength) {
      return {
        isValid: false,
        isWarning: true,
        errorMessage: `Maximum ${fieldConfig.maxLength} characters`
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  }, []);

  /**
   * Get field config from template config
   */
  const getFieldConfig = useCallback((fieldName) => {
    if (!config?.sections) {
return null;
}

    for (const sectionKey of Object.keys(config.sections)) {
      const section = config.sections[sectionKey];
      if (!section) {
continue;
}

      if (section.fields && section.fields[fieldName]) {
        return section.fields[fieldName];
      }

      // Handle nested fields (e.g., customOccupation for occupation)
      for (const field of Object.values(section.fields || {})) {
        if (field.customFieldName === fieldName) {
          return { ...field, fieldName: fieldName, required: false };
        }
      }
    }
    return null;
  }, [config?.sections]);

  /**
   * Handle field blur with validation
   */
  const handleFieldBlur = useCallback(async (fieldName, fieldValue) => {
    try {
      // Mark field as user-modified
      if (userInteractionTracker) {
        userInteractionTracker.markFieldAsModified(fieldName, fieldValue);
      }

      // Get field config and validate
      const fieldConfig = getFieldConfig(fieldName);
      if (fieldConfig) {
        const { isValid, isWarning, errorMessage } = validateField(fieldName, fieldValue, fieldConfig);

        // Update errors and warnings state
        formState.setErrors?.(prev => ({
          ...prev,
          [fieldName]: isValid ? '' : (isWarning ? '' : errorMessage)
        }));

        formState.setWarnings?.(prev => ({
          ...prev,
          [fieldName]: isWarning ? errorMessage : ''
        }));

        // Save data if valid
        if (isValid) {
          try {
            // Check if this is an immediate save field
            const immediateSaveFields = config.features?.autoSave?.immediateSaveFields || [];
            if (immediateSaveFields.includes(fieldName) || fieldConfig.immediateSave) {
              await saveDataToUserDataService();
              if (formState.setLastEditedAt) {
                formState.setLastEditedAt(new Date());
              }
            } else {
              debouncedSave();
            }
          } catch (saveError) {
            console.error('[Validation] Failed to save field data:', saveError);
          }
        }
      }
    } catch (error) {
      console.error('[Validation] Error in handleFieldBlur:', error);
    }
  }, [
    userInteractionTracker,
    getFieldConfig,
    validateField,
    config.features,
    saveDataToUserDataService,
    debouncedSave,
    formState
  ]);

  /**
   * Calculate field count for a section
   */
  const getFieldCount = useCallback((sectionKey) => {
    const sectionConfig = config.sections?.[sectionKey];
    if (!sectionConfig) {
return { filled: 0, total: 0 };
}

    // Special handling for funds section
    if (sectionKey === 'funds') {
      const funds = formState.funds || [];
      return { filled: funds.length, total: Math.max(funds.length, sectionConfig.minRequired || 1) };
    }

    // Get all fields (not just required ones) for counting
    const allFields = Object.values(sectionConfig.fields || {})
      .map(f => f.fieldName);
    
    // Also get required fields for tracking-based calculation
    const requiredFields = Object.values(sectionConfig.fields || {})
      .filter(f => f.required)
      .map(f => f.fieldName);

    if (userInteractionTracker && config.tracking?.trackFieldModifications) {
      // Use all fields for counting, but still use tracking logic
      return TemplateFieldStateManager.calculateFieldCompletion(
        formState,
        userInteractionTracker.interactionState,
        allFields
      );
    }

    // Fallback without tracking - count all fields
    const filled = allFields.filter(fieldName => {
      const value = formState[fieldName];
      return value !== null && value !== undefined && value !== '';
    }).length;

    return { filled, total: allFields.length };
  }, [config.sections, config.tracking, formState, userInteractionTracker]);

  /**
   * Calculate overall completion percentage
   */
  const calculateCompletionPercent = useCallback(() => {
    let totalFields = 0;
    let filledFields = 0;

    if (!config?.sections) {
return 0;
}

    Object.keys(config.sections).forEach(sectionKey => {
      const section = config.sections[sectionKey];
      if (section?.enabled) {
        const count = getFieldCount(sectionKey);
        totalFields += count.total;
        filledFields += count.filled;
      }
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }, [config?.sections, getFieldCount]);

  /**
   * Check if form is valid (meets minimum requirements)
   */
  const isFormValid = useCallback(() => {
    const completionPercent = calculateCompletionPercent();
    const minPercent = config.validation?.minCompletionPercent || 70;

    // Check if meets minimum completion
    if (completionPercent < minPercent) {
      return false;
    }

    // Check required sections
    const requiredSections = config.validation?.requiredSections || [];
    for (const sectionKey of requiredSections) {
      const count = getFieldCount(sectionKey);
      if (count.filled < count.total) {
        return false;
      }
    }

    return true;
  }, [calculateCompletionPercent, getFieldCount, config.validation]);

  /**
   * Get smart button configuration
   */
  const getSmartButtonConfig = useCallback(() => {
    const completionPercent = calculateCompletionPercent();
    const buttonConfig = config.navigation?.submitButton;

    if (!buttonConfig?.dynamic) {
      // Static button - use translation key if available
      const defaultConfig = buttonConfig?.default;
      let defaultLabel = 'Continue';
      let defaultLabelKey = null;
      
      // Handle both object format (with key/default) and string format
      if (defaultConfig && typeof defaultConfig === 'object' && defaultConfig.key) {
        defaultLabel = defaultConfig.default || 'Continue';
        defaultLabelKey = defaultConfig.key;
      } else if (typeof defaultConfig === 'string') {
        defaultLabel = defaultConfig;
      } else {
        defaultLabel = config.navigation?.submitButtonLabel?.default || 'Continue';
        defaultLabelKey = config.navigation?.submitButtonLabel?.key;
      }
      
      if (t && defaultLabelKey) {
        return {
          label: t(defaultLabelKey, { defaultValue: defaultLabel }),
          variant: 'primary',
          icon: '→',
        };
      }
      
      return {
        label: defaultLabel,
        variant: 'primary',
        icon: '→',
      };
    }

    // Dynamic button based on completion
    const thresholds = buttonConfig.thresholds || {
      incomplete: 0.7,
      almostDone: 0.9,
      ready: 0.9,
    };

    // Use translation keys if available, otherwise fall back to config labels or defaults
    const getLabel = (key) => {
      const labelConfig = buttonConfig.labels?.[key];
      
      // If label config is an object with key and default, use translation
      if (labelConfig && typeof labelConfig === 'object' && labelConfig.key && t) {
        return t(labelConfig.key, { defaultValue: labelConfig.default || 'Continue' });
      }
      
      // If label config is a string, check if it's a translation key and translate it
      if (labelConfig && typeof labelConfig === 'string') {
        // Check if it looks like a translation key (contains dots)
        if (t && labelConfig.includes('.')) {
          // Try to translate with a sensible default based on the key
          const defaultLabel = key === 'ready' ? 'Continue' : 
                              key === 'almostDone' ? 'Almost Done' : 
                              key === 'incomplete' ? 'Complete Required Fields' : 'Continue';
          const translated = t(labelConfig, { defaultValue: defaultLabel });
          // If translation exists (not the same as the key), use it
          if (translated !== labelConfig && translated !== 'Default') {
            return translated;
          }
          // If translation failed or returned "Default", use the default label
          return defaultLabel;
        }
        // If not a translation key or translation failed, use it as-is
        return labelConfig;
      }
      
      // Try translation key if destinationId and t are available
      if (t && destinationId) {
        // Try the navigation.submitButton path first (matches translation file structure)
        const translationKey = `${destinationId}.navigation.submitButton.${key}`;
        const translated = t(translationKey);
        // If translation exists (not the same as the key), use it
        if (translated !== translationKey) {
          return translated;
        }
        
        // Fallback to travelInfo.buttonLabels path
        const fallbackKey = `${destinationId}.travelInfo.buttonLabels.${key}`;
        const fallbackTranslated = t(fallbackKey);
        if (fallbackTranslated !== fallbackKey) {
          return fallbackTranslated;
        }
      }
      
      // Final fallback to English defaults
      const defaults = {
        incomplete: 'Complete Required Fields',
        almostDone: 'Almost Done',
        ready: 'Continue',
      };
      return defaults[key] || 'Continue';
    };

    const percent = completionPercent / 100;

    if (percent < thresholds.incomplete) {
      return {
        label: getLabel('incomplete'),
        variant: 'secondary',
        icon: '✎',
      };
    } else if (percent < thresholds.ready) {
      return {
        label: getLabel('almostDone'),
        variant: 'primary',
        icon: '⏳',
      };
    } else {
      return {
        label: getLabel('ready'),
        variant: 'primary',
        icon: '✓',
      };
    }
  }, [calculateCompletionPercent, config.navigation, t, destinationId]);

  return {
    // Methods
    validateField,
    handleFieldBlur,
    getFieldCount,
    calculateCompletionPercent,
    isFormValid,
    getSmartButtonConfig,
    getFieldConfig,
  };
};

export default useTemplateValidation;
