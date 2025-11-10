// @ts-nocheck

/**
 * TravelerDataTransformer - Unified traveler data transformation utility
 *
 * Centralizes all traveler data transformation logic to avoid duplication
 * across TDACHybridScreen, TDACWebViewScreen, and TDACSelectionScreen.
 *
 * Handles:
 * - Converting between different data formats
 * - Normalizing field names
 * - Providing defaults for missing fields
 * - Backward compatibility with legacy formats
 */

class TravelerDataTransformer {
  /**
   * Transform traveler info to TDAC API format
   *
   * @param {Object} travelerInfo - Traveler information object
   * @returns {Object} Transformed data ready for TDAC API submission
   */
  static toTDACFormat(travelerInfo) {
    if (!travelerInfo) {
      throw new Error('TravelerDataTransformer: travelerInfo is required');
    }

    return {
      // Name fields
      familyName: travelerInfo.familyName || travelerInfo.surname || '',
      middleName: travelerInfo.middleName || '',
      firstName: travelerInfo.firstName || travelerInfo.givenName || '',

      // Personal information
      gender: travelerInfo.gender || travelerInfo.sex || 'Male',
      nationality: travelerInfo.nationality || 'China',
      passportNo: travelerInfo.passportNo || '',
      birthDate: travelerInfo.birthDate || travelerInfo.dob || '',

      // Occupation and residence
      occupation: travelerInfo.occupation || '',
      cityResidence: travelerInfo.cityResidence || travelerInfo.cityOfResidence || '',
      countryResidence: travelerInfo.countryResidence || travelerInfo.residentCountry || '',

      // Visa information
      visaNo: travelerInfo.visaNo || travelerInfo.visaNumber || '',

      // Contact information
      phoneCode: travelerInfo.phoneCode || '+86',
      phoneNo: travelerInfo.phoneNo || travelerInfo.phoneNumber || '',

      // Travel dates
      arrivalDate: travelerInfo.arrivalDate || travelerInfo.arrivalArrivalDate || '',
      departureDate: travelerInfo.departureDate || travelerInfo.departureDepartureDate || null,

      // Travel origin
      countryBoarded: travelerInfo.countryBoarded || travelerInfo.boardingCountry || '',
      recentStayCountry: travelerInfo.recentStayCountry || '',

      // Travel purpose
      purpose: travelerInfo.purpose || travelerInfo.travelPurpose || 'HOLIDAY',
      
      // Travel mode
      travelMode: travelerInfo.travelMode || 'Air',
      flightNo: travelerInfo.flightNo || travelerInfo.arrivalFlightNumber || '',
      tranModeId: travelerInfo.tranModeId || this.resolveTravelModeId(travelerInfo.travelMode || 'Air'),

      // Departure flight information
      departureFlightNo: travelerInfo.departureFlightNo || travelerInfo.departureFlightNumber || '',
      departureFlightNumber: travelerInfo.departureFlightNumber || travelerInfo.departureFlightNo || '',
      departureTravelMode: travelerInfo.departureTravelMode || travelerInfo.travelMode || 'Air',
      departureTransportModeId: travelerInfo.departureTransportModeId || this.resolveTravelModeId(travelerInfo.travelMode || 'Air'),

      // Accommodation
      accommodationType: travelerInfo.accommodationType || 'HOTEL',
      province: travelerInfo.province || 'Bangkok',
      district: travelerInfo.district || '',
      subDistrict: travelerInfo.subDistrict || '',
      postCode: travelerInfo.postCode || travelerInfo.postalCode || '',
      address: travelerInfo.address || travelerInfo.hotelAddress || '',
    };
  }

  /**
   * Extract traveler info from route params
   * Handles both old format (passport, travelInfo) and new format (travelerInfo)
   *
   * @param {Object} params - Route parameters
   * @returns {Object} Normalized traveler information
   */
  static fromRouteParams(params) {
    if (!params) {
      return null;
    }

    // New format: travelerInfo is already provided
    if (params.travelerInfo && Object.keys(params.travelerInfo).length > 0) {
      return params.travelerInfo;
    }

    // Old format: construct from passport and travelInfo
    const passport = params.passport || {};
    const travelInfo = params.travelInfo || {};

    // Parse name from passport
    const nameEn = passport.nameEn || passport.name || '';
    const nameParts = this.parsePassportName(nameEn);

    return {
      // From passport
      passportNo: passport.passportNo || '',
      familyName: nameParts.familyName,
      firstName: nameParts.firstName,
      middleName: nameParts.middleName,
      birthDate: passport.birthDate || passport.dob || '',
      gender: passport.gender || passport.sex || 'Male',
      nationality: passport.nationality || 'China',

      // From travelInfo
      flightNo: travelInfo.flightNumber || travelInfo.flightNo || '',
      arrivalDate: travelInfo.arrivalDate || '',
      purpose: travelInfo.travelPurpose || travelInfo.purpose || 'HOLIDAY',
      countryBoarded: travelInfo.departureCountry || 'China',
      occupation: travelInfo.occupation || '',
      province: travelInfo.province || 'Bangkok',
      phoneNo: travelInfo.contactPhone || '',
      address: travelInfo.hotelAddress || '',
    };
  }

