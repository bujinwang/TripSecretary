/**
 * useSingaporeValidation Hook
 *
 * Handles all validation, completion tracking, and field blur logic
 * for Singapore Travel Info Screen
 */

import { useCallback, useMemo } from 'react';

/**
 * Custom hook to handle Singapore travel form validation
 * @param {Object} params - Hook parameters
 * @returns {Object} Validation functions and helpers
 */
export const useSingaporeValidation = ({
  formState,
  travelInfoForm,
  saveDataToSecureStorage,
  debouncedSaveData,
}) => {
  // ========== Field Change Handler ==========

  const handleFieldChange = useCallback((fieldName, value, setter) => {
    setter(value);
    travelInfoForm.handleUserInteraction(fieldName, value);
    formState.setLastEditedField(fieldName);
    formState.setLastEditedAt(new Date().toISOString());
    debouncedSaveData();
  }, [formState, travelInfoForm, debouncedSaveData]);

  // ========== Field Validation ==========

  const validateField = useCallback((fieldName, fieldValue) => {
    let isValid = true;
    let errorMessage = '';
    let isWarning = false;

    // Comprehensive validation rules for each field
    switch (fieldName) {
      case 'fullName':
        if (fieldValue?.trim()) {
          if (/[\u4e00-\u9fff]/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Please use English letters only (no Chinese characters)';
          } else if (!/^[A-Za-z\s,.-]+$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Name should contain only letters, spaces, commas, periods, and hyphens';
          } else if (fieldValue.trim().length < 2) {
            isValid = false;
            errorMessage = 'Name must be at least 2 characters long';
          }
        } else {
          isWarning = true;
          errorMessage = 'Full name is required';
        }
        break;

      case 'passportNo':
        if (fieldValue?.trim()) {
          const cleanPassport = fieldValue.replace(/\s/g, '');
          if (!/^[A-Z0-9]{6,12}$/i.test(cleanPassport)) {
            isValid = false;
            errorMessage = 'Passport number must be 6-12 letters and numbers';
          }
        } else {
          isWarning = true;
          errorMessage = 'Passport number is required';
        }
        break;

      case 'visaNumber':
        if (fieldValue?.trim()) {
          if (!/^[A-Za-z0-9]{5,15}$/.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Visa number must be 5-15 letters or numbers';
          }
        }
        break;

      case 'dob':
      case 'expiryDate':
      case 'arrivalArrivalDate':
      case 'departureDepartureDate':
        if (fieldValue?.trim()) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Date must be in YYYY-MM-DD format';
          } else {
            const date = new Date(fieldValue);
            if (isNaN(date.getTime())) {
              isValid = false;
              errorMessage = 'Please enter a valid date';
            } else {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (fieldName === 'dob') {
                if (date >= today) {
                  isValid = false;
                  errorMessage = 'Birth date must be in the past';
                } else if (date < new Date('1900-01-01')) {
                  isValid = false;
                  errorMessage = 'Please enter a valid birth date';
                }
              } else if (fieldName === 'expiryDate') {
                if (date <= today) {
                  isValid = false;
                  errorMessage = 'Passport expiry date must be in the future';
                }
              } else if (fieldName === 'arrivalArrivalDate') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (date < yesterday) {
                  isValid = false;
                  errorMessage = 'Arrival date should not be in the past';
                }
              } else if (fieldName === 'departureDepartureDate') {
                if (formState.arrivalArrivalDate && date <= new Date(formState.arrivalArrivalDate)) {
                  isValid = false;
                  errorMessage = 'Departure date must be after arrival date';
                }
              }
            }
          }
        } else if (['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate'].includes(fieldName)) {
          isWarning = true;
          errorMessage = fieldName === 'dob' ? 'Birth date is required' :
                         fieldName === 'expiryDate' ? 'Passport expiry date is required' :
                         fieldName === 'arrivalArrivalDate' ? 'Arrival date is required' :
                         'Departure date is required';
        }
        break;

      case 'email':
        if (fieldValue?.trim()) {
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          if (!emailRegex.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
        } else {
          isWarning = true;
          errorMessage = 'Email address is required';
        }
        break;

      case 'phoneNumber':
        if (fieldValue?.trim()) {
          const cleanPhone = fieldValue.replace(/[^\d+]/g, '');
          if (cleanPhone.length < 7) {
            isValid = false;
            errorMessage = 'Phone number must be at least 7 digits';
          } else if (cleanPhone.length > 15) {
            isValid = false;
            errorMessage = 'Phone number must be no more than 15 digits';
          } else if (!/^[\+]?[\d\s\-\(\)]{7,}$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Phone number contains invalid characters';
          }
        } else {
          isWarning = true;
          errorMessage = 'Phone number is required';
        }
        break;

      case 'phoneCode':
        if (fieldValue?.trim()) {
          if (!/^\+\d{1,4}$/.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Country code must start with + followed by 1-4 digits';
          }
        } else {
          isWarning = true;
          errorMessage = 'Country code is required';
        }
        break;

      case 'occupation':
      case 'cityOfResidence':
        if (fieldValue?.trim()) {
          if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Please use English letters only';
          } else if (fieldValue.trim().length < 2) {
            isValid = false;
            errorMessage = 'Must be at least 2 characters long';
          }
        } else {
          isWarning = true;
          errorMessage = fieldName === 'occupation' ? 'Occupation is required' : 'City of residence is required';
        }
        break;

      case 'arrivalFlightNumber':
      case 'departureFlightNumber':
        if (fieldValue?.trim()) {
          if (!/^[A-Z]{2,3}\d{1,4}[A-Z]?$/i.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Flight number format: 2-3 letters + 1-4 digits (e.g., SQ123)';
          }
        } else {
          isWarning = true;
          errorMessage = `${fieldName === 'arrivalFlightNumber' ? 'Arrival' : 'Departure'} flight number is required`;
        }
        break;

      case 'customTravelPurpose':
        if (formState.travelPurpose === 'OTHER') {
          if (fieldValue?.trim()) {
            if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            } else if (fieldValue.trim().length < 3) {
              isValid = false;
              errorMessage = 'Travel purpose must be at least 3 characters';
            }
          } else {
            isWarning = true;
            errorMessage = 'Please specify your travel purpose';
          }
        }
        break;

      case 'customAccommodationType':
        if (formState.accommodationType === 'OTHER') {
          if (fieldValue?.trim()) {
            if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            } else if (fieldValue.trim().length < 3) {
              isValid = false;
              errorMessage = 'Accommodation type must be at least 3 characters';
            }
          } else {
            isWarning = true;
            errorMessage = 'Please specify your accommodation type';
          }
        }
        break;

      case 'hotelAddress':
        if (!formState.isTransitPassenger) {
          if (fieldValue?.trim()) {
            if (fieldValue.trim().length < 10) {
              isValid = false;
              errorMessage = 'Address must be at least 10 characters long';
            }
          } else {
            isWarning = true;
            errorMessage = 'Address is required';
          }
        }
        break;

      case 'district':
      case 'subDistrict':
        if (!formState.isTransitPassenger && formState.accommodationType !== 'HOTEL') {
          if (fieldValue?.trim()) {
            if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            }
          } else {
            isWarning = true;
            errorMessage = fieldName === 'district' ? 'District is required' : 'Sub-district is required';
          }
        }
        break;

      case 'postalCode':
        if (!formState.isTransitPassenger && formState.accommodationType !== 'HOTEL') {
          if (fieldValue?.trim()) {
            if (!/^\d{6}$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Postal code must be 6 digits';
            }
          } else {
            isWarning = true;
            errorMessage = 'Postal code is required';
          }
        }
        break;

      default:
        if (!fieldValue || !fieldValue.toString().trim()) {
          isWarning = true;
          errorMessage = 'This field is required';
        }
        break;
    }

    return { isValid, isWarning, errorMessage };
  }, [formState.travelPurpose, formState.accommodationType, formState.isTransitPassenger, formState.arrivalArrivalDate]);

  // ========== Field Blur Handler ==========

  const handleFieldBlur = useCallback(async (fieldName, fieldValue) => {
    try {
      console.log('=== HANDLE FIELD BLUR (SINGAPORE) ===');
      console.log('Field:', fieldName);
      console.log('Value:', fieldValue);

      // Mark field as user-modified for interaction tracking
      travelInfoForm.handleUserInteraction(fieldName, fieldValue);

      // Track last edited field for session state
      formState.setLastEditedField(fieldName);

      // Brief highlight animation for last edited field
      if (fieldName) {
        if (typeof window !== 'undefined' && window.highlightTimeout) {
          clearTimeout(window.highlightTimeout);
        }

        if (typeof window !== 'undefined') {
          window.highlightTimeout = setTimeout(() => {
            formState.setLastEditedField(null);
          }, 2000);
        }
      }

      // Validate field
      const { isValid, isWarning, errorMessage } = validateField(fieldName, fieldValue);

      console.log('Validation result:', isValid ? (isWarning ? 'WARNING' : 'VALID') : 'ERROR');
      if (!isValid || isWarning) {
        console.log('Message:', errorMessage);
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

      // Save data if valid (including warnings)
      if (isValid) {
        console.log('Validation passed, triggering save...');
        try {
          // For date fields, save immediately to avoid React state delay
          if (['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate'].includes(fieldName)) {
            console.log('Date field detected, saving immediately with new value:', fieldValue);
            await saveDataToSecureStorage({ [fieldName]: fieldValue });
            formState.setLastEditedAt(new Date());
          } else {
            debouncedSaveData();
          }
        } catch (saveError) {
          console.error('Failed to trigger save:', saveError);
        }
      } else {
        console.log('Skipping save due to validation error');
      }
    } catch (error) {
      console.error('Failed to validate and save field:', error);
    }
  }, [formState, travelInfoForm, validateField, saveDataToSecureStorage, debouncedSaveData]);

  // ========== User Interaction Handler ==========

  const handleUserInteraction = useCallback((fieldName, value) => {
    // Use the travel info form utility to handle user interaction
    travelInfoForm.handleUserInteraction(fieldName, value);

    formState.setLastEditedField(fieldName);
    formState.setLastEditedAt(new Date().toISOString());

    // Trigger debounced save
    debouncedSaveData();
  }, [travelInfoForm, debouncedSaveData, formState]);

  // ========== Field Count Calculation ==========

  const getFieldCount = useCallback((section) => {
    const allFields = {
      // Passport fields
      fullName: formState.fullName,
      nationality: formState.nationality,
      passportNo: formState.passportNo,
      dob: formState.dob,
      expiryDate: formState.expiryDate,
      sex: formState.sex,
      // Personal fields
      occupation: formState.occupation,
      cityOfResidence: formState.cityOfResidence,
      residentCountry: formState.residentCountry,
      phoneCode: formState.phoneCode,
      phoneNumber: formState.phoneNumber,
      email: formState.email,
      // Travel fields
      travelPurpose: formState.travelPurpose,
      customTravelPurpose: formState.customTravelPurpose,
      boardingCountry: formState.boardingCountry,
      arrivalFlightNumber: formState.arrivalFlightNumber,
      arrivalArrivalDate: formState.arrivalArrivalDate,
      departureFlightNumber: formState.departureFlightNumber,
      departureDepartureDate: formState.departureDepartureDate,
      isTransitPassenger: formState.isTransitPassenger,
      accommodationType: formState.accommodationType,
      customAccommodationType: formState.customAccommodationType,
      province: formState.province,
      district: formState.district,
      subDistrict: formState.subDistrict,
      postalCode: formState.postalCode,
      hotelAddress: formState.hotelAddress,
      // Funds
      funds: formState.funds
    };

    return travelInfoForm.getFieldCount(section, allFields);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelInfoForm]);

  // ========== Completion Metrics ==========

  const calculateCompletionMetrics = useCallback(() => {
    try {
      const allFields = {
        passportNo: formState.passportNo,
        fullName: formState.fullName,
        nationality: formState.nationality,
        dob: formState.dob,
        expiryDate: formState.expiryDate,
        sex: formState.sex,
        occupation: formState.occupation,
        cityOfResidence: formState.cityOfResidence,
        residentCountry: formState.residentCountry,
        phoneCode: formState.phoneCode,
        phoneNumber: formState.phoneNumber,
        email: formState.email,
        travelPurpose: formState.travelPurpose,
        customTravelPurpose: formState.customTravelPurpose,
        boardingCountry: formState.boardingCountry,
        arrivalFlightNumber: formState.arrivalFlightNumber,
        arrivalArrivalDate: formState.arrivalArrivalDate,
        departureFlightNumber: formState.departureFlightNumber,
        departureDepartureDate: formState.departureDepartureDate,
        isTransitPassenger: formState.isTransitPassenger,
        accommodationType: formState.accommodationType,
        customAccommodationType: formState.customAccommodationType,
        province: formState.province,
        district: formState.district,
        subDistrict: formState.subDistrict,
        postalCode: formState.postalCode,
        hotelAddress: formState.hotelAddress,
        funds: formState.funds
      };

      return travelInfoForm.calculateCompletionMetrics(allFields);
    } catch (error) {
      console.error('Failed to calculate completion metrics:', error);
      return { totalPercent: 0, metrics: null, isReady: false };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelInfoForm]);

  // ========== Form Validity Check ==========

  const isFormValid = useMemo(() => {
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

  // ========== Smart Button Configuration ==========

  const getSmartButtonConfig = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return {
        label: '开始新加坡之旅！🌴',
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
        label: '继续我的新加坡准备之旅 💪',
        variant: 'secondary',
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '开始准备新加坡之旅吧！🇸🇬',
        variant: 'outline',
        icon: '🌸',
        action: 'start'
      };
    }
  }, [formState.totalCompletionPercent]);

  // ========== Progress Text ==========

  const getProgressText = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return '准备好迎接新加坡之旅了！🌴';
    } else if (formState.totalCompletionPercent >= 80) {
      return '快完成了！新加坡在向你招手 ✨';
    } else if (formState.totalCompletionPercent >= 60) {
      return '进展不错！继续加油 💪';
    } else if (formState.totalCompletionPercent >= 40) {
      return '已经完成一半了！🏖️';
    } else if (formState.totalCompletionPercent >= 20) {
      return '好的开始！新加坡欢迎你 🌺';
    } else {
      return '让我们开始准备新加坡之旅吧！🇸🇬';
    }
  }, [formState.totalCompletionPercent]);

  // ========== Progress Color ==========

  const getProgressColor = useCallback(() => {
    if (formState.totalCompletionPercent >= 100) {
      return '#34C759'; // Green
    } else if (formState.totalCompletionPercent >= 50) {
      return '#FF9500'; // Orange
    } else {
      return '#FF3B30'; // Red
    }
  }, [formState.totalCompletionPercent]);

  return {
    // Validation
    handleFieldChange,
    validateField,
    handleFieldBlur,
    handleUserInteraction,

    // Field counts and completion
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,

    // UI helpers
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  };
};

export default useSingaporeValidation;
