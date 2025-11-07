/**
 * TravelInfoFormUtils
 * 
 * Reusable utilities for travel information forms across different destinations.
 * Provides common patterns for user interaction tracking, field management,
 * and destination-specific configurations.
 * 
 * Features:
 * - Destination-agnostic form field management
 * - User interaction tracking integration
 * - Smart defaults and suggestion providers
 * - Completion metrics calculation
 * - Save logic with field filtering
 * - Backward compatibility migration
 */

import { useCallback, useMemo } from 'react';
import { useUserInteractionTracker } from './UserInteractionTracker';
import FieldStateManager from './FieldStateManager';
import SuggestionProviders from './SuggestionProviders';

/**
 * Default field configurations for different destinations
 */
const DESTINATION_CONFIGS = {
  thailand: {
    requiredFields: [
      'fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex',
      'occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email',
      'travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate',
      'departureFlightNumber', 'departureDepartureDate'
    ],
    optionalFields: [
      'phoneCode', 'recentStayCountry', 'visaNumber', 'accommodationType', 
      'province', 'district', 'subDistrict', 'postalCode', 'hotelAddress'
    ],
    fieldWeights: {
      // Passport fields have higher weight
      fullName: 2, nationality: 2, passportNo: 2, dob: 2, expiryDate: 2, sex: 2,
      // Personal info fields
      occupation: 1, cityOfResidence: 1, residentCountry: 1, phoneNumber: 1, email: 1,
      // Travel info fields
      travelPurpose: 2, boardingCountry: 2, arrivalFlightNumber: 2, arrivalArrivalDate: 2,
      departureFlightNumber: 2, departureDepartureDate: 2
    },
    defaultValues: {
      // No hard-coded defaults - all fields start empty
    },
    predefinedOptions: {
      travelPurpose: ['HOLIDAY', 'MEETING', 'SPORTS', 'BUSINESS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL'],
      accommodationType: ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT']
    }
  },
  singapore: {
    requiredFields: [
      'fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex',
      'occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email',
      'travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate',
      'departureFlightNumber', 'departureDepartureDate'
    ],
    optionalFields: [
      'phoneCode', 'visaNumber', 'accommodationType', 
      'province', 'district', 'subDistrict', 'postalCode', 'hotelAddress'
    ],
    fieldWeights: {
      // Similar to Thailand but may have different priorities
      fullName: 2, nationality: 2, passportNo: 2, dob: 2, expiryDate: 2, sex: 2,
      occupation: 1, cityOfResidence: 1, residentCountry: 1, phoneNumber: 1, email: 1,
      travelPurpose: 2, boardingCountry: 2, arrivalFlightNumber: 2, arrivalArrivalDate: 2,
      departureFlightNumber: 2, departureDepartureDate: 2
    },
    defaultValues: {
      // No hard-coded defaults - all fields start empty
    },
    predefinedOptions: {
      travelPurpose: ['HOLIDAY', 'MEETING', 'SPORTS', 'BUSINESS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL'],
      accommodationType: ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT']
    }
  },
  japan: {
    requiredFields: [
      'fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex',
      'occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email',
      'travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate',
      'departureFlightNumber', 'departureDepartureDate'
    ],
    optionalFields: [
      'phoneCode', 'visaNumber', 'accommodationType', 
      'province', 'district', 'subDistrict', 'postalCode', 'hotelAddress'
    ],
    fieldWeights: {
      fullName: 2, nationality: 2, passportNo: 2, dob: 2, expiryDate: 2, sex: 2,
      occupation: 1, cityOfResidence: 1, residentCountry: 1, phoneNumber: 1, email: 1,
      travelPurpose: 2, boardingCountry: 2, arrivalFlightNumber: 2, arrivalArrivalDate: 2,
      departureFlightNumber: 2, departureDepartureDate: 2
    },
    defaultValues: {
      // No hard-coded defaults - all fields start empty
    },
    predefinedOptions: {
      travelPurpose: ['HOLIDAY', 'MEETING', 'SPORTS', 'BUSINESS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL'],
      accommodationType: ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT']
    }
  }
};

