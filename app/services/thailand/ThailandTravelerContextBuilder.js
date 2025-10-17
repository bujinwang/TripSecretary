/**
 * Thailand Traveler Context Builder Service
 * Builds complete traveler payload for TDAC submission from PassportDataService data
 * Merges user data with TDAC defaults and validates completeness
 */

// Import will be done dynamically to avoid module resolution issues

class ThailandTravelerContextBuilder {
  /**
   * Build complete Thailand traveler context from user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete traveler payload or validation errors
   */
  static async buildContext(userId) {
    try {
      console.log('=== THAILAND TRAVELER CONTEXT BUILDER ===');
      console.log('Building context for userId:', userId);

      // Import PassportDataService dynamically to avoid circular dependencies
      const PassportDataService = require('../data/PassportDataService').default;

      // Retrieve all user data in a single operation for efficiency
      const userData = await PassportDataService.getAllUserData(userId);
      console.log('Retrieved user data:', {
        hasPassport: !!userData.passport,
        hasPersonalInfo: !!userData.personalInfo,
        hasTravelInfo: !!userData.travelInfo,
        fundItemsCount: userData.fundItems?.length || 0
      });

      // Validate that we have the required data
      const validationResult = this.validateUserData(userData);
      if (!validationResult.isValid) {
        console.log('User data validation failed:', validationResult.errors);
        return {
          success: false,
          errors: validationResult.errors,
          payload: null
        };
      }

      // Transform user data to TDAC format
      const tdacData = this.transformToTDACFormat(userData);
      console.log('Transformed to TDAC format:', {
        hasPassportNo: !!tdacData.passportNo,
        hasFullName: !!tdacData.familyName && !!tdacData.firstName,
        hasArrivalDate: !!tdacData.arrivalDate,
        hasEmail: !!tdacData.email
      });

      // Merge with TDAC defaults to fill any missing fields
      const { mergeTDACData } = require('../../data/mockTDACData');
      const travelerPayload = mergeTDACData(tdacData);
      console.log('Merged with TDAC defaults');

      // Final validation of the complete payload
      const payloadValidation = this.validateTDACPayload(travelerPayload);
      if (!payloadValidation.isValid) {
        console.log('TDAC payload validation failed:', payloadValidation.errors);
        return {
          success: false,
          errors: payloadValidation.errors,
          payload: travelerPayload
        };
      }

      console.log('Thailand traveler context built successfully');
      return {
        success: true,
        errors: [],
        payload: travelerPayload
      };

    } catch (error) {
      console.error('Failed to build Thailand traveler context:', error);
      return {
        success: false,
        errors: [`Failed to build traveler context: ${error.message}`],
        payload: null
      };
    }
  }

