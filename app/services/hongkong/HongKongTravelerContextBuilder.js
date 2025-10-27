/**
 * Hong Kong Traveler Context Builder Service
 * Builds complete traveler payload for Hong Kong entry preparation from UserDataService data
 * Note: As of Oct 2024, Hong Kong eliminated physical arrival cards
 * This service prepares data for immigration officer interviews and visa applications
 */

class HongKongTravelerContextBuilder {
  /**
   * Build complete Hong Kong traveler context from user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete traveler payload or validation errors
   */
  static async buildContext(userId) {
    try {
      console.log('=== HONG KONG TRAVELER CONTEXT BUILDER ===');
      console.log('Building context for userId:', userId);

      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;

      // Retrieve all user data in a single operation for efficiency
      const userData = await UserDataService.getAllUserData(userId);

      // Get travel info and fund items separately
      const [travelInfo, fundItems] = await Promise.all([
        HongKongTravelerContextBuilder.getTravelInfoWithFallback(userId),
        UserDataService.getFundItems(userId).catch(() => [])
      ]);

      // Add travel info and fund items to user data
      userData.travelInfo = travelInfo;
      userData.fundItems = fundItems;

      console.log('Retrieved user data:', {
        hasPassport: !!userData.passport,
        hasPersonalInfo: !!userData.personalInfo,
        hasTravelInfo: !!userData.travelInfo,
        fundItemsCount: userData.fundItems?.length || 0
      });

      // Log detailed travel info for debugging
      if (userData.travelInfo) {
        console.log('Travel info details:', {
          arrivalArrivalDate: userData.travelInfo.arrivalArrivalDate,
          arrivalFlightNumber: userData.travelInfo.arrivalFlightNumber,
          departureDepartureDate: userData.travelInfo.departureDepartureDate,
          departureFlightNumber: userData.travelInfo.departureFlightNumber,
          accommodationType: userData.travelInfo.accommodationType,
          province: userData.travelInfo.province,
          hotelAddress: userData.travelInfo.hotelAddress,
          travelPurpose: userData.travelInfo.travelPurpose
        });
      } else {
        console.log('❌ No travel info found - this will cause validation to fail');
      }

      // Validate that we have the required data
      const validationResult = HongKongTravelerContextBuilder.validateUserData(userData);
      if (!validationResult.isValid) {
        console.log('User data validation failed:', validationResult.errors);
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings || [],
          payload: null
        };
      }

      // Log warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('User data validation warnings:', validationResult.warnings);
      }

      // Transform user data to Hong Kong format
      const hkData = HongKongTravelerContextBuilder.transformToHKFormat(userData);
      console.log('Transformed to HK format:', {
        hasPassportNo: !!hkData.passportNo,
        hasFullName: !!hkData.familyName && !!hkData.firstName,
        hasArrivalDate: !!hkData.arrivalDate,
        hasEmail: !!hkData.email
      });

      // Build complete traveler payload
      const travelerPayload = {
        ...hkData
      };

      console.log('Hong Kong traveler context built successfully');

