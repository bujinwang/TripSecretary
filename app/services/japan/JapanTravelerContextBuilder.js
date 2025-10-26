/**
 * Japan Traveler Context Builder Service
 * Builds complete traveler payload for Japan manual entry guide from UserDataService data
 * Formats data specifically for Japan's manual arrival card completion
 */
import JapanFormHelper from '../../utils/japan/JapanFormHelper';

class JapanTravelerContextBuilder {
  // Constants
  static DEFAULT_COUNTRY_CODE = '86'; // China
  static DEFAULT_COUNTRY = 'China';

  static NATIONALITY_MAP = {
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

  static COUNTRY_CODES = {
    CHINA: '86',
    JAPAN: '81',
    HONG_KONG: '852',
    US_CANADA: '1'
  };

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Build complete Japan traveler context from user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete traveler payload or validation errors
   */
  static async buildContext(userId) {
    try {
      console.log('=== JAPAN TRAVELER CONTEXT BUILDER ===');
      console.log('Building context for userId:', userId);

      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;

      // Retrieve all user data for Japan destination
      const userData = await UserDataService.getAllUserData(userId);
      
      // Get Japan-specific travel info
      const japanTravelInfo = await UserDataService.getTravelInfo(userId, 'japan');
      const fallbackTravelInfo = await UserDataService.getTravelInfo(userId).catch(() => null);

      let travelInfoSource = {};
      if (fallbackTravelInfo) {
        travelInfoSource = { ...fallbackTravelInfo };
      }
      if (japanTravelInfo) {
        travelInfoSource = { ...travelInfoSource, ...japanTravelInfo };
      }
      userData.travelInfo = travelInfoSource;

      // Normalize travel info so legacy keys map into the Japan schema
      userData.travelInfo = this.normalizeTravelInfo(userData.travelInfo || {});

      // Load shared fund items (reused across destinations)
      try {
        const fundItems = await UserDataService.getFundItems(userId);
        userData.fundItems = Array.isArray(fundItems) ? fundItems : [];
      } catch (fundError) {
        console.warn('Unable to load shared fund items:', fundError.message);
        userData.fundItems = [];
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

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validate that user data contains required information for Japan
   * @param {Object} userData - User data from UserDataService
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
      const normalizedTravelInfo = this.normalizeTravelInfo(userData.travelInfo);
      if (!normalizedTravelInfo.arrivalDate) {
        errors.push('Arrival date is required');
      }
      if (!normalizedTravelInfo.arrivalFlightNumber) {
        errors.push('Arrival flight number is required');
      }
      if (!normalizedTravelInfo.accommodationAddress) {
        errors.push('Accommodation address is required');
      }
      if (!normalizedTravelInfo.accommodationPhone) {
        errors.push('Accommodation phone is required');
      }
      if (!normalizedTravelInfo.lengthOfStay) {
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
   * Validate complete Japan payload
   * @param {Object} payload - Japan payload
   * @returns {Object} - Validation result
   */
  static validateJapanPayload(payload) {
    const errors = [];
    const normalizedPayload = {
      ...payload,
      ...this.normalizeTravelInfo(payload),
    };

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
      const value = normalizedPayload[field];
      if (!value || value.toString().trim().length === 0) {
        errors.push(`Japan field '${field}' is required but missing`);
      }
    });

    // Validate date formats
    if (normalizedPayload.arrivalDate && !this.isValidDate(normalizedPayload.arrivalDate)) {
      errors.push('Invalid arrival date format');
    }

    if (normalizedPayload.dateOfBirth && !this.isValidDate(normalizedPayload.dateOfBirth)) {
      errors.push('Invalid birth date format');
    }

    // Validate email format
    if (normalizedPayload.email && !this.isValidEmail(normalizedPayload.email)) {
      errors.push('Invalid email format');
    }

    // Validate length of stay (must be positive number)
    if (normalizedPayload.lengthOfStay) {
      const days = parseInt(normalizedPayload.lengthOfStay);
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

  // ============================================================================
  // Data Transformation Methods
  // ============================================================================

  /**
   * Transform user data to Japan manual entry format
   * @param {Object} userData - User data from UserDataService
   * @returns {Object} - Japan-formatted data
   */
  static transformToJapanFormat(userData) {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    // Parse full name into components
    const nameInfo = this.parseFullName(passport?.fullName || '');
    const normalizedTravelInfo = this.normalizeTravelInfo(travelInfo || {});

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
      travelPurpose: JapanFormHelper.normalizeTravelPurpose(normalizedTravelInfo.travelPurpose),
      customTravelPurpose: normalizedTravelInfo.customTravelPurpose || '',
      arrivalFlightNumber: normalizedTravelInfo.arrivalFlightNumber || '',
      arrivalDate: this.formatDateForJapan(normalizedTravelInfo.arrivalDate),
      lengthOfStay: normalizedTravelInfo.lengthOfStay || '',
      
      // Accommodation Information (Japan format)
      accommodationAddress: normalizedTravelInfo.accommodationAddress || '',
      accommodationPhone: normalizedTravelInfo.accommodationPhone || '',
      
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

  // ============================================================================
  // Helper Methods - Name Parsing
  // ============================================================================

  /**
   * Normalize travel info fields collected from different destinations or legacy schemas.
   * Ensures consistent keys for Japan manual guide.
   * @param {Object} travelInfo
   * @returns {Object}
   */
  static normalizeTravelInfo(travelInfo = {}) {
    if (!travelInfo || typeof travelInfo !== 'object') {
      return {};
    }

    const arrivalDate =
      travelInfo.arrivalDate ||
      travelInfo.arrivalArrivalDate ||
      travelInfo.arrival_date ||
      travelInfo.entryDate ||
      null;

    const arrivalFlightNumber =
      travelInfo.arrivalFlightNumber ||
      travelInfo.arrivalFlightNo ||
      travelInfo.flightNumber ||
      travelInfo.flightNo ||
      null;

    const lengthOfStay =
      travelInfo.lengthOfStay ||
      travelInfo.stayDuration ||
      travelInfo.durationOfStay ||
      travelInfo.daysOfStay ||
      null;

    const accommodationAddress =
      travelInfo.accommodationAddress ||
      travelInfo.hotelAddress ||
      travelInfo.address ||
      travelInfo.destinationAddress ||
      null;

    const accommodationPhone =
      travelInfo.accommodationPhone ||
      travelInfo.contactPhone ||
      travelInfo.hotelPhone ||
      travelInfo.phoneNumber ||
      null;

    return {
      ...travelInfo,
      arrivalDate,
      arrivalFlightNumber,
      lengthOfStay,
      accommodationAddress,
      accommodationPhone,
    };
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

  // ============================================================================
  // Helper Methods - Country & Nationality
  // ============================================================================

  /**
   * Get country code from nationality
   * @param {string} nationality - Nationality code
   * @returns {string} - Country code
   */
  static getCountryFromNationality(nationality) {
    return this.NATIONALITY_MAP[nationality] || nationality || this.DEFAULT_COUNTRY;
  }

  // ============================================================================
  // Helper Methods - Phone Number Processing
  // ============================================================================

  /**
   * Clean phone number by removing all non-digit characters except +
   * @param {string} phoneNumber - Phone number to clean
   * @returns {string} - Cleaned phone number
   */
  static cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  /**
   * Parse country code from cleaned phone number
   * @param {string} cleaned - Cleaned phone number
   * @returns {string|null} - Country code or null
   */
  static parseCountryCode(cleaned) {
    const codePrefixes = [
      { prefix: ['+86', '86'], code: this.COUNTRY_CODES.CHINA },
      { prefix: ['+81', '81'], code: this.COUNTRY_CODES.JAPAN },
      { prefix: ['+852', '852'], code: this.COUNTRY_CODES.HONG_KONG },
      { prefix: ['+1', '1'], code: this.COUNTRY_CODES.US_CANADA }
    ];

    for (const { prefix, code } of codePrefixes) {
      if (prefix.some(p => cleaned.startsWith(p))) {
        return code;
      }
    }

    // Try to extract generic country code after +
    if (cleaned.startsWith('+')) {
      const match = cleaned.match(/^\+(\d{1,3})/);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Extract phone code from phone number
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone code
   */
  static extractPhoneCode(phoneNumber) {
    if (!phoneNumber) return this.DEFAULT_COUNTRY_CODE;

    const cleaned = this.cleanPhoneNumber(phoneNumber);
    const code = this.parseCountryCode(cleaned);

    return code || this.DEFAULT_COUNTRY_CODE;
  }

  /**
   * Extract phone number without country code
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone number without country code
   */
  static extractPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';

    const cleaned = this.cleanPhoneNumber(phoneNumber);

    // Define patterns for country code removal
    const patterns = [
      /^\+?86/,    // China
      /^\+?81/,    // Japan
      /^\+?852/,   // Hong Kong
      /^\+?1/,     // US/Canada
      /^\+\d{1,3}/ // Generic country code
    ];

    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        return cleaned.replace(pattern, '');
      }
    }

    return cleaned;
  }

  // ============================================================================
  // Helper Methods - Date & Time Formatting
  // ============================================================================

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

  // ============================================================================
  // Helper Methods - Fund Calculations
  // ============================================================================

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
}

export default JapanTravelerContextBuilder;
