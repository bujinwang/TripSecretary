import { useCallback, useMemo } from 'react';

/**
 * Custom hook for handling all validation and completion tracking
 * Provides field validation, completion metrics, and form validity checks
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.formState - Form state object from useUSFormState
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Function} params.saveDataToSecureStorageWithOverride - Save function from persistence hook
 * @param {Function} params.debouncedSaveData - Debounced save function
 * @param {Function} params.t - Translation function
 * @returns {Object} Validation functions and completion metrics
 */
export const useUSValidation = ({
  formState,
  userInteractionTracker,
  saveDataToSecureStorageWithOverride,
  debouncedSaveData,
  t,
}) => {

  // ============================================================
  // FIELD VALIDATION
  // ============================================================

  /**
   * Validate a single field
   * @param {string} fieldName - Name of the field to validate
   * @param {any} value - Value to validate
   * @returns {Object} { isValid, isWarning, errorMessage }
   */
  const validateField = useCallback((fieldName, value) => {
    // Empty values are allowed (progressive entry)
    if (!value || value.toString().trim() === '') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    let errorMessage = '';
    let isWarning = false;

    switch (fieldName) {
      // ========== PASSPORT VALIDATION ==========
      case 'passportNo':
        if (!/^[A-Z0-9]{6,12}$/i.test(value.replace(/\s/g, ''))) {
          errorMessage = t?.('us.travelInfo.validation.passportNo', {
            defaultValue: 'Invalid passport number format (6-12 alphanumeric characters)'
          });
          isWarning = true; // Soft validation
        }
        break;

      case 'fullName':
        if (!/^[A-Z\s\-\/]+$/i.test(value)) {
          errorMessage = t?.('us.travelInfo.validation.fullName', {
            defaultValue: 'Name should contain only letters, spaces, hyphens, and slashes'
          });
          isWarning = true;
        }
        break;

      case 'dob':
      case 'expiryDate':
      case 'arrivalDate':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errorMessage = t?.('us.travelInfo.validation.dateFormat', {
            defaultValue: 'Invalid date format (YYYY-MM-DD)'
          });
        }
        // Check if date is valid
        else {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errorMessage = t?.('us.travelInfo.validation.invalidDate', {
              defaultValue: 'Invalid date'
            });
          } else if (fieldName === 'dob') {
            // Date of birth should be in the past
            if (date > new Date()) {
              errorMessage = t?.('us.travelInfo.validation.dobFuture', {
                defaultValue: 'Date of birth cannot be in the future'
              });
            }
          } else if (fieldName === 'expiryDate') {
            // Expiry date should be in the future
            if (date < new Date()) {
              errorMessage = t?.('us.travelInfo.validation.expiryPast', {
                defaultValue: 'Passport has expired'
              });
              isWarning = true; // Warning, not hard error
            }
          } else if (fieldName === 'arrivalDate') {
            // Arrival date should be in the future (or today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) {
              errorMessage = t?.('us.travelInfo.validation.arrivalPast', {
                defaultValue: 'Arrival date should be today or in the future'
              });
              isWarning = true;
            }
          }
        }
        break;

      // ========== PERSONAL INFO VALIDATION ==========
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMessage = t?.('us.travelInfo.validation.email', {
            defaultValue: 'Invalid email format'
          });
        }
        break;

      case 'phoneNumber':
      case 'accommodationPhone':
        const cleanPhone = value.replace(/[^\d+\s\-()]/g, '');
        if (!/^[\+]?[\d\s\-\(\)]{7,}$/.test(cleanPhone)) {
          errorMessage = t?.('us.travelInfo.validation.phone', {
            defaultValue: 'Invalid phone number format'
          });
          isWarning = true;
        }
        break;

      // ========== TRAVEL INFO VALIDATION ==========
      case 'arrivalFlightNumber':
        if (!/^[A-Z0-9\s]{2,10}$/i.test(value)) {
          errorMessage = t?.('us.travelInfo.validation.flightNumber', {
            defaultValue: 'Invalid flight number format (e.g., UA857)'
          });
          isWarning = true;
        }
        break;

      case 'lengthOfStay':
        if (!/^\d+$/.test(value) || parseInt(value) <= 0) {
          errorMessage = t?.('us.travelInfo.validation.lengthOfStay', {
            defaultValue: 'Length of stay must be a positive number'
          });
        }
        break;

      case 'customTravelPurpose':
        if (value.length < 3) {
          errorMessage = t?.('us.travelInfo.validation.customTravelPurpose', {
            defaultValue: 'Please provide a more detailed travel purpose'
          });
          isWarning = true;
        }
        break;
    }

    return {
      isValid: !errorMessage || isWarning,
      isWarning,
      errorMessage,
    };
  }, [t]);

  // ============================================================
  // FIELD BLUR HANDLER
  // ============================================================

  /**
   * Handle field blur - validates and saves
   * @param {string} fieldName - Name of the field
   * @param {any} fieldValue - Value of the field
   */
  const handleFieldBlur = useCallback(async (fieldName, fieldValue) => {
    try {
      // Mark field as user-modified for interaction tracking
      if (userInteractionTracker) {
        userInteractionTracker.markFieldAsModified(fieldName, fieldValue);
      }

      // Track last edited field for UI highlighting
      formState.setLastEditedField(fieldName);

      // Brief highlight animation for last edited field
      setTimeout(() => {
        formState.setLastEditedField(null);
      }, 2000);

      // Validate the field
      const { isValid, isWarning, errorMessage } = validateField(fieldName, fieldValue);

      // Update errors and warnings state
      formState.setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? '' : (isWarning ? '' : errorMessage)
      }));

      formState.setWarnings(prev => ({
        ...prev,
        [fieldName]: isWarning ? errorMessage : ''
      }));

      // Save data if valid (including warnings)
      if (isValid) {
        try {
          // Fields that should save immediately (not debounced)
          const immediateSaveFields = ['dob', 'expiryDate', 'arrivalDate', 'gender', 'isTransitPassenger'];

          if (immediateSaveFields.includes(fieldName)) {
            await saveDataToSecureStorageWithOverride({ [fieldName]: fieldValue });
            formState.setLastEditedAt(new Date());
          } else {
            debouncedSaveData();
          }
        } catch (saveError) {
          console.error('Failed to trigger save:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to validate and save field:', error);
    }
  }, [
    validateField,
    userInteractionTracker,
    formState,
    saveDataToSecureStorageWithOverride,
    debouncedSaveData
  ]);

  // ============================================================
  // USER INTERACTION HANDLER (for fields without blur)
  // ============================================================

  /**
   * Handle user interaction for fields that don't blur
   * @param {string} fieldName - Name of the field
   */
  const handleUserInteraction = useCallback((fieldName) => {
    if (userInteractionTracker) {
      userInteractionTracker.markFieldAsModified(fieldName, formState[fieldName]);
    }
    debouncedSaveData();
  }, [userInteractionTracker, debouncedSaveData, formState]);

  // ============================================================
  // FIELD COUNT AND COMPLETION TRACKING
  // ============================================================

  /**
   * Get field count for a section
   * @param {string} section - Section name ('passport', 'personal', 'travel', 'funds')
   * @returns {Object} { total, filled }
   */
  const getFieldCount = useCallback((section) => {
    const fieldMapping = {
      passport: ['passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'gender'],
      personal: ['occupation', 'cityOfResidence', 'residentCountry', 'phoneCode', 'phoneNumber', 'email'],
      travel: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalDate',
        'lengthOfStay',
        // Conditionally include accommodation fields based on transit status
        ...(formState.isTransitPassenger ? [] : ['accommodationAddress', 'accommodationPhone'])
      ],
      funds: ['funds'],
    };

    const fields = fieldMapping[section] || [];

    const filledCount = fields.filter(field => {
      const value = formState[field];

      // Special handling for custom travel purpose
      if (field === 'travelPurpose' && formState.travelPurpose === 'Other') {
        return formState.customTravelPurpose && formState.customTravelPurpose.trim() !== '';
      }

      // Special handling for funds array
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      // Regular field check
      return value && value !== '';
    }).length;

    return {
      total: fields.length,
      filled: filledCount,
    };
  }, [formState]);

  /**
   * Calculate overall completion metrics
   * @returns {Object} { totalFields, filledFields, percentage, isComplete }
   */
  const calculateCompletionMetrics = useCallback(() => {
    const sections = ['passport', 'personal', 'travel', 'funds'];
    let totalFields = 0;
    let filledFields = 0;

    sections.forEach(section => {
      const { total, filled } = getFieldCount(section);
      totalFields += total;
      filledFields += filled;
    });

    const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    return {
      totalFields,
      filledFields,
      percentage,
      isComplete: percentage === 100,
    };
  }, [getFieldCount]);

  // ============================================================
  // FORM VALIDITY
  // ============================================================

  /**
   * Check if form is valid for submission
   * No hard errors should exist
   */
  const isFormValid = useMemo(() => {
    return Object.keys(formState.errors).length === 0;
  }, [formState.errors]);

  // ============================================================
  // UI HELPER FUNCTIONS
  // ============================================================

  /**
   * Get progress text based on completion percentage
   */
  const getProgressText = useCallback(() => {
    const { percentage, filledFields, totalFields } = calculateCompletionMetrics();

    if (percentage === 100) {
      return t?.('us.travelInfo.progress.complete', {
        defaultValue: 'All information completed!'
      });
    }

    return t?.('us.travelInfo.progress.incomplete', {
      filled: filledFields,
      total: totalFields,
      defaultValue: `Completed ${filledFields}/${totalFields} fields`
    });
  }, [calculateCompletionMetrics, t]);

  /**
   * Get progress color based on completion percentage
   */
  const getProgressColor = useCallback(() => {
    const { percentage } = calculateCompletionMetrics();

    if (percentage >= 100) {
return '#10b981';
} // green-500
    if (percentage >= 75) {
return '#3b82f6';
}  // blue-500
    if (percentage >= 50) {
return '#f59e0b';
}  // amber-500
    if (percentage >= 25) {
return '#f97316';
}  // orange-500
    return '#ef4444';                         // red-500
  }, [calculateCompletionMetrics]);

  /**
   * Get smart button configuration based on form state
   */
  const getSmartButtonConfig = useCallback(() => {
    const { percentage, isComplete } = calculateCompletionMetrics();

    if (isComplete) {
      return {
        label: t?.('us.travelInfo.button.viewEntryGuide', { defaultValue: 'View Entry Guide' }),
        icon: '📖',
        variant: 'primary',
        style: { backgroundColor: '#10b981' }, // green
      };
    }

    if (percentage >= 50) {
      return {
        label: t?.('us.travelInfo.button.continuePreparation', { defaultValue: 'Continue Preparation' }),
        icon: '✈️',
        variant: 'primary',
        style: { backgroundColor: '#3b82f6' }, // blue
      };
    }

    return {
      label: t?.('us.travelInfo.button.startFilling', { defaultValue: 'Start Filling Information' }),
      icon: '📝',
      variant: 'secondary',
      style: {},
    };
  }, [calculateCompletionMetrics, t]);

  // ============================================================
  // RETURN PUBLIC API
  // ============================================================

  return {
    validateField,
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getProgressText,
    getProgressColor,
    getSmartButtonConfig,
  };
};
