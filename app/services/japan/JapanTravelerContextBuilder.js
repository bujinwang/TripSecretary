/**
 * Japan Traveler Context Builder Service
 * Builds complete traveler payload for Japan manual entry guide from PassportDataService data
 * Formats data specifically for Japan's manual arrival card completion
 */
import JapanFormHelper from '../../utils/japan/JapanFormHelper';

class JapanTravelerContextBuilder {
  /**
   * Build complete Japan traveler context from user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete traveler payload or validation errors
   */
  static async buildContext(userId) {
    try {
      console.log('=== JAPAN TRAVELER CONTEXT BUILDER ===');
      console.log('Building context for userId:', userId);

      // Import PassportDataService dynamically to avoid circular dependencies
      const PassportDataService = require('../data/PassportDataService').default;

      // Retrieve all user data for Japan destination
      const userData = await PassportDataService.getAllUserData(userId);
      
      // Get Japan-specific travel info
      const japanTravelInfo = await PassportDataService.getTravelInfo(userId, 'japan');
      if (japanTravelInfo) {
        userData.travelInfo = japanTravelInfo;
      }

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

      // Transform user data to Japan format
      const japanData = this.transformToJapanFormat(userData);
      console.log('Transformed to Japan format:', {
        hasPassportNo: !!japanData.passportNo,
        hasFullName: !!japanData.fullName,
        hasArrivalDate: !!japanData.arrivalDate,
        hasAccommodationAddress: !!japanData.accommodationAddress
      });

      // Final validation of the complete payload
      const payloadValidation = this.validateJapanPayload(japanData);
      if (!payloadValidation.isValid) {
        console.log('Japan payload validation failed:', payloadValidation.errors);
        return {
          success: false,
          errors: payloadValidation.errors,
          payload: japanData
        };
      }

      console.log('Japan traveler context built successfully');
      return {
        success: true,
        errors: [],
        payload: japanData
      };

    } catch (error) {
      console.error('Failed to build Japan traveler context:', error);
      return {
        success: false,
        errors: [`Failed to build traveler context: ${error.message}`],
        payload: null
      };
    }
  }

  /**
   * Validate that user data contains required information for Japan
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

    // Check travel info (Japan-specific requirements)
    if (!userData.travelInfo) {
      errors.push('Travel information is required');
    } else {
      if (!userData.travelInfo.arrivalDate) {
        errors.push('Arrival date is required');
      }
      if (!userData.travelInfo.arrivalFlightNumber) {
        errors.push('Arrival flight number is required');
      }
      if (!userData.travelInfo.accommodationAddress) {
        errors.push('Accommodation address is required');
      }
      if (!userData.travelInfo.accommodationPhone) {
        errors.push('Accommodation phone is required');
      }
      if (!userData.travelInfo.lengthOfStay) {
        errors.push('Length of stay is required');
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
   * Transform user data to Japan manual entry format
   * @param {Object} userData - User data from PassportDataService
   * @returns {Object} - Japan-formatted data
   */
  static transformToJapanFormat(userData) {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    // Parse full name into components
    const nameInfo = this.parseFullName(passport?.fullName || '');

    // Transform to Japan manual entry format
    const japanData = {
      // Passport Information
      passportNo: passport?.passportNumber || '',
      fullName: passport?.fullName || '',
      familyName: nameInfo.familyName,
      givenName: nameInfo.givenName,
      nationality: passport?.nationality || '',
      dateOfBirth: passport?.dateOfBirth || '',
      expiryDate: passport?.expiryDate || '',
      gender: passport?.gender || '',
      
      // Personal Information
      occupation: personalInfo?.occupation || '',
      cityOfResidence: personalInfo?.provinceCity || personalInfo?.countryRegion || '',
      residentCountry: personalInfo?.countryRegion || this.getCountryFromNationality(passport?.nationality),
      phoneCode: this.extractPhoneCode(personalInfo?.phoneNumber),
      phoneNumber: this.extractPhoneNumber(personalInfo?.phoneNumber),
      email: personalInfo?.email || '',
      
      // Travel Information (Japan-specific)
      travelPurpose: JapanFormHelper.normalizeTravelPurpose(travelInfo?.travelPurpose),
      customTravelPurpose: travelInfo?.customTravelPurpose || '',
      arrivalFlightNumber: travelInfo?.arrivalFlightNumber || '',
      arrivalDate: this.formatDateForJapan(travelInfo?.arrivalDate),
      lengthOfStay: travelInfo?.lengthOfStay || '',
      
      // Accommodation Information (Japan format)
      accommodationAddress: travelInfo?.accommodationAddress || '',
      accommodationPhone: travelInfo?.accommodationPhone || '',
      
      // Fund Information
      fundItems: fundItems || [],
      totalFunds: this.calculateTotalFunds(fundItems),
      
      // Metadata
      destination: 'japan',
      entryType: 'manual_guide',
      generatedAt: new Date().toISOString()
    };

    return japanData;
  }

