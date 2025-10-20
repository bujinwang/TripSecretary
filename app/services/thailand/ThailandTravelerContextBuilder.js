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
      
      // Also get travel info and fund items separately since they're not included in getAllUserData
      // Try multiple destination identifiers to ensure we find the data
      const [travelInfo, fundItems] = await Promise.all([
        this.getTravelInfoWithFallback(userId),
        PassportDataService.getFundItems(userId).catch(() => [])
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
          accommodationType: userData.travelInfo.accommodationType,
          province: userData.travelInfo.province,
          hotelAddress: userData.travelInfo.hotelAddress,
          travelPurpose: userData.travelInfo.travelPurpose
        });
      } else {
        console.log('❌ No travel info found - this will cause validation to fail');
      }

      // Validate that we have the required data
      const validationResult = this.validateUserData(userData);
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

      // Transform user data to TDAC format
      const tdacData = this.transformToTDACFormat(userData);
      console.log('Transformed to TDAC format:', {
        hasPassportNo: !!tdacData.passportNo,
        hasFullName: !!tdacData.familyName && !!tdacData.firstName,
        hasArrivalDate: !!tdacData.arrivalDate,
        hasEmail: !!tdacData.email
      });

      // Add required technical fields that are not user-provided
      const travelerPayload = {
        ...tdacData,
        // Technical fields required by TDAC API
        cloudflareToken: 'auto',
        tranModeId: '', // Will be determined by API based on travelMode
      };
      
      console.log('Using pure user data with minimal technical fields');

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
        warnings: validationResult.warnings || [],
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
   * Validate that user data contains ALL required information for TDAC submission
   * TDAC requires strict validation - no defaults allowed for critical fields
   * @param {Object} userData - User data from PassportDataService
   * @returns {Object} - Validation result
   */
  static validateUserData(userData) {
    const errors = [];
    const warnings = [];

    // TDAC CRITICAL FIELDS - Must be present, no defaults allowed
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

    // TDAC PERSONAL INFO - Must be present
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
      if (!userData.personalInfo.provinceCity && !userData.personalInfo.countryRegion) {
        errors.push('居住城市是必需的');
      }
    }

    // TDAC TRAVEL INFO - Must be present
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
      if (!userData.travelInfo.province) {
        errors.push('住宿省份是必需的');
      }
      if (!userData.travelInfo.hotelAddress && !userData.travelInfo.address) {
        errors.push('住宿地址是必需的');
      }
    }

    // Optional fields that can use defaults (but warn user)
    if (userData.travelInfo) {
      if (!userData.travelInfo.departureDepartureDate) {
        warnings.push('离开日期未填写，将不设置离开日期');
      }
      if (!userData.travelInfo.travelPurpose) {
        warnings.push('旅行目的未填写，将使用默认值：度假旅游');
      }
      if (!userData.travelInfo.recentStayCountry) {
        warnings.push('最近14天停留国家未填写，将在健康申报中留空');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Transform user data to TDAC format
   * Maps user input fields to exact TDAC API requirements
   * @param {Object} userData - User data from PassportDataService
   * @returns {Object} - TDAC-formatted data
   */
  static transformToTDACFormat(userData) {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    console.log('🔄 Transforming user data to TDAC format:', {
      hasPassport: !!passport,
      hasPersonalInfo: !!personalInfo,
      hasTravelInfo: !!travelInfo,
      passportNumber: passport?.passportNumber,
      fullName: passport?.fullName,
      email: personalInfo?.email,
      arrivalDate: travelInfo?.arrivalArrivalDate,
      flightNumber: travelInfo?.arrivalFlightNumber
    });

    // Parse full name into family and first name
    const nameInfo = this.parseFullName(passport?.fullName || '');

    // Transform passport data - use ONLY actual user data, no fallbacks
    const tdacData = {
      // Personal Information In Passport (from user's passport data)
      familyName: nameInfo.familyName,
      firstName: nameInfo.firstName,
      middleName: nameInfo.middleName || '',
      passportNo: passport?.passportNumber || '',
      nationality: passport?.nationality || '',
      
      // Personal Information (from user's personal info)
      birthDate: this.formatDateForTDAC(passport?.dateOfBirth),
      occupation: personalInfo?.occupation || '',
      gender: this.transformGender(passport?.gender),
      countryResidence: this.getCountryFromNationality(passport?.nationality),
      cityResidence: personalInfo?.provinceCity || personalInfo?.countryRegion || '',
      phoneCode: this.getPhoneCode(personalInfo),
      phoneNo: this.getPhoneNumber(personalInfo),
      
      // Contact (from user's personal info)
      email: personalInfo?.email || '',
      
      // Trip Information (from user's travel info)
      arrivalDate: this.formatDateForTDAC(travelInfo?.arrivalArrivalDate),
      departureDate: travelInfo?.departureDepartureDate ? this.formatDateForTDAC(travelInfo.departureDepartureDate) : null,
      countryBoarded: this.getCountryFromAirport(travelInfo?.arrivalDepartureAirport),
      recentStayCountry: travelInfo?.recentStayCountry || '',
      purpose: this.transformTravelPurpose(travelInfo?.travelPurpose),
      travelMode: 'AIR', // Default for air travel
      flightNo: travelInfo?.arrivalFlightNumber || '',
      
      // Departure flight information (optional but include if provided)
      // Map to the fields that TDACAPIService expects
      departureFlightNo: travelInfo?.departureFlightNumber || '',
      departureFlightNumber: travelInfo?.departureFlightNumber || '', // Alternative field name
      departureTravelMode: 'AIR', // Same as arrival for most cases
      
      // Accommodation (from user's travel info)
      accommodationType: this.transformAccommodationType(travelInfo?.accommodationType),
      province: this.transformProvince(travelInfo?.province),
      district: travelInfo?.district || '',
      subDistrict: travelInfo?.subDistrict || '',
      postCode: travelInfo?.postalCode || '',
      address: travelInfo?.hotelAddress || travelInfo?.address || '',
      
      // Visa (optional, from user's travel info)
      visaNo: travelInfo?.visaNumber || passport?.visaNumber || ''
    };

    console.log('✅ Transformed TDAC data:', {
      familyName: tdacData.familyName,
      firstName: tdacData.firstName,
      passportNo: tdacData.passportNo,
      email: tdacData.email,
      arrivalDate: tdacData.arrivalDate,
      flightNo: tdacData.flightNo,
      recentStayCountry: tdacData.recentStayCountry,
      departureDate: tdacData.departureDate,
      departureFlightNo: tdacData.departureFlightNo,
      occupation: tdacData.occupation,
      cityResidence: tdacData.cityResidence,
      phoneNo: tdacData.phoneNo,
      address: tdacData.address
    });

    return tdacData;
  }

  /**
   * Parse full name into components
   * For Chinese names like "LI A MAO":
   * - Family Name: LI (姓)
   * - Middle Name: A (中间名)  
   * - First Name: MAO (名)
   * @param {string} fullName - Full name string
   * @returns {Object} - Name components
   */
  static parseFullName(fullName) {
    if (!fullName) {
      return { familyName: '', firstName: '', middleName: '' };
    }

    console.log('🔍 Parsing full name:', fullName);

    // Try comma-separated format first (e.g., "ZHANG, WEI MING")
    if (fullName.includes(',')) {
      const parts = fullName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        const givenNames = parts[1].split(' ').filter(name => name.length > 0);
        const result = {
          familyName: parts[0],
          middleName: givenNames[0] || '',
          firstName: givenNames.slice(1).join(' ') || givenNames[0] || ''
        };
        console.log('✅ Comma format parsed:', result);
        return result;
      }
    }

    // Try space-separated format (e.g., "LI A MAO")
    const spaceParts = fullName.trim().split(/\s+/);
    if (spaceParts.length === 3) {
      // Three parts: Family Middle First
      const result = {
        familyName: spaceParts[0],    // LI
        middleName: spaceParts[1],    // A
        firstName: spaceParts[2]      // MAO
      };
      console.log('✅ Three-part name parsed:', result);
      return result;
    } else if (spaceParts.length === 2) {
      // Two parts: Family First (no middle name)
      const result = {
        familyName: spaceParts[0],    // LI
        middleName: '',               // (empty)
        firstName: spaceParts[1]      // A MAO
      };
      console.log('✅ Two-part name parsed:', result);
      return result;
    } else if (spaceParts.length > 3) {
      // More than three parts: First is family, second is middle, rest is first
      const result = {
        familyName: spaceParts[0],                    // First part as family
        middleName: spaceParts[1],                    // Second part as middle
        firstName: spaceParts.slice(2).join(' ')     // Rest as first name
      };
      console.log('✅ Multi-part name parsed:', result);
      return result;
    }

    // Single name - treat as first name
    const result = {
      familyName: '',
      middleName: '',
      firstName: fullName
    };
    console.log('✅ Single name parsed:', result);
    return result;
  }

  /**
   * Transform gender to TDAC format
   * @param {string} gender - Gender from passport
   * @returns {string} - TDAC gender format
   */
  static transformGender(gender) {
    if (!gender) return ''; // No default - user must provide
    
    switch (gender.toLowerCase()) {
      case 'male':
      case 'm':
      case '男性':
        return 'MALE';
      case 'female':
      case 'f':
      case '女性':
        return 'FEMALE';
      default:
        return gender; // Return original if not recognized
    }
  }

  /**
   * Get country code from nationality
   * @param {string} nationality - Nationality code
   * @returns {string} - Country code
   */
  static getCountryFromNationality(nationality) {
    if (!nationality) return ''; // No default - user must provide
    
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

    return nationalityMap[nationality] || nationality;
  }

  /**
   * Get phone code from personal info (preferred method)
   * Uses phoneCode field directly, falls back to extraction if needed
   * @param {Object} personalInfo - Personal info object
   * @returns {string} - Phone code for TDAC (without + prefix)
   */
  static getPhoneCode(personalInfo) {
    if (!personalInfo) return '';

    // First, try to use the phoneCode field directly (preferred)
    if (personalInfo.phoneCode) {
      let phoneCode = personalInfo.phoneCode.toString().trim();
      // Remove + prefix for TDAC format
      if (phoneCode.startsWith('+')) {
        phoneCode = phoneCode.substring(1);
      }
      return phoneCode;
    }

    // Fallback: try to extract from phoneNumber field
    return this.extractPhoneCode(personalInfo.phoneNumber);
  }

  /**
   * Get phone number from personal info (preferred method)
   * Uses phoneNumber field directly, which should contain the local number
   * @param {Object} personalInfo - Personal info object
   * @returns {string} - Phone number without country code
   */
  static getPhoneNumber(personalInfo) {
    if (!personalInfo) return '';

    // Use phoneNumber field directly (should already be without country code)
    if (personalInfo.phoneNumber) {
      return personalInfo.phoneNumber.toString().trim();
    }

    return '';
  }

  /**
   * Extract phone code from phone number (legacy fallback method)
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone code
   */
  static extractPhoneCode(phoneNumber) {
    if (!phoneNumber) return ''; // No default - user must provide

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Extract country code - be more specific to avoid false matches
    if (cleaned.startsWith('+86')) {
      return '86';
    } else if (cleaned.startsWith('86') && cleaned.length > 13) {
      // Only treat as country code if it's a long number (86 + 11+ digits)
      return '86';
    } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
      return '852';
    } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
      return '853';
    } else if (cleaned.startsWith('+1')) {
      return '1';
    } else if (cleaned.startsWith('1') && cleaned.length > 11) {
      // Only treat as US/Canada code if it's a long number (1 + 10+ digits)
      return '1';
    } else if (cleaned.startsWith('+')) {
      // Extract first 1-3 digits after +
      const match = cleaned.match(/^\+(\d{1,3})/);
      return match ? match[1] : '';
    }

    return ''; // No fallback - return empty if can't determine
  }

  /**
   * Extract phone number without country code
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone number without country code
   */
  static extractPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';

    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove country codes - be more specific to avoid false matches
    if (cleaned.startsWith('+86')) {
      return cleaned.replace(/^\+86/, '');
    } else if (cleaned.startsWith('86') && cleaned.length > 13) {
      // Only treat as country code if it's a long number (86 + 11+ digits)
      return cleaned.replace(/^86/, '');
    } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
      return cleaned.replace(/^\+?852/, '');
    } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
      return cleaned.replace(/^\+?853/, '');
    } else if (cleaned.startsWith('+1')) {
      return cleaned.replace(/^\+1/, '');
    } else if (cleaned.startsWith('1') && cleaned.length > 11) {
      // Only treat as US/Canada code if it's a long number (1 + 10+ digits)
      return cleaned.replace(/^1/, '');
    } else if (cleaned.startsWith('+')) {
      // Remove any country code (1-3 digits after +)
      return cleaned.replace(/^\+\d{1,3}/, '');
    }

    return cleaned;
  }

  /**
   * Transform travel purpose to TDAC format
   * @param {string} purpose - Travel purpose from user input
   * @returns {string} - TDAC purpose format
   */
  static transformTravelPurpose(purpose) {
    if (!purpose) return ''; // No default - user must provide
    
    const purposeMap = {
      '度假旅游': 'HOLIDAY',
      '商务': 'BUSINESS',
      '会议': 'BUSINESS',
      '体育活动': 'SPORT',
      '奖励旅游': 'HOLIDAY',
      '会展': 'BUSINESS',
      '教育': 'EDUCATION',
      '就业': 'EMPLOYMENT',
      '展览': 'BUSINESS',
      '医疗': 'MEDICAL',
      '其他': 'OTHER'
    };
    
    return purposeMap[purpose] || purpose; // Return original if not mapped
  }

  /**
   * Transform accommodation type to TDAC format
   * @param {string} type - Accommodation type from user input
   * @returns {string} - TDAC accommodation format
   */
  static transformAccommodationType(type) {
    if (!type) return ''; // No default - user must provide
    
    const typeMap = {
      '酒店': 'HOTEL',
      '青年旅舍': 'HOSTEL',
      '民宿': 'GUESTHOUSE',
      '朋友家': 'FRIEND',
      '公寓': 'APARTMENT',
      '其他': 'OTHER'
    };
    
    return typeMap[type] || type; // Return original if not mapped
  }

  /**
   * Transform province to TDAC format
   * @param {string} province - Province from user input
   * @returns {string} - TDAC province format
   */
  static transformProvince(province) {
    if (!province) return ''; // No default - user must provide
    
    // Handle "Bangkok - 曼谷" format
    if (province.includes('Bangkok') || province.includes('曼谷')) {
      return 'BANGKOK';
    }
    
    // Map other common provinces
    const provinceMap = {
      'Bangkok': 'BANGKOK',
      'Phuket': 'PHUKET',
      'Chiang Mai': 'CHIANG_MAI',
      'Pattaya': 'CHONBURI',
      'Krabi': 'KRABI',
      'Koh Samui': 'SURAT_THANI'
    };
    
    return provinceMap[province] || province; // Return original if not mapped
  }

  /**
   * Get country from airport code
   * @param {string} airportCode - Airport code
   * @returns {string} - Country code
   */
  static getCountryFromAirport(airportCode) {
    if (!airportCode) return ''; // No default - derive from other data

    // Map common airport codes to countries
    const airportMap = {
      'PEK': 'CHN', 'PVG': 'CHN', 'CAN': 'CHN', 'SZX': 'CHN',
      'HKG': 'HKG', 'MFM': 'MAC', 'TPE': 'TWN',
      'NRT': 'JPN', 'KIX': 'JPN', 'ICN': 'KOR',
      'SIN': 'SGP', 'KUL': 'MYS',
      'LAX': 'USA', 'JFK': 'USA', 'LHR': 'GBR'
    };

    return airportMap[airportCode] || '';
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
   * Validate complete TDAC payload - STRICT validation for TDAC submission
   * All required fields must be present and valid
   * @param {Object} payload - TDAC payload
   * @returns {Object} - Validation result
   */
  static validateTDACPayload(payload) {
    const errors = [];

    // TDAC CRITICAL REQUIRED FIELDS - Must be present and non-empty
    const criticalFields = [
      { field: 'familyName', name: '姓氏' },
      { field: 'firstName', name: '名字' },
      { field: 'passportNo', name: '护照号码' },
      { field: 'nationality', name: '国籍' },
      { field: 'birthDate', name: '出生日期' },
      { field: 'occupation', name: '职业' },
      { field: 'gender', name: '性别' },
      { field: 'email', name: '邮箱地址' },
      { field: 'arrivalDate', name: '到达日期' },
      { field: 'flightNo', name: '航班号' },
      { field: 'cityResidence', name: '居住城市' },
      { field: 'phoneCode', name: '电话国家代码' },
      { field: 'phoneNo', name: '电话号码' },
      { field: 'accommodationType', name: '住宿类型' },
      { field: 'province', name: '住宿省份' },
      { field: 'address', name: '住宿地址' }
    ];

    criticalFields.forEach(({ field, name }) => {
      if (!payload[field] || payload[field].toString().trim().length === 0) {
        errors.push(`TDAC必需字段 '${name}' (${field}) 缺失或为空`);
      }
    });

    // Validate date formats (YYYY-MM-DD)
    if (payload.arrivalDate && !this.isValidDate(payload.arrivalDate)) {
      errors.push(`到达日期格式无效: ${payload.arrivalDate}，应为 YYYY-MM-DD 格式`);
    }

    if (payload.departureDate && !this.isValidDate(payload.departureDate)) {
      errors.push(`离开日期格式无效: ${payload.departureDate}，应为 YYYY-MM-DD 格式`);
    }

    if (payload.birthDate && !this.isValidDate(payload.birthDate)) {
      errors.push(`出生日期格式无效: ${payload.birthDate}，应为 YYYY-MM-DD 格式`);
    }

    // Validate email format
    if (payload.email && !this.isValidEmail(payload.email)) {
      errors.push(`邮箱格式无效: ${payload.email}`);
    }

    // Validate passport number format
    if (payload.passportNo && payload.passportNo.length < 6) {
      errors.push(`护照号码格式无效: ${payload.passportNo}，长度不足`);
    }

    // Validate phone number
    if (payload.phoneNo && payload.phoneNo.length < 8) {
      errors.push(`电话号码格式无效: ${payload.phoneNo}，长度不足`);
    }

    // Validate flight number format
    if (payload.flightNo && !/^[A-Z]{2}\d+$/i.test(payload.flightNo)) {
      console.warn(`航班号格式可能无效: ${payload.flightNo}，建议格式如 AC223`);
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
   * Get travel info with multiple fallback attempts
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Travel info or null
   */
  static async getTravelInfoWithFallback(userId) {
    console.log('🔍 Starting getTravelInfoWithFallback for userId:', userId);
    
    // Import PassportDataService dynamically
    const PassportDataService = require('../data/PassportDataService').default;
    
    // Based on database analysis, data is stored with destination='th'
    // Try the most likely destination IDs first
    const destinationIds = [
      'th',        // Confirmed from database - this should work
      'thailand',  // Fallback from ThailandTravelInfoScreen
      null         // Try without destination parameter as final fallback
    ];
    
    for (const destinationId of destinationIds) {
      try {
        const destinationStr = destinationId === null ? 'null' : destinationId;
        console.log(`🔍 Trying to get travel info with destination: ${destinationStr}`);
        
        const travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
        
        if (travelInfo && typeof travelInfo === 'object') {
          console.log(`✅ Found travel info with destination: ${destinationStr}`);
          console.log('   Key fields:', {
            arrivalArrivalDate: travelInfo.arrivalArrivalDate,
            arrivalFlightNumber: travelInfo.arrivalFlightNumber,
            departureDepartureDate: travelInfo.departureDepartureDate,
            departureFlightNumber: travelInfo.departureFlightNumber,
            accommodationType: travelInfo.accommodationType,
            province: travelInfo.province,
            hotelAddress: travelInfo.hotelAddress
          });
          
          // Validate that we have the essential fields
          if (travelInfo.arrivalArrivalDate && travelInfo.arrivalFlightNumber) {
            console.log('✅ Travel info has required fields - returning data');
            return travelInfo;
          } else {
            console.log('⚠️ Travel info missing essential fields, continuing search...');
          }
        } else {
          console.log(`❌ No travel info found for destination: ${destinationStr} (returned: ${travelInfo})`);
        }
      } catch (error) {
        const destinationStr = destinationId === null ? 'null' : destinationId;
        console.log(`❌ Failed to get travel info with destination ${destinationStr}:`, error.message);
        console.log('   Error details:', error.stack);
      }
    }
    
    console.log('❌ No valid travel info found with any method');
    console.log('   This will cause validation to fail with "旅行信息是必需的"');
    return null;
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
