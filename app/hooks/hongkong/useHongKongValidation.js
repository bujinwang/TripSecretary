/**
 * useHongKongValidation Hook
 *
 * Manages validation logic for Hong Kong Travel Info Screen
 * Handles field validation, errors, warnings, and completion metrics
 *
 * Reference: useThailandValidation (adapted for Hong Kong)
 */

import { useCallback, useEffect } from 'react';
import { validateField } from '../../utils/thailand/ThailandValidationRules';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import FieldStateManager from '../../utils/FieldStateManager';

/**
 * Custom hook to manage Hong Kong travel form validation
 * @param {Object} params - Hook parameters
 * @param {Object} params.formState - Form state from useHongKongFormState
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Function} params.saveDataToSecureStorageWithOverride - Save function with field overrides
 * @param {Function} params.debouncedSaveData - Debounced save function
 * @returns {Object} Validation functions and state
 */
export const useHongKongValidation = ({
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
          total: passportFieldCount.totalUserModified || Object.keys(passportFields).length
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
          total: personalFieldCount.totalUserModified || Object.keys(personalFields).length
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
          total: travelFieldCount.totalUserModified || Object.keys(travelFields).length
        };
      }

      default:
        return { filled: 0, total: 0 };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInteractionTracker]);

  // Calculate completion metrics
  const calculateCompletionMetrics = useCallback(() => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const totalFilled = passportCount.filled + personalCount.filled + fundsCount.filled + travelCount.filled;
    const totalFields = passportCount.total + personalCount.total + fundsCount.total + travelCount.total;

    const percent = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

    return {
      passport: passportCount,
      personal: personalCount,
      funds: fundsCount,
      travel: travelCount,
      percent,
      isReady: percent >= 100
    };
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
        label: '继续我的香港准备之旅 💪',
        variant: 'secondary',
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '开始准备香港之旅吧！🇭🇰',
        variant: 'outline',
        icon: '🌸',
        action: 'start'
      };
    }
  }, [formState.totalCompletionPercent]);

  // Get progress indicator text
  const getProgressText = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return '准备好迎接香港之旅了！🌴';
    } else if (formState.totalCompletionPercent >= 80) {
      return '快完成了！香港在向你招手 ✨';
    } else if (formState.totalCompletionPercent >= 60) {
      return '进展不错！继续加油 💪';
    } else if (formState.totalCompletionPercent >= 40) {
      return '继续我的香港准备之旅 🏖️';
    } else if (formState.totalCompletionPercent >= 20) {
      return '好的开始！香港欢迎你 🌺';
    } else {
      return '让我们开始准备香港之旅吧！🇭🇰';
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

  // Recalculate completion metrics when data changes
  useEffect(() => {
    if (!formState.isLoading) {
      calculateCompletionMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formState.passportNo, formState.surname, formState.middleName, formState.givenName,
    formState.nationality, formState.dob, formState.expiryDate, formState.sex,
    formState.occupation, formState.cityOfResidence, formState.residentCountry,
    formState.phoneNumber, formState.email, formState.phoneCode,
    formState.funds,
    formState.travelPurpose, formState.customTravelPurpose, formState.arrivalArrivalDate,
    formState.departureDepartureDate, formState.arrivalFlightNumber, formState.departureFlightNumber,
    formState.recentStayCountry, formState.boardingCountry, formState.hotelAddress,
    formState.accommodationType, formState.customAccommodationType, formState.province,
    formState.district, formState.subDistrict, formState.postalCode,
    formState.isTransitPassenger, formState.isLoading,
    // Note: calculateCompletionMetrics intentionally excluded to prevent infinite loop
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

export default useHongKongValidation;
