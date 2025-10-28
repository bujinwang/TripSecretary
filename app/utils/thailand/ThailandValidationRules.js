/**
 * Thailand Travel Info Validation Rules
 * Centralized validation logic for Thailand travel information fields
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

    case 'visaNumber':
      if (fieldValue && fieldValue.trim()) {
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
            } else if (fieldName === 'arrivalArrivalDate') {
              // Arrival date must be at least tomorrow (not today or past)
              if (date <= today) {
                isValid = false;
                errorMessage = 'Arrival date must be tomorrow or later';
              }
            } else if (fieldName === 'departureDepartureDate') {
              if (context.arrivalArrivalDate && date <= new Date(context.arrivalArrivalDate)) {
                isValid = false;
                errorMessage = 'Departure date must be after arrival date';
              }
            }
          }
        }
      } else if (['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate'].includes(fieldName)) {
        isWarning = true;
        errorMessage = `${fieldName === 'dob' ? 'Birth date' :
          fieldName === 'expiryDate' ? 'Passport expiry date' :
            fieldName === 'arrivalArrivalDate' ? 'Arrival date' : 'Departure date'} is required`;
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

    case 'cityOfResidence':
      if (fieldValue && fieldValue.trim()) {
        const trimmedValue = fieldValue.trim();

        if (!/^[A-Za-z\s\-.]+$/.test(trimmedValue)) {
          isValid = false;
          errorMessage = 'Please use English letters only';
        } else if (trimmedValue.length < 2) {
          isValid = false;
          errorMessage = 'Must be at least 2 characters long';
        } else if (context.residentCountry === 'CHN') {
          const provinceMatch = findChinaProvince(trimmedValue);
          if (!provinceMatch) {
            isValid = false;
            errorMessage = 'For China, please enter a province name (e.g., Anhui, Guangdong)';
          }
        }
      } else {
        isWarning = true;
        errorMessage = context.residentCountry === 'CHN'
          ? 'Province is required for China'
          : 'Province or city is required';
      }
      break;

    case 'recentStayCountry':
      if (fieldValue && fieldValue.trim()) {
        if (!/^[A-Za-z]{3}$/.test(fieldValue.trim())) {
          isValid = false;
          errorMessage = 'Please select a valid country or territory';
        }
      } else {
        isWarning = true;
        errorMessage = '过去14天停留国家或地区是必填信息';
      }
      break;

    case 'arrivalFlightNumber':
    case 'departureFlightNumber':
      if (fieldValue && fieldValue.trim()) {
        if (!/^[A-Z]{2,3}\d{1,4}[A-Z]?$/i.test(fieldValue.trim())) {
          isValid = false;
          errorMessage = 'Flight number format: 2-3 letters + 1-4 digits (e.g., TG123)';
        }
      } else {
        isWarning = true;
        errorMessage = `${fieldName === 'arrivalFlightNumber' ? 'Arrival' : 'Departure'} flight number is required`;
      }
      break;

    case 'customTravelPurpose':
      if (context.travelPurpose === 'OTHER') {
        if (fieldValue && fieldValue.trim()) {
          if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
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
      if (context.accommodationType === 'OTHER') {
        if (fieldValue && fieldValue.trim()) {
          if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
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
      if (!context.isTransitPassenger) {
        if (fieldValue && fieldValue.trim()) {
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
      if (!context.isTransitPassenger && context.accommodationType !== 'HOTEL') {
        if (fieldValue && fieldValue.trim()) {
          if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Please use English letters only';
          }
        } else {
          isWarning = true;
          errorMessage = `${fieldName === 'district' ? 'District' : 'Sub-district'} is required`;
        }
      }
      break;

    case 'postalCode':
      if (!context.isTransitPassenger && context.accommodationType !== 'HOTEL') {
        if (fieldValue && fieldValue.trim()) {
          if (!/^\d{5}$/.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Postal code must be 5 digits';
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
};
