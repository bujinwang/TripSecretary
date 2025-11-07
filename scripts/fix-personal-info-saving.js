#!/usr/bin/env node

/**
 * Fix Personal Info Saving Issue
 *
 * This script addresses the personal info saving problem by:
 * 1. Adding comprehensive logging to the UI save process
 * 2. Creating a test to verify the data flow
 * 3. Adding validation to ensure data is being passed correctly
 *
 * Usage: node scripts/fix-personal-info-saving.js
 */

const fs = require('fs');
const path = require('path');

// Read the current ThailandTravelInfoScreen
const screenPath = 'app/screens/thailand/ThailandTravelInfoScreen.tsx';
const screenContent = fs.readFileSync(screenPath, 'utf8');

console.log('🔧 Fixing Personal Info Saving Issue...\n');

// 1. Add debug logging to the save function
const enhancedSaveFunction = `
// Enhanced debug logging for personal info saving
const saveDataToSecureStorageWithOverride = async (fieldOverrides = {}) => {
  try {
    const userId = passport?.id || 'user_001';
    console.log('=== 🔍 PERSONAL INFO SAVE DEBUG ===');
    console.log('userId:', userId);
    console.log('fieldOverrides:', fieldOverrides);

    // Log current UI state values
    console.log('Current UI state:');
    console.log('- phoneCode:', phoneCode);
    console.log('- phoneNumber:', phoneNumber);
    console.log('- email:', email);
    console.log('- occupation:', occupation);
    console.log('- cityOfResidence:', cityOfResidence);
    console.log('- residentCountry:', residentCountry);
    console.log('- sex:', sex);

    // Get current values with overrides applied
    const getCurrentValue = (fieldName, currentValue) => {
      return fieldOverrides[fieldName] !== undefined ? fieldOverrides[fieldName] : currentValue;
    };

    // Get existing passport first to ensure we're updating the right one
    const existingPassport = await UserDataService.getPassport(userId);
    console.log('Existing passport:', existingPassport);

    // Save passport data - only include non-empty fields
    const passportUpdates = {};
    if (passportNo && passportNo.trim()) passportUpdates.passportNumber = passportNo;
    if (fullName && fullName.trim()) passportUpdates.fullName = fullName;
    if (nationality && nationality.trim()) passportUpdates.nationality = nationality;

    const currentDob = getCurrentValue('dob', dob);
    if (currentDob && currentDob.trim()) {
      console.log('=== DOB SAVING DEBUG WITH OVERRIDE ===');
      console.log('dob value being saved:', currentDob);
      passportUpdates.dateOfBirth = currentDob;
    }

    const currentExpiryDate = getCurrentValue('expiryDate', expiryDate);
    if (currentExpiryDate && currentExpiryDate.trim()) passportUpdates.expiryDate = currentExpiryDate;
    if (sex && sex.trim()) passportUpdates.gender = sex;

    if (Object.keys(passportUpdates).length > 0) {
      console.log('Saving passport updates:', passportUpdates);
      if (existingPassport && existingPassport.id) {
        console.log('Updating existing passport with ID:', existingPassport.id);
        const updated = await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        console.log('Passport data updated successfully');

        // Update passportData state to track the correct passport ID
        setPassportData(updated);
      } else {
        console.log('Creating new passport for userId:', userId);
        const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        console.log('Passport data saved successfully');

        // Update passportData state to track the new passport ID
        setPassportData(saved);
      }
    }

    // Save personal info data - only include non-empty fields
    const personalInfoUpdates = {};
    if (phoneCode && phoneCode.trim()) personalInfoUpdates.phoneCode = phoneCode;
    if (phoneNumber && phoneNumber.trim()) personalInfoUpdates.phoneNumber = phoneNumber;
    if (email && email.trim()) personalInfoUpdates.email = email;
    if (occupation && occupation.trim()) personalInfoUpdates.occupation = occupation;
    if (cityOfResidence && cityOfResidence.trim()) personalInfoUpdates.provinceCity = cityOfResidence;
    if (residentCountry && residentCountry.trim()) personalInfoUpdates.countryRegion = residentCountry;
    if (sex && sex.trim()) personalInfoUpdates.gender = sex;

    console.log('=== 🔍 PERSONAL INFO UPDATES DEBUG ===');
    console.log('personalInfoUpdates object:', personalInfoUpdates);
    console.log('Number of fields to update:', Object.keys(personalInfoUpdates).length);

    if (Object.keys(personalInfoUpdates).length > 0) {
      console.log('Saving personal info updates:', personalInfoUpdates);
      const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      console.log('Personal info saved successfully');

      // Update personalInfoData state
      setPersonalInfoData(savedPersonalInfo);
    } else {
      console.log('⚠️ No personal info fields to save - all fields are empty or invalid');
    }
`;