  /**
   * Validate that user data contains required information
   * @param {Object} userData - User data from PassportDataService
   * @returns {Object} - Validation result
   */
  static validateUserData(userData) {
    const errors = [];

    // Check passport data
    if (!userData.passport) {
      errors.push('Passport data is required');
    } else {
      if (!userData.passport.passportNumber) {
        errors.push('Passport number is required');
      }
      if (!userData.passport.fullName) {
        errors.push('Full name is required');
      }
      if (!userData.passport.nationality) {
        errors.push('Nationality is required');
      }
      if (!userData.passport.dateOfBirth) {
        errors.push('Date of birth is required');
      }
    }

    // Check personal info
    if (!userData.personalInfo) {
      errors.push('Personal information is required');
    } else {
      if (!userData.personalInfo.email) {
        errors.push('Email is required');
      }
      if (!userData.personalInfo.phoneNumber) {
        errors.push('Phone number is required');
      }
      if (!userData.personalInfo.occupation) {
        errors.push('Occupation is required');
      }
    }

    // Check travel info
    if (!userData.travelInfo) {
      errors.push('Travel information is required');
    } else {
      if (!userData.travelInfo.arrivalArrivalDate) {
        errors.push('Arrival date is required');
      }
      if (!userData.travelInfo.arrivalFlightNumber) {
        errors.push('Arrival flight number is required');
      }
      if (!userData.travelInfo.hotelName) {
        errors.push('Hotel name is required');
      }
      if (!userData.travelInfo.hotelAddress) {
        errors.push('Hotel address is required');
      }
    }

    // Check fund items
    if (!userData.fundItems || userData.fundItems.length === 0) {
      errors.push('At least one fund item is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform user data to TDAC format
   * @param {Object} userData - User data from PassportDataService
   * @returns {Object} - TDAC-formatted data
   */
  static transformToTDACFormat(userData) {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    // Parse full name into family and first name
    const nameInfo = this.parseFullName(passport?.fullName || '');

    // Transform passport data
    const tdacData = {
      // Personal Information In Passport
      familyName: nameInfo.familyName,
      firstName: nameInfo.firstName,
      middleName: nameInfo.middleName || '',
      passportNo: passport?.passportNumber || '',
      nationality: passport?.nationality || '',
      
      // Personal Information
      birthDate: passport?.dateOfBirth || '',
      occupation: personalInfo?.occupation || '',
      gender: this.transformGender(passport?.gender),
      countryResidence: this.getCountryFromNationality(passport?.nationality),
      cityResidence: personalInfo?.provinceCity || personalInfo?.countryRegion || '',
      phoneCode: this.extractPhoneCode(personalInfo?.phoneNumber),
      phoneNo: this.extractPhoneNumber(personalInfo?.phoneNumber),
      
      // Contact
      email: personalInfo?.email || '',
      
      // Trip Information
      arrivalDate: this.formatDateForTDAC(travelInfo?.arrivalArrivalDate),
      departureDate: this.formatDateForTDAC(travelInfo?.departureArrivalDate),
      countryBoarded: this.getCountryFromAirport(travelInfo?.arrivalDepartureAirport),
      purpose: travelInfo?.travelPurpose || 'HOLIDAY',
      travelMode: 'AIR',
      flightNo: travelInfo?.arrivalFlightNumber || '',
      
      // Accommodation
      accommodationType: travelInfo?.accommodationType || 'HOTEL',
      province: travelInfo?.province || '',
      district: travelInfo?.district || '',
      subDistrict: travelInfo?.subDistrict || '',
      postCode: travelInfo?.postalCode || '',
      address: travelInfo?.hotelAddress || '',
      
      // Visa (optional)
      visaNo: travelInfo?.visaNumber || ''
    };

    return tdacData;
  }

  /**
   * Parse full name into components
   * @param {string} fullName - Full name string
   * @returns {Object} - Name components
   */
  static parseFullName(fullName) {
    if (!fullName) {
      return { familyName: '', firstName: '', middleName: '' };
    }

    // Try comma-separated format first (e.g., "ZHANG, WEI MING")
    if (fullName.includes(',')) {
      const parts = fullName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        const givenNames = parts[1].split(' ').filter(name => name.length > 0);
        return {
          familyName: parts[0],
          firstName: givenNames[0] || '',
          middleName: givenNames.slice(1).join(' ')
        };
      }
    }

    // Try space-separated format (e.g., "ZHANG WEI MING")
    const spaceParts = fullName.trim().split(/\s+/);
    if (spaceParts.length >= 2) {
      return {
        familyName: spaceParts[0],
        firstName: spaceParts[1] || '',
        middleName: spaceParts.slice(2).join(' ')
      };
    }

    // Single name - treat as first name
    return {
      familyName: '',
      firstName: fullName,
      middleName: ''
    };
  }

  /**
   * Transform gender to TDAC format
   * @param {string} gender - Gender from passport
   * @returns {string} - TDAC gender format
   */
  static transformGender(gender) {
    if (!gender) return 'MALE'; // Default fallback
    
    switch (gender.toLowerCase()) {
      case 'male':
      case 'm':
        return 'MALE';
      case 'female':
      case 'f':
        return 'FEMALE';
      default:
        return 'MALE'; // Default fallback
    }
  }

  /**
   * Get country code from nationality
   * @param {string} nationality - Nationality code
   * @returns {string} - Country code
   */
  static getCountryFromNationality(nationality) {
    // Map common nationality codes to country codes
    const nationalityMap = {
      'CHN': 'CHN',
      'USA': 'USA',
      'GBR': 'GBR',
      'JPN': 'JPN',
      'KOR': 'KOR',
      'SGP': 'SGP',
      'MYS': 'MYS',
      'HKG': 'HKG',
      'MAC': 'MAC',
      'TWN': 'TWN'
    };

    return nationalityMap[nationality] || nationality || 'CHN';
  }

  /**
   * Extract phone code from phone number
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone code
   */
  static extractPhoneCode(phoneNumber) {
    if (!phoneNumber) return '86'; // Default to China

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Extract country code
    if (cleaned.startsWith('+86') || cleaned.startsWith('86')) {
      return '86';
    } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
      return '852';
    } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
      return '853';
    } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
      return '1';
    } else if (cleaned.startsWith('+')) {
      // Extract first 1-3 digits after +
      const match = cleaned.match(/^\+(\d{1,3})/);
      return match ? match[1] : '86';
    }