/**
 * Custom hook for travel info form management
 * 
 * @param {string} destination - Destination identifier (e.g., 'thailand', 'singapore')
 * @param {Object} options - Configuration options
 * @returns {Object} Form management utilities and state
 */
export const useTravelInfoForm = (destination, options = {}) => {
  const screenId = `${destination}_travel_info`;
  const userInteractionTracker = useUserInteractionTracker(screenId);
  
  // Get destination configuration
  const destinationConfig = DESTINATION_CONFIGS[destination] || DESTINATION_CONFIGS.thailand;
  
  /**
   * Initialize form with existing data and mark as user-modified for backward compatibility
   */
  const initializeWithExistingData = useCallback(async (userData) => {
    if (!userData || !userInteractionTracker.isInitialized) {
      return;
    }

    console.log(`=== MIGRATING EXISTING DATA FOR ${destination.toUpperCase()} ===`);
    
    const existingDataToMigrate = {};

    // Migrate passport data
    if (userData.passport) {
      const passport = userData.passport;
      if (passport.passportNumber) {
existingDataToMigrate.passportNo = passport.passportNumber;
}
      if (passport.fullName) {
existingDataToMigrate.fullName = passport.fullName;
}
      if (passport.nationality) {
existingDataToMigrate.nationality = passport.nationality;
}
      if (passport.dateOfBirth) {
existingDataToMigrate.dob = passport.dateOfBirth;
}
      if (passport.expiryDate) {
existingDataToMigrate.expiryDate = passport.expiryDate;
}
      if (passport.gender) {
existingDataToMigrate.sex = passport.gender;
}
    }

    // Migrate personal info data
    if (userData.personalInfo) {
      const personalInfo = userData.personalInfo;
      if (personalInfo.phoneCode) {
existingDataToMigrate.phoneCode = personalInfo.phoneCode;
}
      if (personalInfo.phoneNumber) {
existingDataToMigrate.phoneNumber = personalInfo.phoneNumber;
}
      if (personalInfo.email) {
existingDataToMigrate.email = personalInfo.email;
}
      if (personalInfo.occupation) {
existingDataToMigrate.occupation = personalInfo.occupation;
}
      if (personalInfo.provinceCity) {
existingDataToMigrate.cityOfResidence = personalInfo.provinceCity;
}
      if (personalInfo.countryRegion) {
existingDataToMigrate.residentCountry = personalInfo.countryRegion;
}
    }

    // Migrate travel info data
    if (userData.travelInfo) {
      const travelInfo = userData.travelInfo;
      if (travelInfo.travelPurpose) {
existingDataToMigrate.travelPurpose = travelInfo.travelPurpose;
}
      if (travelInfo.boardingCountry) {
existingDataToMigrate.boardingCountry = travelInfo.boardingCountry;
}
      if (travelInfo.accommodationType) {
existingDataToMigrate.accommodationType = travelInfo.accommodationType;
}
      if (travelInfo.recentStayCountry) {
existingDataToMigrate.recentStayCountry = travelInfo.recentStayCountry;
}
      if (travelInfo.arrivalFlightNumber) {
existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
}
      if (travelInfo.arrivalArrivalDate) {
existingDataToMigrate.arrivalArrivalDate = travelInfo.arrivalArrivalDate;
}
      if (travelInfo.departureFlightNumber) {
existingDataToMigrate.departureFlightNumber = travelInfo.departureFlightNumber;
}
      if (travelInfo.departureDepartureDate) {
existingDataToMigrate.departureDepartureDate = travelInfo.departureDepartureDate;
}
      if (travelInfo.province) {
existingDataToMigrate.province = travelInfo.province;
}
      if (travelInfo.district) {
existingDataToMigrate.district = travelInfo.district;
}
      if (travelInfo.subDistrict) {
existingDataToMigrate.subDistrict = travelInfo.subDistrict;
}
      if (travelInfo.postalCode) {
existingDataToMigrate.postalCode = travelInfo.postalCode;
}
      if (travelInfo.hotelAddress) {
existingDataToMigrate.hotelAddress = travelInfo.hotelAddress;
}
      if (travelInfo.visaNumber) {
existingDataToMigrate.visaNumber = travelInfo.visaNumber;
}
      if (travelInfo.isTransitPassenger !== undefined) {
existingDataToMigrate.isTransitPassenger = travelInfo.isTransitPassenger;
}
    }

    console.log('Data to migrate:', existingDataToMigrate);
    console.log('Number of fields to migrate:', Object.keys(existingDataToMigrate).length);

    if (Object.keys(existingDataToMigrate).length > 0) {
      userInteractionTracker.initializeWithExistingData(existingDataToMigrate);
      console.log('✅ Migration completed - existing data marked as user-modified');
    } else {
      console.log('⚠️ No existing data found to migrate');
    }
  }, [destination, userInteractionTracker]);

  /**
   * Handle user interaction with form fields
   */
  const handleUserInteraction = useCallback((fieldName, value) => {
    // Mark field as user-modified
    userInteractionTracker.markFieldAsModified(fieldName, value);
    
    console.log(`User interaction tracked for ${fieldName}:`, value);
  }, [userInteractionTracker]);

  /**
   * Get field count for a section using FieldStateManager
   */
  const getFieldCount = useCallback((section, allFields) => {
    // Build interaction state for FieldStateManager
    const interactionState = {};
    const allFieldNames = [
      ...destinationConfig.requiredFields,
      ...destinationConfig.optionalFields
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
          fullName: allFields.fullName || '',
          nationality: allFields.nationality || '',
          passportNo: allFields.passportNo || '',
          dob: allFields.dob || '',
          expiryDate: allFields.expiryDate || '',
          sex: allFields.sex || ''
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
          occupation: allFields.occupation || '',
          cityOfResidence: allFields.cityOfResidence || '',
          residentCountry: allFields.residentCountry || '',
          phoneCode: allFields.phoneCode || '',
          phoneNumber: allFields.phoneNumber || '',
          email: allFields.email || ''
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
        // Funds are not tracked by interaction state, so use existing logic
        const fundItemCount = allFields.funds ? allFields.funds.length : 0;
        if (fundItemCount === 0) {
          return { filled: 0, total: 1 };
        } else {
          return { filled: fundItemCount, total: fundItemCount };
        }
      
      case 'travel':
        // Build travel fields with proper handling of custom values
        const purposeFilled = allFields.travelPurpose === 'OTHER' 
          ? (allFields.customTravelPurpose && allFields.customTravelPurpose.trim() !== '')
          : (allFields.travelPurpose && allFields.travelPurpose.trim() !== '');
        
        const accommodationTypeFilled = allFields.accommodationType === 'OTHER'
          ? (allFields.customAccommodationType && allFields.customAccommodationType.trim() !== '')
          : (allFields.accommodationType && allFields.accommodationType.trim() !== '');

        const travelFields = {
          travelPurpose: purposeFilled ? (allFields.travelPurpose === 'OTHER' ? allFields.customTravelPurpose : allFields.travelPurpose) : '',
          recentStayCountry: allFields.recentStayCountry || '',
          boardingCountry: allFields.boardingCountry || '',
          arrivalFlightNumber: allFields.arrivalFlightNumber || '',
          arrivalArrivalDate: allFields.arrivalArrivalDate || '',
          departureFlightNumber: allFields.departureFlightNumber || '',
          departureDepartureDate: allFields.departureDepartureDate || ''
        };

        // Only include accommodation fields if not a transit passenger
        if (!allFields.isTransitPassenger) {
          travelFields.accommodationType = accommodationTypeFilled ? (allFields.accommodationType === 'OTHER' ? allFields.customAccommodationType : allFields.accommodationType) : '';
          travelFields.province = allFields.province || '';
          travelFields.hotelAddress = allFields.hotelAddress || '';
          
          // Different fields based on accommodation type
          const isHotelType = allFields.accommodationType === 'HOTEL';
          if (!isHotelType) {
            travelFields.district = allFields.district || '';
            travelFields.subDistrict = allFields.subDistrict || '';
            travelFields.postalCode = allFields.postalCode || '';
          }
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

    return { filled: 0, total: 0 };
  }, [userInteractionTracker, destinationConfig]);

  /**
   * Calculate completion metrics using FieldStateManager
   */
  const calculateCompletionMetrics = useCallback((allFields) => {
    try {
      // Build interaction state for FieldStateManager
      const interactionState = {};
      const allFieldNames = [
        ...destinationConfig.requiredFields,
        ...destinationConfig.optionalFields
      ];

      allFieldNames.forEach(fieldName => {
        interactionState[fieldName] = {
          isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
          lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
          initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
        };
      });

      // Build all fields object for FieldStateManager
      const fieldsForCalculation = {
        // Passport fields
        passportNo: allFields.passportNo || '',
        fullName: allFields.fullName || '',
        nationality: allFields.nationality || '',
        dob: allFields.dob || '',
        expiryDate: allFields.expiryDate || '',
        sex: allFields.sex || '',
        // Personal info fields
        phoneCode: allFields.phoneCode || '',
        phoneNumber: allFields.phoneNumber || '',
        email: allFields.email || '',
        occupation: allFields.occupation || '',
        cityOfResidence: allFields.cityOfResidence || '',
        residentCountry: allFields.residentCountry || '',
        // Travel info fields
        travelPurpose: allFields.travelPurpose === 'OTHER' ? allFields.customTravelPurpose : allFields.travelPurpose,
        boardingCountry: allFields.boardingCountry || '',
        recentStayCountry: allFields.recentStayCountry || '',
        visaNumber: allFields.visaNumber || '',
        arrivalFlightNumber: allFields.arrivalFlightNumber || '',
        arrivalArrivalDate: allFields.arrivalArrivalDate || '',
        departureFlightNumber: allFields.departureFlightNumber || '',
        departureDepartureDate: allFields.departureDepartureDate || '',
        isTransitPassenger: allFields.isTransitPassenger || false,
        accommodationType: allFields.accommodationType === 'OTHER' ? allFields.customAccommodationType : allFields.accommodationType,
        province: allFields.province || '',
        district: allFields.district || '',
        subDistrict: allFields.subDistrict || '',
        postalCode: allFields.postalCode || '',
        hotelAddress: allFields.hotelAddress || ''
      };

      // Use FieldStateManager to get completion metrics
      const metrics = FieldStateManager.getCompletionMetrics(fieldsForCalculation, interactionState, destinationConfig);
      
      // Add funds completion (not tracked by interaction state)
      const fundItemCount = allFields.funds ? allFields.funds.length : 0;
      const fundsComplete = fundItemCount > 0;
      
      // Calculate overall completion including funds
      const totalSections = 4; // passport, personal, travel, funds
      const completedSections = [
        metrics.requiredCompletionPercentage >= 80, // passport + personal + travel required fields
        fundsComplete
      ].filter(Boolean).length;
      
      const totalPercent = Math.round((completedSections / totalSections) * 100);

      // Create summary object compatible with existing code
      const summary = {
        totalPercent: totalPercent,
        metrics: {
          passport: {
            completed: metrics.requiredFieldsCompleted,
            total: metrics.requiredFields,
            percentage: metrics.requiredCompletionPercentage
          },
          personal: {
            completed: metrics.requiredFieldsCompleted,
            total: metrics.requiredFields,
            percentage: metrics.requiredCompletionPercentage
          },
          travel: {
            completed: metrics.requiredFieldsCompleted,
            total: metrics.requiredFields,
            percentage: metrics.requiredCompletionPercentage
          },
          funds: {
            completed: fundItemCount,
            total: Math.max(1, fundItemCount),
            percentage: fundsComplete ? 100 : 0
          },
          userModifiedFields: metrics.userModifiedFields
        },
        isReady: totalPercent >= 80
      };

      console.log(`=== COMPLETION METRICS FOR ${destination.toUpperCase()} ===`);
      console.log('User modified fields:', metrics.userModifiedFields);
      console.log('Total completion:', summary.totalPercent + '%');
      console.log('Metrics:', summary.metrics);
      
      return summary;
    } catch (error) {
      console.error('Failed to calculate completion metrics:', error);
      return { totalPercent: 0, metrics: null, isReady: false };
    }
  }, [userInteractionTracker, destinationConfig, destination]);

  /**
   * Filter fields for save operation using FieldStateManager
   */
  const filterFieldsForSave = useCallback((allFields) => {
    // Build interaction state for FieldStateManager
    const interactionState = {};
    const allFieldNames = [
      ...destinationConfig.requiredFields,
      ...destinationConfig.optionalFields
    ];

    allFieldNames.forEach(fieldName => {
      interactionState[fieldName] = {
        isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
        lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
        initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
      };
    });

    return FieldStateManager.filterSaveableFields(allFields, interactionState, {
      preserveExisting: true,
      alwaysSaveFields: ['userId', 'destinationId'] // Always save these critical fields
    });
  }, [userInteractionTracker, destinationConfig]);

  /**
   * Get suggestions for a field
   */
  const getSuggestions = useCallback((fieldName, currentValue, passport) => {
    switch (fieldName) {
      case 'travelPurpose':
        return SuggestionProviders.getTravelPurposeSuggestions();
      case 'accommodationType':
        return SuggestionProviders.getAccommodationTypeSuggestions();
      case 'boardingCountry':
        return SuggestionProviders.getBoardingCountrySuggestions(passport);
      default:
        return [];
    }
  }, []);

  /**
   * Check if a field value is a predefined option
   */
  const isPredefinedOption = useCallback((fieldName, value) => {
    const options = destinationConfig.predefinedOptions[fieldName];
    return options && options.includes(value);
  }, [destinationConfig]);

  return useMemo(() => ({
    // Core tracking functionality
    userInteractionTracker,
    handleUserInteraction,
    initializeWithExistingData,

    // Field management
    getFieldCount,
    calculateCompletionMetrics,
    filterFieldsForSave,
    getSuggestions,
    isPredefinedOption,

    // Configuration
    destinationConfig,

    // State information
    isInitialized: userInteractionTracker.isInitialized
  }), [
    userInteractionTracker,
    handleUserInteraction,
    initializeWithExistingData,
    getFieldCount,
    calculateCompletionMetrics,
    filterFieldsForSave,
    getSuggestions,
    isPredefinedOption,
    destinationConfig
  ]);
};

/**
 * Get destination configuration
 */
export const getDestinationConfig = (destination) => {
  return DESTINATION_CONFIGS[destination] || DESTINATION_CONFIGS.thailand;
};

/**
 * Validate field value based on destination requirements
 */
export const validateFieldValue = (fieldName, value, destination = 'thailand') => {
  const config = getDestinationConfig(destination);
  
  // Basic validation rules that apply to all destinations
  switch (fieldName) {
    case 'fullName':
      if (value && value.trim()) {
        // Check for Chinese characters (not allowed in passport names)
        if (/[\u4e00-\u9fff]/.test(value)) {
          return {
            isValid: false,
            errorMessage: 'Please use English letters only (no Chinese characters)'
          };
        }
        // Check for proper format
        if (!/^[A-Za-z\s,.-]+$/.test(value)) {
          return {
            isValid: false,
            errorMessage: 'Name should contain only letters, spaces, commas, periods, and hyphens'
          };
        }
        // Check minimum length
        if (value.trim().length < 2) {
          return {
            isValid: false,
            errorMessage: 'Name must be at least 2 characters long'
          };
        }
      } else if (config.requiredFields.includes(fieldName)) {
        return {
          isValid: false,
          isWarning: true,
          errorMessage: 'Full name is required'
        };
      }
      break;

    case 'passportNo':
      if (value && value.trim()) {
        // Remove spaces and validate format
        const cleanPassport = value.replace(/\s/g, '');
        if (!/^[A-Z0-9]{6,12}$/i.test(cleanPassport)) {
          return {
            isValid: false,
            errorMessage: 'Passport number must be 6-12 letters and numbers'
          };
        }
      } else if (config.requiredFields.includes(fieldName)) {
        return {
          isValid: false,
          isWarning: true,
          errorMessage: 'Passport number is required'
        };
      }
      break;

    case 'email':
      if (value && value.trim()) {
        // Enhanced email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(value.trim())) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid email address'
          };
        }
      } else if (config.requiredFields.includes(fieldName)) {
        return {
          isValid: false,
          isWarning: true,
          errorMessage: 'Email address is required'
        };
      }
      break;

    // Add more validation rules as needed
  }

  return { isValid: true };
};

export default {
  useTravelInfoForm,
  getDestinationConfig,
  validateFieldValue,
  DESTINATION_CONFIGS
};