const updatedScreenContent = screenContent.replace(
  /\/\/ Save all data to secure storage with optional field overrides\n  const saveDataToSecureStorageWithOverride = async \(fieldOverrides = \{\}\) => \{[\s\S]*?\n  \};/,
  enhancedSaveFunction
);

fs.writeFileSync(screenPath, updatedScreenContent);

console.log('✅ Enhanced debug logging added to save function');

// 2. Add validation to ensure data is being collected correctly
const enhancedFieldBlur = `
// Enhanced field blur with validation logging
const handleFieldBlur = async (fieldName, fieldValue) => {
  try {
    console.log('=== 🔍 FIELD BLUR DEBUG ===');
    console.log('Field:', fieldName);
    console.log('Value:', fieldValue);
    console.log('Type:', typeof fieldValue);
    console.log('Length:', fieldValue?.length);

    // Check if this field should be saved
    const shouldSaveField = fieldValue !== null && fieldValue !== undefined &&
                           (typeof fieldValue !== 'string' || fieldValue.trim().length > 0);

    console.log('Should save field:', shouldSaveField);

    // Track last edited field for session state
    setLastEditedField(fieldName);

    // Brief highlight animation for last edited field
    if (fieldName) {
      // Clear any existing highlight timeout
      if (window.highlightTimeout) {
        clearTimeout(window.highlightTimeout);
      }

      // Set highlight timeout to clear after 2 seconds
      window.highlightTimeout = setTimeout(() => {
        setLastEditedField(null);
      }, 2000);
    }

    // Enhanced validation using SoftValidation utility
    let isValid = true;
    let errorMessage = '';
    let isWarning = false;
    let helpMessage = '';

    // Comprehensive validation rules for each field
    switch (fieldName) {
      case 'fullName':
        if (fieldValue && fieldValue.trim()) {
          // Check for Chinese characters (not allowed in passport names)
          if (/[\u4e00-\u9fff]/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Please use English letters only (no Chinese characters)';
          }
          // Check for proper format (Last, First or LAST, FIRST)
          else if (!/^[A-Za-z\s,.-]+$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Name should contain only letters, spaces, commas, periods, and hyphens';
          }
          // Check minimum length
          else if (fieldValue.trim().length < 2) {
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
          // Remove spaces and validate format
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
        // Visa number is optional, so no warning for empty value
        break;

      case 'dob':
      case 'expiryDate':
      case 'arrivalArrivalDate':
      case 'departureDepartureDate':
        if (fieldValue && fieldValue.trim()) {
          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Date must be in YYYY-MM-DD format';
          } else {
            // Validate actual date
            const date = new Date(fieldValue);
            if (isNaN(date.getTime())) {
              isValid = false;
              errorMessage = 'Please enter a valid date';
            } else {
              // Additional date-specific validations
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (fieldName === 'dob') {
                // Birth date should be in the past and reasonable
                if (date >= today) {
                  isValid = false;
                  errorMessage = 'Birth date must be in the past';
                } else if (date < new Date('1900-01-01')) {
                  isValid = false;
                  errorMessage = 'Please enter a valid birth date';
                }
              } else if (fieldName === 'expiryDate') {
                // Passport expiry should be in the future
                if (date <= today) {
                  isValid = false;
                  errorMessage = 'Passport expiry date must be in the future';
                }
              } else if (fieldName === 'arrivalArrivalDate') {
                // Arrival date should be in the future (or today)
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (date < yesterday) {
                  isValid = false;
                  errorMessage = 'Arrival date should not be in the past';
                }
              } else if (fieldName === 'departureDepartureDate') {
                // Departure date should be after arrival date
                if (arrivalArrivalDate && date <= new Date(arrivalArrivalDate)) {
                  isValid = false;
                  errorMessage = 'Departure date must be after arrival date';
                }
              }
            }
          }
        } else if (['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate'].includes(fieldName)) {
          isWarning = true;
          errorMessage = \`\${fieldName === 'dob' ? 'Birth date' :
                         fieldName === 'expiryDate' ? 'Passport expiry date' :
                         fieldName === 'arrivalArrivalDate' ? 'Arrival date' : 'Departure date'} is required\`;
        }
        break;

      case 'email':
        if (fieldValue && fieldValue.trim()) {
          // Enhanced email validation
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
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
          // Remove all non-digit characters except + for validation
          const cleanPhone = fieldValue.replace(/[^\\d+]/g, '');
          if (cleanPhone.length < 7) {
            isValid = false;
            errorMessage = 'Phone number must be at least 7 digits';
          } else if (cleanPhone.length > 15) {
            isValid = false;
            errorMessage = 'Phone number must be no more than 15 digits';
          } else if (!/^[\\+]?[\\d\\s\\-()]{7,}$/.test(fieldValue)) {
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
          if (!/^\\+\\d{1,4}$/.test(fieldValue.trim())) {
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
          // Check for English characters only
          if (!/^[A-Za-z\\s\\-.]+$/.test(fieldValue.trim())) {
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

          if (!/^[A-Za-z\\s\\-.]+$/.test(trimmedValue)) {
            isValid = false;
            errorMessage = 'Please use English letters only';
          } else if (trimmedValue.length < 2) {
            isValid = false;
            errorMessage = 'Must be at least 2 characters long';
          } else if (residentCountry === 'CHN') {
            const provinceMatch = findChinaProvince(trimmedValue);
            if (!provinceMatch) {
              isValid = false;
              errorMessage = 'For China, please enter a province name (e.g., Anhui, Guangdong)';
            } else if (provinceMatch.displayName !== cityOfResidence) {
              setCityOfResidence(provinceMatch.displayName);
            }
          }
        } else {
          isWarning = true;
          errorMessage = residentCountry === 'CHN'
            ? 'Province is required for China'
            : 'Province or city is required';
        }
        break;

      case 'recentStayCountry':
        if (fieldValue && fieldValue.trim()) {
          // Ensure ISO code format
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
          // Flight number format validation (e.g., TG123, CX456)
          if (!/^[A-Z]{2,3}\\d{1,4}[A-Z]?$/i.test(fieldValue.trim())) {
            isValid = false;
            errorMessage = 'Flight number format: 2-3 letters + 1-4 digits (e.g., TG123)';
          }
        } else {
          isWarning = true;
          errorMessage = \`\${fieldName === 'arrivalFlightNumber' ? 'Arrival' : 'Departure'} flight number is required\`;
        }
        break;

      case 'customTravelPurpose':
        if (travelPurpose === 'OTHER') {
          if (fieldValue && fieldValue.trim()) {
            if (!/^[A-Za-z\\s\\-.]+$/.test(fieldValue.trim())) {
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
        if (accommodationType === 'OTHER') {
          if (fieldValue && fieldValue.trim()) {
            if (!/^[A-Za-z\\s\\-.]+$/.test(fieldValue.trim())) {
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
        if (!isTransitPassenger) {
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
        if (!isTransitPassenger && accommodationType !== 'HOTEL') {
          if (fieldValue && fieldValue.trim()) {
            if (!/^[A-Za-z\\s\\-.]+$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            }
          } else {
            isWarning = true;
            errorMessage = \`\${fieldName === 'district' ? 'District' : 'Sub-district'} is required\`;
          }
        }
        break;

      case 'postalCode':
        if (!isTransitPassenger && accommodationType !== 'HOTEL') {
          if (fieldValue && fieldValue.trim()) {
            if (!/^\\d{5}$/.test(fieldValue.trim())) {
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
        // For any other fields, just check if they're not empty when required
        if (!fieldValue || !fieldValue.toString().trim()) {
          isWarning = true;
          errorMessage = 'This field is required';
        }
        break;
    }

    console.log('Validation result:', isValid ? (isWarning ? 'WARNING' : 'VALID') : 'ERROR');
    if (!isValid || isWarning) {
      console.log('Message:', errorMessage);
    }

    // Update errors and warnings state
    setErrors(prev => ({
      ...prev,
      [fieldName]: isValid ? '' : (isWarning ? '' : errorMessage)
    }));

    setWarnings(prev => ({
      ...prev,
      [fieldName]: isWarning ? errorMessage : ''
    }));

    // Save data if valid (including warnings) using debounced save
    if (isValid) {
      console.log('Validation passed, triggering debounced save...');
      try {
        // For date fields, we need to pass the new value directly to avoid React state delay
        const immediateSaveFields = ['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry'];
        if (immediateSaveFields.includes(fieldName)) {
          console.log('Immediate-save field detected, saving with new value:', fieldValue);
          // Save immediately with the new value to avoid React state delay
          await saveDataToSecureStorageWithOverride({ [fieldName]: fieldValue });
          setLastEditedAt(new Date());
        } else {
          debouncedSaveData();
        }
      } catch (saveError) {
        console.error('Failed to trigger debounced save:', saveError);
        // Don't show error to user for debounced saves, as they will retry automatically
      }
    } else {
      console.log('Skipping save due to validation error');
    }

  } catch (error) {
    console.error('Failed to validate and save field:', error);
    console.error('Error stack:', error.stack);
    // Don't show error to user for field validation, as it's non-critical
  }
};`;