    return '86'; // Default fallback
  }

  /**
   * Extract phone number without country code
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone number without country code
   */
  static extractPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';

    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove country codes
    if (cleaned.startsWith('+86') || cleaned.startsWith('86')) {
      return cleaned.replace(/^\+?86/, '');
    } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
      return cleaned.replace(/^\+?852/, '');
    } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
      return cleaned.replace(/^\+?853/, '');
    } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
      return cleaned.replace(/^\+?1/, '');
    } else if (cleaned.startsWith('+')) {
      // Remove any country code (1-3 digits after +)
      return cleaned.replace(/^\+\d{1,3}/, '');
    }

    return cleaned;
  }

  /**
   * Get country from airport code
   * @param {string} airportCode - Airport code
   * @returns {string} - Country code
   */
  static getCountryFromAirport(airportCode) {
    if (!airportCode) return 'CHN';

    // Map common airport codes to countries
    const airportMap = {
      'PEK': 'CHN', 'PVG': 'CHN', 'CAN': 'CHN', 'SZX': 'CHN',
      'HKG': 'HKG', 'MFM': 'MAC', 'TPE': 'TWN',
      'NRT': 'JPN', 'KIX': 'JPN', 'ICN': 'KOR',
      'SIN': 'SGP', 'KUL': 'MYS',
      'LAX': 'USA', 'JFK': 'USA', 'LHR': 'GBR'
    };

    return airportMap[airportCode] || 'CHN';
  }

  /**
   * Format date for TDAC (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {string} - Formatted date
   */
  static formatDateForTDAC(dateStr) {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';

      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      console.error('Failed to format date:', error);
      return '';
    }
  }

  /**
   * Validate complete TDAC payload
   * @param {Object} payload - TDAC payload
   * @returns {Object} - Validation result
   */
  static validateTDACPayload(payload) {
    const errors = [];

    // Required fields for TDAC submission
    const requiredFields = [
      'familyName', 'firstName', 'passportNo', 'nationality',
      'birthDate', 'occupation', 'gender', 'email',
      'arrivalDate', 'flightNo', 'address'
    ];

    requiredFields.forEach(field => {
      if (!payload[field] || payload[field].toString().trim().length === 0) {
        errors.push(`TDAC field '${field}' is required but missing`);
      }
    });

    // Validate date formats
    if (payload.arrivalDate && !this.isValidDate(payload.arrivalDate)) {
      errors.push('Invalid arrival date format');
    }

    if (payload.departureDate && !this.isValidDate(payload.departureDate)) {
      errors.push('Invalid departure date format');
    }

    if (payload.birthDate && !this.isValidDate(payload.birthDate)) {
      errors.push('Invalid birth date format');
    }

    // Validate email format
    if (payload.email && !this.isValidEmail(payload.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {boolean} - Is valid date
   */
  static isValidDate(dateStr) {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} - Is valid email
   */
  static isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get traveler context with error handling and fallbacks
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Traveler context with success/error status
   */
  static async buildThailandTravelerContext(userId) {
    return await this.buildContext(userId);
  }
}

export default ThailandTravelerContextBuilder;