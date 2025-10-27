// useMalaysiaValidation.js
// Handles all validation, completion tracking, and field blur logic for Malaysia Travel Info Screen
import { useCallback, useMemo } from 'react';
import FieldStateManager from '../../utils/FieldStateManager';

/**
 * Custom hook to manage validation for Malaysia Travel Info Screen
 * @param {Object} params - Hook parameters
 * @param {Object} params.formState - Form state from useMalaysiaFormState hook
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Function} params.debouncedSaveData - Debounced save function from persistence hook
 * @returns {Object} Validation functions and state
 */
export const useMalaysiaValidation = ({
  formState,
  userInteractionTracker,
  debouncedSaveData,
}) => {
  /**
   * Validate individual field
   * @param {string} fieldName - Name of the field to validate
   * @param {any} value - Value of the field
   * @returns {boolean} True if field is valid, false otherwise
   */
  const validateField = useCallback((fieldName, value) => {
    const newErrors = { ...formState.errors };
    const newWarnings = { ...formState.warnings };

    // Field-specific validation
    switch (fieldName) {
      case 'fullName':
        if (!value || value.trim() === '') {
          newErrors.fullName = 'Full name is required / Nama penuh diperlukan';
        } else {
          delete newErrors.fullName;
        }
        break;

      case 'passportNo':
        if (!value || value.trim() === '') {
          newErrors.passportNo = 'Passport number is required / Nombor pasport diperlukan';
        } else if (!/^[A-Z0-9]{5,20}$/.test(value)) {
          newWarnings.passportNo = 'Please check passport number format / Sila semak format nombor pasport';
        } else {
          delete newErrors.passportNo;
          delete newWarnings.passportNo;
        }
        break;

      case 'nationality':
        if (!value || value.trim() === '') {
          newErrors.nationality = 'Nationality is required / Kewarganegaraan diperlukan';
        } else {
          delete newErrors.nationality;
        }
        break;

      case 'dob':
        if (!value || value.trim() === '') {
          newErrors.dob = 'Date of birth is required / Tarikh lahir diperlukan';
        } else {
          delete newErrors.dob;
        }
        break;

      case 'expiryDate':
        if (!value || value.trim() === '') {
          newErrors.expiryDate = 'Expiry date is required / Tarikh tamat diperlukan';
        } else {
          const expiryDate = new Date(value);
          const today = new Date();
          if (expiryDate < today) {
            newErrors.expiryDate = 'Passport has expired / Pasport telah tamat tempoh';
          } else {
            delete newErrors.expiryDate;
          }
        }
        break;

      case 'occupation':
        if (!value || value.trim() === '') {
          newErrors.occupation = 'Occupation is required / Pekerjaan diperlukan';
        } else {
          delete newErrors.occupation;
        }
        break;

      case 'phoneNumber':
        if (!value || value.trim() === '') {
          newErrors.phoneNumber = 'Phone number is required / Nombor telefon diperlukan';
        } else if (!/^\d{6,15}$/.test(value.replace(/[\s-]/g, ''))) {
          newWarnings.phoneNumber = 'Please check phone number format / Sila semak format nombor telefon';
        } else {
          delete newErrors.phoneNumber;
          delete newWarnings.phoneNumber;
        }
        break;

      case 'email':
        if (!value || value.trim() === '') {
          newErrors.email = 'Email is required / E-mel diperlukan';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newWarnings.email = 'Please check email format / Sila semak format e-mel';
        } else {
          delete newErrors.email;
          delete newWarnings.email;
        }
        break;

      case 'arrivalFlightNumber':
        if (!value || value.trim() === '') {
          newWarnings.arrivalFlightNumber = 'Flight number recommended / Nombor penerbangan disyorkan';
        } else {
          delete newWarnings.arrivalFlightNumber;
        }
        break;

      case 'arrivalDate':
        if (!value || value.trim() === '') {
          newErrors.arrivalDate = 'Arrival date is required / Tarikh ketibaan diperlukan';
        } else {
          delete newErrors.arrivalDate;
        }
        break;

      case 'hotelAddress':
        if (!value || value.trim() === '') {
          newErrors.hotelAddress = 'Address is required / Alamat diperlukan';
        } else {
          delete newErrors.hotelAddress;
        }
        break;

      case 'stayDuration':
        if (!value || value.trim() === '') {
          newErrors.stayDuration = 'Stay duration is required / Tempoh penginapan diperlukan';
        } else if (!/^\d+$/.test(value)) {
          newWarnings.stayDuration = 'Please enter a number / Sila masukkan nombor';
        } else {
          delete newErrors.stayDuration;
          delete newWarnings.stayDuration;
        }
        break;

      default:
        // No validation for this field
        break;
    }

    formState.setErrors(newErrors);
    formState.setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Handle field blur event
   * @param {string} fieldName - Name of the field
   * @param {any} value - Value of the field
   */
  const handleFieldBlur = useCallback((fieldName, value) => {
    // Validate the field
    validateField(fieldName, value);

    // Track user interaction
    userInteractionTracker.trackFieldEdit(fieldName);

    // Mark last edited field for UI highlighting
    formState.setLastEditedField(fieldName);
    setTimeout(() => formState.setLastEditedField(null), 2000);

    // Auto-save
    debouncedSaveData();
  }, [validateField, userInteractionTracker, formState, debouncedSaveData]);

  /**
   * Handle field change (for fields that don't blur)
   * @param {string} fieldName - Name of the field
   * @param {any} value - Value of the field
   * @param {Function} setter - Setter function for the field
   */
  const handleFieldChange = useCallback((fieldName, value, setter) => {
    setter(value);
    userInteractionTracker.markFieldAsUserModified(fieldName, value);
    formState.setLastEditedField(fieldName);
    formState.setLastEditedAt(new Date().toISOString());

    // Trigger auto-save
    debouncedSaveData();
  }, [userInteractionTracker, formState, debouncedSaveData]);

  /**
   * Handle user interaction (for fields that don't blur or change text)
   * @param {string} fieldName - Name of the field
   */
  const handleUserInteraction = useCallback((fieldName) => {
    userInteractionTracker.trackFieldEdit(fieldName);
    debouncedSaveData();
  }, [userInteractionTracker, debouncedSaveData]);

  /**
   * Get field count for a section using FieldStateManager
   * @param {string} section - Section name (passport, personal, funds, travel)
   * @returns {Object} Object with filled and total counts
   */
  const getFieldCount = useCallback((section) => {
    // Build interaction state for FieldStateManager
    const interactionState = {};
    const allFieldNames = [
      'passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'sex',
      'phoneCode', 'phoneNumber', 'email', 'occupation', 'residentCountry',
      'travelPurpose', 'customTravelPurpose', 'arrivalFlightNumber', 'arrivalDate',
      'accommodationType', 'customAccommodationType', 'hotelAddress', 'stayDuration'
    ];

    allFieldNames.forEach(fieldName => {
      interactionState[fieldName] = {
        isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
        lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
        initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
      };
    });

    switch (section) {
      case 'passport':
        const passportFields = {
          fullName: formState.fullName,
          nationality: formState.nationality,
          passportNo: formState.passportNo,
          dob: formState.dob,
          expiryDate: formState.expiryDate,
          sex: formState.sex
        };

        const passportFieldCount = FieldStateManager.getFieldCount(
          passportFields,
          interactionState,
          Object.keys(passportFields)
        );

        return {
          filled: passportFieldCount.totalWithValues,
          total: passportFieldCount.totalUserModified || Object.keys(passportFields).length
        };

      case 'personal':
        const personalFields = {
          occupation: formState.occupation,
          residentCountry: formState.residentCountry,
          phoneCode: formState.phoneCode,
          phoneNumber: formState.phoneNumber,
          email: formState.email
        };

        const personalFieldCount = FieldStateManager.getFieldCount(
          personalFields,
          interactionState,
          Object.keys(personalFields)
        );

        return {
          filled: personalFieldCount.totalWithValues,
          total: personalFieldCount.totalUserModified || Object.keys(personalFields).length
        };

      case 'funds':
        // For funds, show actual count with minimum requirement of 1
        const fundItemCount = formState.funds.length;
        if (fundItemCount === 0) {
          return { filled: 0, total: 1 };
        } else {
          return { filled: fundItemCount, total: fundItemCount };
        }

      case 'travel':
        // Build travel fields with proper handling of custom values
        const purposeFilled = formState.travelPurpose === 'OTHER'
          ? (formState.customTravelPurpose && formState.customTravelPurpose.trim() !== '')
          : (formState.travelPurpose && formState.travelPurpose.trim() !== '');

        const accommodationTypeFilled = formState.accommodationType === 'OTHER'
          ? (formState.customAccommodationType && formState.customAccommodationType.trim() !== '')
          : (formState.accommodationType && formState.accommodationType.trim() !== '');

        const travelFields = {
          travelPurpose: purposeFilled ? (formState.travelPurpose === 'OTHER' ? formState.customTravelPurpose : formState.travelPurpose) : '',
          arrivalFlightNumber: formState.arrivalFlightNumber,
          arrivalDate: formState.arrivalDate,
          accommodationType: accommodationTypeFilled ? (formState.accommodationType === 'OTHER' ? formState.customAccommodationType : formState.accommodationType) : '',
          hotelAddress: formState.hotelAddress,
          stayDuration: formState.stayDuration
        };

        const travelFieldCount = FieldStateManager.getFieldCount(
          travelFields,
          interactionState,
          Object.keys(travelFields)
        );

        return {
          filled: travelFieldCount.totalWithValues,
          total: travelFieldCount.totalUserModified || Object.keys(travelFields).length
        };
    }

    return { filled: 0, total: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInteractionTracker]);

  /**
   * Calculate completion metrics for all sections
   * @returns {Object} Completion metrics
   */
  const calculateCompletionMetrics = useCallback(() => {
    try {
      const passportCount = getFieldCount('passport');
      const personalCount = getFieldCount('personal');
      const fundsCount = getFieldCount('funds');
      const travelCount = getFieldCount('travel');

      const totalFields = passportCount.total + personalCount.total + fundsCount.total + travelCount.total;
      const filledFields = passportCount.filled + personalCount.filled + fundsCount.filled + travelCount.filled;

      const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

      return {
        passport: passportCount,
        personal: personalCount,
        funds: fundsCount,
        travel: travelCount,
        total: { filled: filledFields, total: totalFields },
        percent: percent
      };
    } catch (error) {
      console.error('Error calculating completion metrics:', error);
      return null;
    }
  }, [getFieldCount]);

  /**
   * Check if form is valid for submission
   */
  const isFormValid = useMemo(() => {
    return Object.keys(formState.errors).length === 0;
  }, [formState.errors]);

  /**
   * Get smart button configuration based on completion
   * @param {number} completionPercent - Completion percentage
   * @returns {Object} Button configuration
   */
  const getSmartButtonConfig = useCallback((completionPercent) => {
    if (completionPercent >= 100) {
      return {
        text: 'Continue to Entry Flow →',
        variant: 'primary',
        disabled: false,
      };
    } else if (completionPercent >= 50) {
      return {
        text: 'Save & Continue Later',
        variant: 'secondary',
        disabled: false,
      };
    } else {
      return {
        text: 'Fill Required Fields First',
        variant: 'secondary',
        disabled: true,
      };
    }
  }, []);

  /**
   * Get progress text based on completion
   * @param {number} percent - Completion percentage
   * @returns {string} Progress text
   */
  const getProgressText = useCallback((percent) => {
    if (percent >= 100) return '✅ 完成!';
    if (percent >= 50) return '进展不错 💪';
    return '继续加油 🌺';
  }, []);

  /**
   * Get progress color based on completion
   * @param {number} percent - Completion percentage
   * @returns {string} Progress color
   */
  const getProgressColor = useCallback((percent) => {
    if (percent >= 100) return '#34C759';
    if (percent >= 50) return '#FF9500';
    return '#007AFF';
  }, []);

  // Return all validation functions
  return {
    validateField,
    handleFieldBlur,
    handleFieldChange,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  };
};