  /**
   * Parse passport name into components
   *
   * @param {string} nameEn - Full name in English (e.g., "WANG BUJIN")
   * @returns {Object} Parsed name components
   */
  static parsePassportName(nameEn) {
    if (!nameEn || typeof nameEn !== 'string') {
      return { familyName: '', firstName: '', middleName: '' };
    }

    const parts = nameEn.trim().split(/\s+/);

    if (parts.length === 0) {
      return { familyName: '', firstName: '', middleName: '' };
    } else if (parts.length === 1) {
      return { familyName: parts[0], firstName: '', middleName: '' };
    } else if (parts.length === 2) {
      return { familyName: parts[0], firstName: parts[1], middleName: '' };
    } else {
      // Multiple parts: first is family name, last is given name, rest are middle names
      return {
        familyName: parts[0],
        firstName: parts[parts.length - 1],
        middleName: parts.slice(1, -1).join(' '),
      };
    }
  }

  /**
   * Resolve travel mode ID from travel mode string
   *
   * @param {string} travelMode - Travel mode (e.g., "Air", "Sea", "Land")
   * @returns {string} Travel mode ID for TDAC API
   */
  static resolveTravelModeId(travelMode) {
    const travelModeMap = {
      'Air': '1',
      'Sea': '2',
      'Land': '3',
      'Train': '4',
    };

    return travelModeMap[travelMode] || '1'; // Default to Air
  }

  /**
   * Validate required fields for TDAC submission
   *
   * @param {Object} travelerData - Traveler data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  static validate(travelerData) {
    const errors = [];
    const requiredFields = [
      { field: 'passportNo', label: 'Passport Number' },
      { field: 'familyName', label: 'Family Name' },
      { field: 'firstName', label: 'First Name' },
      { field: 'birthDate', label: 'Birth Date' },
      { field: 'gender', label: 'Gender' },
      { field: 'nationality', label: 'Nationality' },
      { field: 'arrivalDate', label: 'Arrival Date' },
      { field: 'occupation', label: 'Occupation' },
      { field: 'purpose', label: 'Travel Purpose' },
    ];

    for (const { field, label } of requiredFields) {
      if (!travelerData[field] || travelerData[field].trim() === '') {
        errors.push(`${label} is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize traveler data for logging (removes sensitive information)
   *
   * @param {Object} travelerData - Traveler data to sanitize
   * @returns {Object} Sanitized data safe for logging
   */
  static sanitizeForLogging(travelerData) {
    if (!travelerData) {
      return null;
    }

    const sanitized = { ...travelerData };
    const sensitiveFields = ['passportNo', 'phoneNo', 'visaNo'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        const value = String(sanitized[field]);
        if (value.length > 4) {
          sanitized[field] = value.substring(0, 2) + '****' + value.substring(value.length - 2);
        } else {
          sanitized[field] = '****';
        }
      }
    });

    return sanitized;
  }

  /**
   * Check if traveler data is complete enough for submission
   *
   * @param {Object} travelerData - Traveler data to check
   * @returns {boolean} True if data is complete
   */
  static isComplete(travelerData) {
    const validation = this.validate(travelerData);
    return validation.isValid;
  }

  /**
   * Get completion percentage for traveler data
   *
   * @param {Object} travelerData - Traveler data to check
   * @returns {number} Completion percentage (0-100)
   */
  static getCompletionPercentage(travelerData) {
    if (!travelerData) {
      return 0;
    }

    const validation = this.validate(travelerData);
    const totalFields = 9; // Number of required fields
    const filledFields = totalFields - validation.errors.length;

    return Math.round((filledFields / totalFields) * 100);
  }
}

export default TravelerDataTransformer;