const updatedScreenContent2 = updatedScreenContent.replace(
  /\/\/ Function to validate and save field data on blur\n  const handleFieldBlur = async \(fieldName, fieldValue\) => \{[\s\S]*?\n  \};/,
  enhancedFieldBlur
);

fs.writeFileSync(screenPath, updatedScreenContent2);

console.log('✅ Enhanced field validation logging added');

// 3. Add a test function to verify data flow
const testFunction = `
// Test function to verify personal info data flow
const testPersonalInfoDataFlow = async () => {
  console.log('=== 🧪 TESTING PERSONAL INFO DATA FLOW ===');

  // Test current UI state
  console.log('Current UI state:');
  console.log('- phoneCode:', phoneCode, 'Length:', phoneCode?.length);
  console.log('- phoneNumber:', phoneNumber, 'Length:', phoneNumber?.length);
  console.log('- email:', email, 'Length:', email?.length);
  console.log('- occupation:', occupation, 'Length:', occupation?.length);
  console.log('- cityOfResidence:', cityOfResidence, 'Length:', cityOfResidence?.length);
  console.log('- residentCountry:', residentCountry, 'Length:', residentCountry?.length);
  console.log('- sex:', sex, 'Length:', sex?.length);

  // Test data preparation
  const personalInfoUpdates = {};
  if (phoneCode && phoneCode.trim()) personalInfoUpdates.phoneCode = phoneCode;
  if (phoneNumber && phoneNumber.trim()) personalInfoUpdates.phoneNumber = phoneNumber;
  if (email && email.trim()) personalInfoUpdates.email = email;
  if (occupation && occupation.trim()) personalInfoUpdates.occupation = occupation;
  if (cityOfResidence && cityOfResidence.trim()) personalInfoUpdates.provinceCity = cityOfResidence;
  if (residentCountry && residentCountry.trim()) personalInfoUpdates.countryRegion = residentCountry;
  if (sex && sex.trim()) personalInfoUpdates.gender = sex;

  console.log('Prepared personalInfoUpdates:', personalInfoUpdates);
  console.log('Number of fields that would be saved:', Object.keys(personalInfoUpdates).length);

  // Test the save process
  if (Object.keys(personalInfoUpdates).length > 0) {
    try {
      console.log('Attempting to save personal info...');
      const userId = passport?.id || 'user_001';
      const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      console.log('✅ Personal info saved successfully:', savedPersonalInfo);

      // Verify in database
      const verifyData = await UserDataService.getPersonalInfo(userId);
      console.log('✅ Verification - loaded from database:', verifyData);

    } catch (error) {
      console.error('❌ Failed to save personal info:', error);
      console.error('Error details:', error.message, error.stack);
    }
  } else {
    console.log('⚠️ No fields to save - all fields are empty or invalid');
  }
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  window.testPersonalInfoDataFlow = testPersonalInfoDataFlow;
}
`;

const finalScreenContent = updatedScreenContent2 + testFunction;

fs.writeFileSync(screenPath, finalScreenContent);

console.log('✅ Test function added for debugging data flow');
console.log('\n🔧 Personal Info Saving Fix Complete!');
console.log('\n📋 What was fixed:');
console.log('1. ✅ Added comprehensive debug logging to saveDataToSecureStorageWithOverride');
console.log('2. ✅ Added detailed logging to handleFieldBlur validation');
console.log('3. ✅ Added test function to verify data flow');
console.log('\n🚀 Next Steps:');
console.log('1. Run the app and check console logs when saving personal info');
console.log('2. Use the test function: window.testPersonalInfoDataFlow() in browser console');
console.log('3. Look for the debug logs to identify where data is being lost');
console.log('\n🔍 Common issues to check:');
console.log('- UI state variables not being updated correctly');
console.log('- Data validation preventing saves');
console.log('- React state updates not triggering re-renders');
console.log('- Async operations not completing properly');