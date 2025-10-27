/**
 * Singapore Validation Hook
 *
 * Handles all validation, completion tracking, and field blur logic
 * for Singapore Travel Info Screen.
 *
 * Extracted from SingaporeTravelInfoScreen.js following Thailand pattern.
 *
 * Responsibilities:
 * - Validate individual fields on blur
 * - Track completion metrics (field counts, percentages)
 * - Manage errors and warnings state
 * - Handle user interaction tracking
 */

import { useCallback, useMemo } from 'react';

export const useSingaporeValidation = ({
  formState,
  travelInfoForm,
  debouncedSaveData,
}) => {
  /**
   * Validate a specific field
   */
  const validateField = useCallback((fieldName, value) => {
    const newErrors = { ...formState.errors };
    const newWarnings = { ...formState.warnings };

    // Field-specific validation logic
    switch (fieldName) {
      case 'passportNo':
        if (!value || value.trim() === '') {
          newErrors.passportNo = 'Passport number is required';
        } else if (!/^[A-Z0-9]{5,20}$/i.test(value.replace(/\s/g, ''))) {
          newWarnings.passportNo = 'Please check passport number format';
        } else {
          delete newErrors.passportNo;
          delete newWarnings.passportNo;
        }
        break;

      case 'fullName':
        if (!value || value.trim() === '') {
          newErrors.fullName = 'Full name is required';
        } else {
          delete newErrors.fullName;
        }
        break;

      case 'nationality':
        if (!value || value.trim() === '') {
          newErrors.nationality = 'Nationality is required';
        } else {
          delete newErrors.nationality;
        }
        break;

      case 'dob':
        if (!value || value.trim() === '') {
          newErrors.dob = 'Date of birth is required';
        } else {
          delete newErrors.dob;
        }
        break;

      case 'expiryDate':
        if (!value || value.trim() === '') {
          newErrors.expiryDate = 'Expiry date is required';
        } else {
          // Check if passport is expired
          const expiryDate = new Date(value);
          const today = new Date();
          if (expiryDate < today) {
            newErrors.expiryDate = 'Passport is expired';
          } else {
            delete newErrors.expiryDate;
          }
        }
        break;

      case 'email':
        if (value && value.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newWarnings.email = 'Please check email format';
          } else {
            delete newWarnings.email;
          }
        }
        break;

      case 'phoneNumber':
        if (value && value.trim() !== '') {
          if (!/^[\d\s\-+()]+$/.test(value)) {
            newWarnings.phoneNumber = 'Please check phone number format';
          } else {
            delete newWarnings.phoneNumber;
          }
        }
        break;

      default:
        // No specific validation for other fields
        break;
    }

    formState.setErrors(newErrors);
    formState.setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Handle field blur event
   */
  const handleFieldBlur = useCallback((fieldName, value) => {
    // Validate the field
    validateField(fieldName, value);

    // Track user interaction (if travelInfoForm is available)
    if (travelInfoForm) {
      travelInfoForm.handleUserInteraction(fieldName, value);
    }

    // Highlight last edited field
    formState.setLastEditedField(fieldName);
    setTimeout(() => formState.setLastEditedField(null), 2000);

    // Auto-save
    if (debouncedSaveData) {
      debouncedSaveData();
    }
  }, [validateField, travelInfoForm, formState, debouncedSaveData]);

  /**
   * Handle user interaction for fields that don't blur (e.g., selectors)
   */
  const handleUserInteraction = useCallback((fieldName, value) => {
    if (travelInfoForm) {
      travelInfoForm.handleUserInteraction(fieldName, value);
    }

    if (debouncedSaveData) {
      debouncedSaveData();
    }
  }, [travelInfoForm, debouncedSaveData]);

  /**
   * Get field count for a specific section
   */
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
      funds: formState.funds,
    };

    if (travelInfoForm) {
      return travelInfoForm.getFieldCount(section, allFields);
    }

    // Fallback if travelInfoForm is not available
    const fieldMapping = {
      passport: ['fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex'],
      personal: ['occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email'],
      travel: ['travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate', 'accommodationType', 'hotelAddress'],
      funds: ['funds'],
    };

    const fields = fieldMapping[section] || [];
    const filledCount = fields.filter(field => {
      const value = allFields[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return true;
      return value && value !== '';
    }).length;

    return { total: fields.length, filled: filledCount };
  }, [formState, travelInfoForm]);

  /**
   * Calculate overall completion metrics
   */
  const calculateCompletionMetrics = useCallback(() => {
    try {
      const allFields = {
        // Passport fields
        passportNo: formState.passportNo,
        fullName: formState.fullName,
        nationality: formState.nationality,
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
        funds: formState.funds,
      };

      if (travelInfoForm) {
        return travelInfoForm.calculateCompletionMetrics(allFields);
      }

      // Fallback calculation
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
    } catch (error) {
      console.error('Error calculating completion metrics:', error);
      return {
        totalFields: 0,
        filledFields: 0,
        percentage: 0,
        isComplete: false,
      };
    }
  }, [formState, travelInfoForm, getFieldCount]);

  /**
   * Check if form is valid (no errors)
   */
  const isFormValid = useMemo(() => {
    return Object.keys(formState.errors).length === 0;
  }, [formState.errors]);

  return {
    validateField,
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
  };
};

export default useSingaporeValidation;