  /**
   * Parse full name into family and given name components
   * @param {string} fullName - Full name string
   * @returns {Object} - Name components
   */
  static parseFullName(fullName) {
    if (!fullName) {
      return { familyName: '', givenName: '' };
    }

    // Try comma-separated format first (e.g., "YAMADA, TARO")
    if (fullName.includes(',')) {
      const parts = fullName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        return {
          familyName: parts[0],
          givenName: parts[1]
        };
      }
    }

    // Try space-separated format (e.g., "YAMADA TARO")
    const spaceParts = fullName.trim().split(/\s+/);
    if (spaceParts.length >= 2) {
      return {
        familyName: spaceParts[0],
        givenName: spaceParts.slice(1).join(' ')
      };
    }

    // Single name - treat as given name
    return {
      familyName: '',
      givenName: fullName
    };
  }

  /**
   * Get country code from nationality
   * @param {string} nationality - Nationality code
   * @returns {string} - Country code
   */
  static getCountryFromNationality(nationality) {
    // Map common nationality codes to country codes
    const nationalityMap = {
      'CHN': 'China',
      'USA': 'United States',
      'GBR': 'United Kingdom',
      'JPN': 'Japan',
      'KOR': 'South Korea',
      'SGP': 'Singapore',
      'MYS': 'Malaysia',
      'HKG': 'Hong Kong',
      'MAC': 'Macau',
      'TWN': 'Taiwan'
    };

    return nationalityMap[nationality] || nationality || 'China';
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
    } else if (cleaned.startsWith('+81') || cleaned.startsWith('81')) {
      return '81'; // Japan
    } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
      return '852'; // Hong Kong
    } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
      return '1'; // US/Canada
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
    } else if (cleaned.startsWith('+81') || cleaned.startsWith('81')) {
      return cleaned.replace(/^\+?81/, '');
    } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
      return cleaned.replace(/^\+?852/, '');
    } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
      return cleaned.replace(/^\+?1/, '');
    } else if (cleaned.startsWith('+')) {
      // Remove any country code (1-3 digits after +)
      return cleaned.replace(/^\+\d{1,3}/, '');
    }

    return cleaned;
  }

  /**
   * Format date for Japan entry (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {string} - Formatted date
   */
  static formatDateForJapan(dateStr) {
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
   * Calculate total funds from fund items
   * @param {Array} fundItems - Array of fund items
   * @returns {Object} - Total funds by currency
   */
  static calculateTotalFunds(fundItems) {
    if (!fundItems || !Array.isArray(fundItems)) {
      return {};
    }

    const totals = {};
    
    fundItems.forEach(item => {
      if (item.amount && item.currency) {
        if (!totals[item.currency]) {
          totals[item.currency] = 0;
        }
        totals[item.currency] += parseFloat(item.amount);
      }
    });

    return totals;
  }

  /**
   * Validate complete Japan payload
   * @param {Object} payload - Japan payload
   * @returns {Object} - Validation result
   */
  static validateJapanPayload(payload) {
    const errors = [];

    // Required fields for Japan manual entry
    const requiredFields = [
      'passportNo',
      'fullName',
      'nationality',
      'dateOfBirth',
      'occupation',
      'email',
      'arrivalDate',
      'arrivalFlightNumber',
      'accommodationAddress',
      'accommodationPhone',
      'lengthOfStay'
    ];

    requiredFields.forEach(field => {
      if (!payload[field] || payload[field].toString().trim().length === 0) {
        errors.push(`Japan field '${field}' is required but missing`);
      }
    });

    // Validate date formats
    if (payload.arrivalDate && !this.isValidDate(payload.arrivalDate)) {
      errors.push('Invalid arrival date format');
    }

    if (payload.dateOfBirth && !this.isValidDate(payload.dateOfBirth)) {
      errors.push('Invalid birth date format');
    }

    // Validate email format
    if (payload.email && !this.isValidEmail(payload.email)) {
      errors.push('Invalid email format');
    }

    // Validate length of stay (must be positive number)
    if (payload.lengthOfStay) {
      const days = parseInt(payload.lengthOfStay);
      if (isNaN(days) || days <= 0) {
        errors.push('Length of stay must be a positive number');
      }
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
  static async buildJapanTravelerContext(userId) {
    return await this.buildContext(userId);
  }
}

export default JapanTravelerContextBuilder;