      return {
        success: true,
        errors: [],
        warnings: validationResult.warnings || [],
        payload: travelerPayload
      };

    } catch (error) {
      console.error('Failed to build Hong Kong traveler context:', error);
      return {
        success: false,
        errors: [`Failed to build traveler context: ${error.message}`],
        payload: null
      };
    }
  }

  /**
   * Validate that user data contains ALL required information
   * @param {Object} userData - User data from UserDataService
   * @returns {Object} - Validation result
   */
  static validateUserData(userData) {
    const errors = [];
    const warnings = [];

    // Passport information - required
    if (!userData.passport) {
      errors.push('护照信息是必需的');
    } else {
      if (!userData.passport.passportNumber) {
        errors.push('护照号码是必需的');
      }
      if (!userData.passport.fullName) {
        errors.push('护照上的姓名是必需的');
      }
      if (!userData.passport.nationality) {
        errors.push('国籍信息是必需的');
      }
      if (!userData.passport.dateOfBirth) {
        errors.push('出生日期是必需的');
      }
      if (!userData.passport.gender) {
        errors.push('性别信息是必需的');
      }
    }

    // Personal info - required
    if (!userData.personalInfo) {
      errors.push('个人信息是必需的');
    } else {
      if (!userData.personalInfo.email) {
        errors.push('邮箱地址是必需的');
      }
      if (!userData.personalInfo.phoneNumber) {
        errors.push('电话号码是必需的');
      }
      if (!userData.personalInfo.occupation) {
        errors.push('职业信息是必需的');
      }
    }

    // Travel info - required
    if (!userData.travelInfo) {
      errors.push('旅行信息是必需的');
    } else {
      if (!userData.travelInfo.arrivalArrivalDate) {
        errors.push('到达日期是必需的');
      }
      if (!userData.travelInfo.arrivalFlightNumber) {
        errors.push('到达航班号是必需的');
      }
      if (!userData.travelInfo.accommodationType) {
        errors.push('住宿类型是必需的');
      }
      if (!userData.travelInfo.hotelAddress && !userData.travelInfo.address) {
        errors.push('住宿地址是必需的');
      }
    }

    // Optional fields warnings
    if (userData.travelInfo) {
      if (!userData.travelInfo.departureDepartureDate) {
        warnings.push('离开日期未填写，建议填写');
      }
      if (!userData.travelInfo.travelPurpose) {
        warnings.push('旅行目的未填写，将使用默认值：旅游');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Transform user data to Hong Kong format
   * @param {Object} userData - User data from UserDataService
   * @returns {Object} - HK-formatted data
   */
  static transformToHKFormat(userData) {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    console.log('🔄 Transforming user data to HK format');

    // Parse full name into components
    const nameInfo = HongKongTravelerContextBuilder.parseFullName(passport?.fullName || '');

    // Transform to HK format
    const hkData = {
      // Passport information
      familyName: nameInfo.familyName,
      firstName: nameInfo.firstName,
      middleName: nameInfo.middleName || '',
      passportNo: passport?.passportNumber || '',
      nationality: passport?.nationality || '',

      // Personal information
      birthDate: HongKongTravelerContextBuilder.formatDateForHK(passport?.dateOfBirth),
      occupation: personalInfo?.occupation || '',
      gender: passport?.gender || '',
      countryResidence: HongKongTravelerContextBuilder.getCountryFromNationality(passport?.nationality),
      cityResidence: personalInfo?.provinceCity || personalInfo?.countryRegion || '',
      phoneCode: HongKongTravelerContextBuilder.getPhoneCode(personalInfo),
      phoneNo: HongKongTravelerContextBuilder.getPhoneNumber(personalInfo),

      // Contact
      email: personalInfo?.email || '',

      // Trip information
      arrivalDate: HongKongTravelerContextBuilder.formatDateForHK(travelInfo?.arrivalArrivalDate),
      departureDate: travelInfo?.departureDepartureDate ? HongKongTravelerContextBuilder.formatDateForHK(travelInfo.departureDepartureDate) : null,
      purpose: travelInfo?.travelPurpose || 'TOURISM',
      flightNo: travelInfo?.arrivalFlightNumber || '',
      departureFlightNo: travelInfo?.departureFlightNumber || '',

      // Accommodation
      accommodationType: travelInfo?.accommodationType || '',
      district: travelInfo?.district || travelInfo?.province || '',
      address: travelInfo?.hotelAddress || travelInfo?.address || '',

      // Funds (optional but recommended)
      fundItems: fundItems || []
    };

    console.log('✅ Transformed HK data:', {
      familyName: hkData.familyName,
      firstName: hkData.firstName,
      passportNo: hkData.passportNo,
      email: hkData.email,
      arrivalDate: hkData.arrivalDate
    });

    return hkData;
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

    const cleanedName = fullName.trim().replace(/\s+/g, ' ');

    // Try comma-separated format first (e.g., "ZHANG, WEI MING")
    if (cleanedName.includes(',')) {
      const parts = cleanedName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        const givenNames = parts[1].split(' ').filter(name => name.length > 0);
        return {
          familyName: parts[0].replace(/,+$/, '').trim(),
          middleName: givenNames.length >= 2 ? givenNames[0] : '',
          firstName: givenNames.length >= 2 ? givenNames.slice(1).join(' ') : (givenNames[0] || '')
        };
      }
    }

    // Try space-separated format
    const spaceParts = cleanedName.split(/\s+/);
    if (spaceParts.length === 3) {
      return {
        familyName: spaceParts[0].replace(/,+$/, '').trim(),
        middleName: spaceParts[1].replace(/,+$/, '').trim(),
        firstName: spaceParts[2].replace(/,+$/, '').trim()
      };
    } else if (spaceParts.length === 2) {
      return {
        familyName: spaceParts[0].replace(/,+$/, '').trim(),
        middleName: '',
        firstName: spaceParts[1].replace(/,+$/, '').trim()
      };
    } else if (spaceParts.length > 3) {
      return {
        familyName: spaceParts[0].replace(/,+$/, '').trim(),
        middleName: spaceParts[1].replace(/,+$/, '').trim(),
        firstName: spaceParts.slice(2).join(' ').replace(/,+$/, '').trim()
      };
    }

    // Single name
    return {
      familyName: '',
      middleName: '',
      firstName: cleanedName.replace(/,+$/, '').trim()
    };
  }

  /**
   * Get country code from nationality
   * @param {string} nationality - Nationality code
   * @returns {string} - Country code
   */
  static getCountryFromNationality(nationality) {
    if (!nationality) return '';

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

    return nationalityMap[nationality] || nationality;
  }

  /**
   * Get phone code from personal info
   * @param {Object} personalInfo - Personal info object
   * @returns {string} - Phone code (without + prefix)
   */
  static getPhoneCode(personalInfo) {
    if (!personalInfo) return '';

    if (personalInfo.phoneCode) {
      let phoneCode = personalInfo.phoneCode.toString().trim();
      if (phoneCode.startsWith('+')) {
        phoneCode = phoneCode.substring(1);
      }
      return phoneCode;
    }

    return '';
  }

  /**
   * Get phone number from personal info
   * @param {Object} personalInfo - Personal info object
   * @returns {string} - Phone number without country code
   */
  static getPhoneNumber(personalInfo) {
    if (!personalInfo || !personalInfo.phoneNumber) return '';
    return personalInfo.phoneNumber.toString().trim();
  }

  /**
   * Format date for HK (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {string} - Formatted date
   */
  static formatDateForHK(dateStr) {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Failed to format date:', error);
      return '';
    }
  }

  /**
   * Get travel info with multiple fallback attempts
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Travel info or null
   */
  static async getTravelInfoWithFallback(userId) {
    console.log('🔍 Starting getTravelInfoWithFallback for userId:', userId);

    const UserDataService = require('../data/UserDataService').default;

    // Try different destination IDs
    const destinationIds = [
      'hk',        // Primary Hong Kong ID
      'hongkong',  // Fallback
      null         // Try without destination parameter
    ];

    for (const destinationId of destinationIds) {
      try {
        const destinationStr = destinationId === null ? 'null' : destinationId;
        console.log(`🔍 Trying to get travel info with destination: ${destinationStr}`);

        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        if (travelInfo && typeof travelInfo === 'object') {
          console.log(`✅ Found travel info with destination: ${destinationStr}`);

          // Validate essential fields
          if (travelInfo.arrivalArrivalDate && travelInfo.arrivalFlightNumber) {
            console.log('✅ Travel info has required fields - returning data');
            return travelInfo;
          } else {
            console.log('⚠️ Travel info missing essential fields, continuing search...');
          }
        }
      } catch (error) {
        const destinationStr = destinationId === null ? 'null' : destinationId;
        console.log(`❌ Failed to get travel info with destination ${destinationStr}:`, error.message);
      }
    }

    console.log('❌ No valid travel info found with any method');
    return null;
  }

  /**
   * Get traveler context with error handling and fallbacks
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Traveler context with success/error status
   */
  static async buildHongKongTravelerContext(userId) {
    return await HongKongTravelerContextBuilder.buildContext(userId);
  }
}

export default HongKongTravelerContextBuilder;
