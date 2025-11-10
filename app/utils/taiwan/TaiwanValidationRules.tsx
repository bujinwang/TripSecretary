// @ts-nocheck

/**
 * Taiwan Travel Info Validation Rules
 * Centralized validation logic for Taiwan travel information fields
 */

import { findChinaProvince } from '../validation/chinaProvinceValidator';

/**
 * Validate a field based on field-specific rules
 * @param {string} fieldName - Name of the field to validate
 * @param {string} fieldValue - Value to validate
 * @param {Object} context - Additional context (e.g., other field values)
 * @returns {Object} - Validation result {isValid, isWarning, errorMessage}
 */
export const validateField = (fieldName, fieldValue, context = {}) => {
  let isValid = true;
  let errorMessage = '';
  let isWarning = false;

  switch (fieldName) {
    case 'fullName':
      if (fieldValue && fieldValue.trim()) {
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
      if (fieldValue && fieldValue.trim()) {
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

    case 'dob':
    case 'expiryDate':
    case 'arrivalDate':
      if (fieldValue && fieldValue.trim()) {
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
            } else if (fieldName === 'arrivalDate') {
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              if (date < yesterday) {
                isValid = false;
                errorMessage = 'Arrival date should not be in the past';
              }
            }
          }
        }
      } else if (['dob', 'expiryDate', 'arrivalDate'].includes(fieldName)) {
        isWarning = true;
        errorMessage = `${fieldName === 'dob' ? 'Birth date' :
          fieldName === 'expiryDate' ? 'Passport expiry date' : 'Arrival date'} is required`;
      }
      break;

    case 'email':
      if (fieldValue && fieldValue.trim()) {
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
      if (fieldValue && fieldValue.trim()) {
        const cleanPhone = fieldValue.replace(/[^\d+]/g, '');
        if (cleanPhone.length < 7) {
          isValid = false;
          errorMessage = 'Phone number must be at least 7 digits';
        } else if (cleanPhone.length > 15) {
          isValid = false;
          errorMessage = 'Phone number must be no more than 15 digits';
        } else if (!/^[\+]?[\d\s\-()]{7,}$/.test(fieldValue)) {
          isValid = false;
          errorMessage = 'Phone number contains invalid characters';
        }
      } else {
        isWarning = true;
        errorMessage = 'Phone number is required';
      }
      break;

    case 'phoneCode':
      if (fieldValue && fieldValue.trim()) {
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
      if (fieldValue && fieldValue.trim()) {
        if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
          isValid = false;
          errorMessage = 'Please use English letters only';
        } else if (fieldValue.trim().length < 2) {
          isValid = false;
          errorMessage = 'Must be at least 2 characters long';
        }
      } else {
        isWarning = true;
        errorMessage = 'Occupation is required';
      }
      break;

    case 'arrivalFlightNumber':
      if (fieldValue && fieldValue.trim()) {
        if (!/^[A-Z]{2,3}\d{1,4}[A-Z]?$/i.test(fieldValue.trim())) {
          isValid = false;
          errorMessage = 'Flight number format: 2-3 letters + 1-4 digits (e.g., CI123)';
        }
      } else {
        isWarning = true;
        errorMessage = 'Arrival flight number is required';
      }
      break;

    case 'hotelAddress':
      if (fieldValue && fieldValue.trim()) {
        if (fieldValue.trim().length < 10) {
          isValid = false;
          errorMessage = 'Address must be at least 10 characters long';
        }
      } else {
        isWarning = true;
        errorMessage = 'Address is required';
      }
      break;

    case 'stayDuration':
      if (fieldValue && fieldValue.trim()) {
        const duration = parseInt(fieldValue.trim(), 10);
        if (isNaN(duration)) {
          isValid = false;
          errorMessage = 'Must be a valid number';
        } else if (duration < 1) {
          isValid = false;
          errorMessage = 'Stay duration must be at least 1 day';
        } else if (duration > 90) {
          isWarning = true;
          errorMessage = 'Stay duration exceeds typical visa-free period (90 days)';
        }
      } else {
        isWarning = true;
        errorMessage = 'Stay duration is required';
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
};
