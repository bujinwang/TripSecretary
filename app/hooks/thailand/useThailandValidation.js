/**
 * useThailandValidation Hook
 *
 * Manages validation logic for Thailand Travel Info Screen
 * Handles field validation, errors, warnings, and completion metrics
 */

import { useCallback, useEffect } from 'react';
import { validateField } from '../../utils/thailand/ThailandValidationRules';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import FieldStateManager from '../../utils/FieldStateManager';
import performanceMonitor from '../../utils/PerformanceMonitor';

/**
 * Custom hook to manage Thailand travel form validation
 * @param {Object} params - Hook parameters
 * @param {Object} params.formState - Form state from useThailandFormState
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Function} params.saveDataToSecureStorageWithOverride - Save function with field overrides
 * @returns {Object} Validation functions and state
 */
export const useThailandValidation = ({
  formState,
  userInteractionTracker,
  saveDataToSecureStorageWithOverride,
  debouncedSaveData,
}) => {
  // Handle field blur with validation
  const handleFieldBlur = useCallback(async (fieldName, fieldValue) => {
    try {
      // Mark field as user-modified
      userInteractionTracker.markFieldAsModified(fieldName, fieldValue);

      // Track last edited field for session state
      formState.setLastEditedField(fieldName);

      // Brief highlight animation for last edited field
      if (fieldName) {
        if (window.highlightTimeout) {
          clearTimeout(window.highlightTimeout);
        }
        window.highlightTimeout = setTimeout(() => {
          formState.setLastEditedField(null);
        }, 2000);
      }

      // Use centralized validation
      const validationContext = {
        arrivalArrivalDate: formState.arrivalArrivalDate,
        residentCountry: formState.residentCountry,
        travelPurpose: formState.travelPurpose,
        accommodationType: formState.accommodationType,
        isTransitPassenger: formState.isTransitPassenger,
      };

      const { isValid, isWarning, errorMessage } = validateField(fieldName, fieldValue, validationContext);

      // Handle province auto-correction for China
      if (fieldName === 'cityOfResidence' && formState.residentCountry === 'CHN' && fieldValue) {
        const provinceMatch = findChinaProvince(fieldValue.trim());
        if (provinceMatch && provinceMatch.displayName.toUpperCase() !== formState.cityOfResidence) {
          formState.setCityOfResidence(provinceMatch.displayName.toUpperCase());
        }
      }

      // Update errors and warnings state
      formState.setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? '' : (isWarning ? '' : errorMessage)
      }));

      formState.setWarnings(prev => ({
        ...prev,
        [fieldName]: isWarning ? errorMessage : ''
      }));

      // Save data if valid
      if (isValid) {
        try {
          const immediateSaveFields = ['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry'];
          if (immediateSaveFields.includes(fieldName)) {
            await saveDataToSecureStorageWithOverride({ [fieldName]: fieldValue });
            formState.setLastEditedAt(new Date());
          } else {
            debouncedSaveData();
          }
        } catch (saveError) {
          console.error('Failed to save field data:', saveError);
        }
      }
    } catch (error) {
      console.error('Error in handleFieldBlur:', error);
    }
  }, [
    userInteractionTracker,
    formState,
    saveDataToSecureStorageWithOverride,
    debouncedSaveData,
  ]);

  // Handle user interaction with tracking-enabled inputs
  const handleUserInteraction = useCallback((fieldName, value) => {
    // Mark field as user-modified
    userInteractionTracker.markFieldAsModified(fieldName, value);

    // Update the appropriate state based on field name
    switch (fieldName) {
      case 'travelPurpose':
        formState.setTravelPurpose(value);
        if (value !== 'OTHER') {
          formState.setCustomTravelPurpose('');
        }
        break;
      case 'accommodationType':
        formState.setAccommodationType(value);
        if (value !== 'OTHER') {
          formState.setCustomAccommodationType('');
        }
        break;
      case 'boardingCountry':
        formState.setBoardingCountry(value);
        break;
      default:
        console.warn(`Unknown field for user interaction: ${fieldName}`);
    }

    // Trigger debounced save
    debouncedSaveData();
  }, [userInteractionTracker, formState, debouncedSaveData]);

  // Count filled fields for each section
  const getFieldCount = useCallback((section) => {
    // Build interaction state for FieldStateManager
    const interactionState = {};
    const allFieldNames = [
      'passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'sex',
      'phoneCode', 'phoneNumber', 'email', 'occupation', 'cityOfResidence', 'residentCountry',
      'travelPurpose', 'customTravelPurpose', 'boardingCountry', 'recentStayCountry', 'visaNumber',
      'arrivalFlightNumber', 'arrivalArrivalDate', 'departureFlightNumber', 'departureDepartureDate',
      'isTransitPassenger', 'accommodationType', 'customAccommodationType', 'province', 'district',
      'subDistrict', 'postalCode', 'hotelAddress'
    ];

    allFieldNames.forEach(fieldName => {
      interactionState[fieldName] = {
        isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
        lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
        initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
      };
    });

    switch (section) {
      case 'passport': {
        const passportFields = {
          fullName: [formState.surname, formState.middleName, formState.givenName].filter(Boolean).join(', '),
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
          total: Object.keys(passportFields).length  // Always show total number of fields
        };
      }

      case 'personal': {
        const personalFields = {
          occupation: formState.occupation,
          cityOfResidence: formState.cityOfResidence,
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
          total: Object.keys(personalFields).length  // Always show total number of fields
        };
      }

      case 'funds': {
        // For funds, show actual count with minimum requirement of 1
        const fundItemCount = formState.funds.length;
        if (fundItemCount === 0) {
          return { filled: 0, total: 1 };
        } else {
          return { filled: fundItemCount, total: fundItemCount };
        }
      }

      case 'travel': {
        // Build travel fields with proper handling of custom values
        const purposeFilled = formState.travelPurpose === 'OTHER'
          ? (formState.customTravelPurpose && formState.customTravelPurpose.trim() !== '')
          : (formState.travelPurpose && formState.travelPurpose.trim() !== '');

        const accommodationTypeFilled = formState.accommodationType === 'OTHER'
          ? (formState.customAccommodationType && formState.customAccommodationType.trim() !== '')
          : (formState.accommodationType && formState.accommodationType.trim() !== '');

        const travelFields = {
          travelPurpose: purposeFilled ? (formState.travelPurpose === 'OTHER' ? formState.customTravelPurpose : formState.travelPurpose) : '',
          recentStayCountry: formState.recentStayCountry,
          boardingCountry: formState.boardingCountry,
          arrivalFlightNumber: formState.arrivalFlightNumber,
          arrivalArrivalDate: formState.arrivalArrivalDate,
          departureFlightNumber: formState.departureFlightNumber,
          departureDepartureDate: formState.departureDepartureDate
        };

        // Only include accommodation fields if not a transit passenger
        if (!formState.isTransitPassenger) {
          travelFields.accommodationType = accommodationTypeFilled ? (formState.accommodationType === 'OTHER' ? formState.customAccommodationType : formState.accommodationType) : '';
          travelFields.province = formState.province;
          travelFields.hotelAddress = formState.hotelAddress;
        }

        const travelFieldCount = FieldStateManager.getFieldCount(
          travelFields,
          interactionState,
          Object.keys(travelFields)
        );

        return {
          filled: travelFieldCount.totalWithValues,
          total: Object.keys(travelFields).length  // Always show total number of fields
        };
      }

      default:
        return { filled: 0, total: 0 };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInteractionTracker]);

  // Calculate completion metrics with performance monitoring
  const calculateCompletionMetrics = useCallback(() => {
    const operationId = performanceMonitor.startTiming('calculateCompletionMetrics', {
      context: 'Thailand Travel Info',
      type: 'completion_calculation'
    });

    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const totalFilled = passportCount.filled + personalCount.filled + fundsCount.filled + travelCount.filled;
    const totalFields = passportCount.total + personalCount.total + fundsCount.total + travelCount.total;

    const percent = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

    const result = {
      passport: passportCount,
      personal: personalCount,
      funds: fundsCount,
      travel: travelCount,
      percent,
      isReady: percent >= 100
    };

    performanceMonitor.endTiming(operationId, {
      totalFilled,
      totalFields,
      percent,
      sections: 4
    });

    return result;
  }, [getFieldCount]);

  // Check if all fields are filled and valid
  const isFormValid = useCallback(() => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const allFieldsFilled =
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
      fundsCount.filled === fundsCount.total &&
      travelCount.filled === travelCount.total;

    const noErrors = Object.keys(formState.errors).length === 0;

    return allFieldsFilled && noErrors;
  }, [getFieldCount, formState.errors]);

  // Get smart button configuration based on journey progress
  const getSmartButtonConfig = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return {
        label: '准备入境包',
        variant: 'primary',
        icon: '🚀',
        action: 'submit'
      };
    } else if (formState.totalCompletionPercent >= 80) {
      return {
        label: '继续填写，即将完成！✨',
        variant: 'secondary',
        icon: '🌺',
        action: 'edit'
      };
    } else if (formState.totalCompletionPercent >= 40) {
      return {
        label: '继续我的泰国准备之旅 💪',
        variant: 'secondary',
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '开始准备泰国之旅吧！🇹🇭',
        variant: 'outline',
        icon: '🌸',
        action: 'start'
      };
    }
  }, [formState.totalCompletionPercent]);

  // Get progress indicator text
  const getProgressText = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return '准备好迎接泰国之旅了！🌴';
    } else if (formState.totalCompletionPercent >= 80) {
      return '快完成了！泰国在向你招手 ✨';
    } else if (formState.totalCompletionPercent >= 60) {
      return '进展不错！继续加油 💪';
    } else if (formState.totalCompletionPercent >= 40) {
      return '继续我的泰国准备之旅 🏖️';
    } else if (formState.totalCompletionPercent >= 20) {
      return '好的开始！泰国欢迎你 🌺';
    } else {
      return '让我们开始准备泰国之旅吧！🇹🇭';
    }
  }, [formState.totalCompletionPercent]);

  // Get progress color based on completion
  const getProgressColor = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return '#34C759'; // Green
    } else if (formState.totalCompletionPercent >= 50) {
      return '#FF9500'; // Orange
    } else {
      return '#FF3B30'; // Red
    }
  }, [formState.totalCompletionPercent]);

  // Re-validate residence field whenever the selected country changes
  useEffect(() => {
    if (!formState.residentCountry) {
return;
}
    handleFieldBlur('cityOfResidence', formState.cityOfResidence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.residentCountry, formState.cityOfResidence]);

  // Auto-calculate completion metrics when form values change
  // Uses a memoized formValues object to prevent excessive re-renders
  useEffect(() => {
    const effectOperationId = performanceMonitor.startTiming('completionMetrics_autoCalculate', {
      context: 'Thailand Travel Info - Auto Calculation Effect',
      type: 'effect_trigger'
    });

    const debounceTimer = setTimeout(() => {
      const metrics = calculateCompletionMetrics();
      formState.setCompletionMetrics(metrics);
      formState.setTotalCompletionPercent(metrics?.percent || 0);

      performanceMonitor.endTiming(effectOperationId, {
        triggered: true,
        debounced: true
      });
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(debounceTimer);
      performanceMonitor.endTiming(effectOperationId, {
        triggered: true,
        debounced: false,
        cancelled: true
      });
    };
    // Only depend on the memoized formValues object, not individual fields
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Group related fields to reduce dependency list
    formState.passportNo, formState.surname, formState.givenName, formState.nationality,
    formState.dob, formState.expiryDate, formState.sex,
    formState.occupation, formState.cityOfResidence, formState.residentCountry,
    formState.phoneNumber, formState.email,
    formState.funds.length, // Only track funds array length, not contents
    formState.travelPurpose, formState.arrivalArrivalDate, formState.arrivalFlightNumber,
    formState.accommodationType, formState.province, formState.district,
    calculateCompletionMetrics,
  ]);

  return {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  };
};

export default useThailandValidation;
