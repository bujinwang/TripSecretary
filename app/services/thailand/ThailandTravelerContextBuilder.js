/**
 * Thailand Traveler Context Builder Service
 * Builds complete traveler payload for TDAC submission from UserDataService data
 * Merges user data with TDAC defaults and validates completeness
 */

// Import will be done dynamically to avoid module resolution issues
import { formatLocalDate, isValidDateString } from '../../utils/dateUtils';
import { parseFullName } from '../../utils/nameUtils';

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

      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;

      // Retrieve all user data in a single operation for efficiency
      const userData = await UserDataService.getAllUserData(userId);
      
      // Also get travel info and fund items separately since they're not included in getAllUserData
      // Try multiple destination identifiers to ensure we find the data
      const [travelInfo, fundItems] = await Promise.all([
        ThailandTravelerContextBuilder.getTravelInfoWithFallback(userId),
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
      const validationResult = ThailandTravelerContextBuilder.validateUserData(userData);
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
      const tdacData = ThailandTravelerContextBuilder.transformToTDACFormat(userData);
      console.log('Transformed to TDAC format:', {
        hasPassportNo: !!tdacData.passportNo,
        hasFullName: !!tdacData.familyName && !!tdacData.firstName,
        hasArrivalDate: !!tdacData.arrivalDate,
        hasEmail: !!tdacData.email,
        departureDate: tdacData.departureDate,
        departureFlightNo: tdacData.departureFlightNo,
        departureFlightNumber: tdacData.departureFlightNumber,
        departureTravelMode: tdacData.departureTravelMode,
        departureTransportModeId: tdacData.departureTransportModeId
      });

      // Add required technical fields that are not user-provided
      const travelerPayload = {
        ...tdacData,
        // Technical fields required by TDAC API
        userId, // Include userId for post-submission entry info creation
        cloudflareToken: 'auto',
        tranModeId: ThailandTravelerContextBuilder.getTransportModeId(travelInfo), // Required transport mode
      };
      
      console.log('Using pure user data with minimal technical fields');

      // Final validation of the complete payload
      const payloadValidation = ThailandTravelerContextBuilder.validateTDACPayload(travelerPayload);
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
   * @param {Object} userData - User data from UserDataService
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
      } else {
        // Validate address quality
        const address = userData.travelInfo.hotelAddress || userData.travelInfo.address;
        if (ThailandTravelerContextBuilder.isTestOrDummyAddress(address)) {
          errors.push('住宿地址看起来像测试数据，请提供真实的酒店地址');
        }
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
   * @param {Object} userData - User data from UserDataService
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

    // Parse full name into family and first name using centralized utility
    const nameInfo = parseFullName(passport?.fullName || '', { debug: true });

    // Transform passport data - use ONLY actual user data, no fallbacks
    const tdacData = {
      // Personal Information In Passport (from user's passport data)
      familyName: nameInfo.familyName,
      firstName: nameInfo.firstName,
      middleName: nameInfo.middleName || '',
      passportNo: passport?.passportNumber || '',
      // DO NOT use encrypted nationality ID here - TDACAPIService will look it up
      // Pass plain nationality code (CHN, USA, etc.) for search and lookup
      nationality: passport?.nationality || '',
      nationalityDesc: passport?.nationality || '', // Plain text nationality for language detection
      
      // Personal Information (from user's personal info)
      birthDate: ThailandTravelerContextBuilder.formatDateForTDAC(passport?.dateOfBirth),
      occupation: personalInfo?.occupation || '',
      // IMPORTANT: Pass plain text gender value, NOT the TDAC ID
      // TDACAPIService will look it up from the session-specific cache
      gender: passport?.gender || '', // Pass "Male", "Female", etc. as plain text
      countryResidence: ThailandTravelerContextBuilder.getCountryFromNationality(passport?.nationality),
      cityResidence: personalInfo?.provinceCity || personalInfo?.countryRegion || '',
      phoneCode: ThailandTravelerContextBuilder.getPhoneCode(personalInfo),
      phoneNo: ThailandTravelerContextBuilder.getPhoneNumber(personalInfo),
      
      // Contact (from user's personal info)
      email: personalInfo?.email || '',
      
      // Trip Information (from user's travel info)
      arrivalDate: ThailandTravelerContextBuilder.formatDateForTDAC(travelInfo?.arrivalArrivalDate),
      departureDate: travelInfo?.departureDepartureDate ? ThailandTravelerContextBuilder.formatDateForTDAC(travelInfo.departureDepartureDate) : null,
      countryBoarded: ThailandTravelerContextBuilder.getCountryBoarded(travelInfo, passport),
      recentStayCountry: travelInfo?.recentStayCountry || passport?.nationality || '',
      purpose: ThailandTravelerContextBuilder.getPurposeId(travelInfo?.travelPurpose),
      travelMode: ThailandTravelerContextBuilder.getTravelMode(travelInfo),
      flightNo: travelInfo?.arrivalFlightNumber || '',
      tranModeId: ThailandTravelerContextBuilder.getTransportModeId(travelInfo), // Add transport mode ID
      
      // Departure flight information (optional but include if provided)
      // Map to the fields that TDACAPIService expects
      departureFlightNo: travelInfo?.departureFlightNumber || '',
      departureFlightNumber: travelInfo?.departureFlightNumber || '', // Alternative field name
      departureTravelMode: ThailandTravelerContextBuilder.getTravelMode(travelInfo), // Same as arrival for most cases
      departureTransportModeId: ThailandTravelerContextBuilder.getTransportModeId(travelInfo), // Same transport mode as arrival
      
      // Accommodation (from user's travel info)
      // IMPORTANT: Pass plain text accommodation type, NOT the TDAC ID
      // TDACAPIService will look it up from the session-specific cache
      accommodationType: travelInfo?.accommodationType || '', // Pass "HOTEL", "GUEST_HOUSE", etc. as plain text
      accommodationTypeDisplay: ThailandTravelerContextBuilder.getAccommodationTypeDisplay(travelInfo?.accommodationType),
      province: ThailandTravelerContextBuilder.transformProvince(travelInfo?.province),
      provinceDisplay: ThailandTravelerContextBuilder.getProvinceDisplayName(travelInfo?.province),
      // For HOTEL accommodation, district/subDistrict/postCode are not required and should be empty
      district: travelInfo?.accommodationType === 'HOTEL' ? '' : (travelInfo?.district || ''),
      districtDisplay: travelInfo?.accommodationType === 'HOTEL' ? '' : ThailandTravelerContextBuilder.formatLocationDisplay(
        travelInfo?.districtDisplay || travelInfo?.district
      ),
      subDistrict: travelInfo?.accommodationType === 'HOTEL' ? '' : (travelInfo?.subDistrict || ''),
      subDistrictDisplay: travelInfo?.accommodationType === 'HOTEL' ? '' : ThailandTravelerContextBuilder.formatLocationDisplay(
        travelInfo?.subDistrictDisplay || travelInfo?.subDistrict
      ),
      postCode: travelInfo?.accommodationType === 'HOTEL' ? '' : (travelInfo?.postalCode || ''),
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
   * @deprecated Use parseFullName from utils/nameUtils.js instead
   * @param {string} fullName - Full name string
   * @returns {Object} - Name components
   */
  static parseFullName(fullName) {
    // Delegate to centralized utility
    return parseFullName(fullName, { debug: true });
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
    return ThailandTravelerContextBuilder.extractPhoneCode(personalInfo.phoneNumber);
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
   * Get human-readable province name for confirmation dialogs
   * @param {string} provinceCode - Province code stored in traveler data
   * @returns {string} - Display value with localized name when available
   */
  static getProvinceDisplayName(provinceCode) {
    if (!provinceCode) return '';
    try {
      const provinceData = require('../../data/thailandProvinces');
      const provinces = provinceData?.thailandProvinces || [];
      const normalized = provinceCode.toUpperCase().trim();
      const match = provinces.find((item) => item.code === normalized);
      if (!match) {
        return ThailandTravelerContextBuilder.formatLocationDisplay(provinceCode);
      }
      return `${match.name} - ${match.nameZh}`;
    } catch (error) {
      console.warn('⚠️ Failed to load province display data:', error.message);
      return ThailandTravelerContextBuilder.formatLocationDisplay(provinceCode);
    }
  }

  /**
   * Format location strings for display (convert codes like AMNAT_CHAROEN → Amnat Charoen)
   * @param {string} value - Location string or code
   * @returns {string} - Formatted display string
   */
  static formatLocationDisplay(value) {
    if (!value) return '';
    const raw = value.toString().trim();
    if (!raw) return '';
    
    if (/^[A-Z_]+$/.test(raw)) {
      return raw
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    return raw;
  }

  /**
   * Get country boarded (departure country) with multiple fallback strategies
   * @param {Object} travelInfo - Travel information
   * @param {Object} passport - Passport information
   * @returns {string} - Country code for departure country
   */
  static getCountryBoarded(travelInfo, passport) {
    // Strategy 1: Use explicit departure country if provided
    if (travelInfo?.departureCountry) {
      return travelInfo.departureCountry;
    }

    // Strategy 2: Derive from departure airport code
    if (travelInfo?.arrivalDepartureAirport) {
      const countryFromAirport = ThailandTravelerContextBuilder.getCountryFromAirport(travelInfo.arrivalDepartureAirport);
      if (countryFromAirport) {
        return countryFromAirport;
      }
    }

    // Strategy 3: Use recent stay country if available
    if (travelInfo?.recentStayCountry) {
      return travelInfo.recentStayCountry;
    }

    // Strategy 4: Use passport nationality as fallback (most common case)
    if (passport?.nationality) {
      return passport.nationality;
    }

    // Strategy 5: Default to empty (will be flagged as validation error)
    return '';
  }

  /**
   * Get country from airport code
   * @param {string} airportCode - Airport code
   * @returns {string} - Country code
   */
  static getCountryFromAirport(airportCode) {
    if (!airportCode) return '';

    // Normalize airport code
    const normalizedCode = airportCode.toUpperCase().trim();

    // Map common airport codes to countries
    const airportMap = {
      // China
      'PEK': 'CHN', 'PVG': 'CHN', 'CAN': 'CHN', 'SZX': 'CHN', 'CTU': 'CHN', 'KMG': 'CHN',
      'XIY': 'CHN', 'WUH': 'CHN', 'CSX': 'CHN', 'NKG': 'CHN', 'HGH': 'CHN', 'TSN': 'CHN',
      
      // Hong Kong, Macau, Taiwan
      'HKG': 'HKG', 'MFM': 'MAC', 'TPE': 'TWN', 'KHH': 'TWN',
      
      // Japan
      'NRT': 'JPN', 'HND': 'JPN', 'KIX': 'JPN', 'NGO': 'JPN', 'FUK': 'JPN', 'CTS': 'JPN',
      
      // Korea
      'ICN': 'KOR', 'GMP': 'KOR', 'PUS': 'KOR',
      
      // Southeast Asia
      'SIN': 'SGP', 'KUL': 'MYS', 'CGK': 'IDN', 'MNL': 'PHL', 'BKK': 'THA', 'DMK': 'THA',
      'HAN': 'VNM', 'SGN': 'VNM', 'RGN': 'MMR', 'PNH': 'KHM',
      
      // USA & Canada
      'LAX': 'USA', 'JFK': 'USA', 'SFO': 'USA', 'ORD': 'USA', 'DFW': 'USA', 'ATL': 'USA',
      'YVR': 'CAN', 'YYZ': 'CAN', 'YUL': 'CAN',
      
      // Europe
      'LHR': 'GBR', 'CDG': 'FRA', 'FRA': 'DEU', 'AMS': 'NLD', 'FCO': 'ITA', 'MAD': 'ESP',
      
      // Australia & New Zealand
      'SYD': 'AUS', 'MEL': 'AUS', 'AKL': 'NZL',
      
      // Middle East
      'DXB': 'ARE', 'DOH': 'QAT', 'KWI': 'KWT'
    };

    return airportMap[normalizedCode] || '';
  }

  /**
   * Format date for TDAC (YYYY-MM-DD)
   * Uses timezone-safe formatting to prevent date shifts
   * @param {string|Date} dateStr - Date string or Date object
   * @returns {string} - Formatted date in YYYY-MM-DD format
   */
  static formatDateForTDAC(dateStr) {
    if (!dateStr) return '';

    try {
      // If already in valid YYYY-MM-DD format, return as-is
      if (typeof dateStr === 'string' && isValidDateString(dateStr)) {
        return dateStr;
      }

      // Otherwise, format using timezone-safe utility
      const formatted = formatLocalDate(dateStr);
      return formatted || '';
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
    if (payload.arrivalDate && !ThailandTravelerContextBuilder.isValidDate(payload.arrivalDate)) {
      errors.push(`到达日期格式无效: ${payload.arrivalDate}，应为 YYYY-MM-DD 格式`);
    }

    if (payload.departureDate && !ThailandTravelerContextBuilder.isValidDate(payload.departureDate)) {
      errors.push(`离开日期格式无效: ${payload.departureDate}，应为 YYYY-MM-DD 格式`);
    }

    if (payload.birthDate && !ThailandTravelerContextBuilder.isValidDate(payload.birthDate)) {
      errors.push(`出生日期格式无效: ${payload.birthDate}，应为 YYYY-MM-DD 格式`);
    }

    // Validate email format
    if (payload.email && !ThailandTravelerContextBuilder.isValidEmail(payload.email)) {
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
   * Check if address appears to be test or dummy data
   * @param {string} address - Address string
   * @returns {boolean} - Is test/dummy address
   */
  static isTestOrDummyAddress(address) {
    if (!address) return false;
    
    const lowerAddress = address.toLowerCase().trim();
    
    // Common test/dummy patterns
    const testPatterns = [
      'test', 'dummy', 'fake', 'sample', 'example',
      'add add', 'adidas dad', 'abc', '123', 'xxx',
      'temp', 'placeholder', 'default', 'lorem ipsum'
    ];
    
    // Check for test patterns
    for (const pattern of testPatterns) {
      if (lowerAddress.includes(pattern)) {
        return true;
      }
    }
    
    // Check for very short addresses (likely incomplete)
    if (lowerAddress.length < 5) {
      return true;
    }
    
    // Check for repeated characters (e.g., "aaaa", "1111")
    if (/(.)\1{3,}/.test(lowerAddress)) {
      return true;
    }
    
    return false;
  }

  /**
   * Determine travel mode from travel information
   * @param {Object} travelInfo - Travel information
   * @returns {string} - Travel mode (AIR, LAND, SEA)
   */
  static getTravelMode(travelInfo) {
    // If flight information is present, it's air travel
    if (travelInfo?.arrivalFlightNumber || travelInfo?.departureFlightNumber) {
      return 'AIR';
    }

    // Check for explicit travel mode
    if (travelInfo?.travelMode) {
      const mode = travelInfo.travelMode.toUpperCase();
      if (['AIR', 'LAND', 'SEA'].includes(mode)) {
        return mode;
      }
    }

    // Default to AIR for most international tourists
    return 'AIR';
  }

  /**
   * Get transport mode ID based on travel mode
   * Uses TDAC's encoded transport mode IDs with specific subtypes
   * @param {Object} travelInfo - Travel information
   * @returns {string} - TDAC encoded transport mode ID
   */
  static getTransportModeId(travelInfo) {
    console.log('🚨 getTransportModeId called with travelInfo:', travelInfo?.arrivalFlightNumber);
    const travelMode = ThailandTravelerContextBuilder.getTravelMode(travelInfo);
    console.log('🚨 Determined travel mode:', travelMode);
    
    // TDAC transport mode IDs (extracted from HAR file)
    const TDAC_TRANSPORT_MODE_IDS = {
      // Air transport subtypes
      'COMMERCIAL_FLIGHT': '6XcrGmsUxFe9ua1gehBv/Q==',     // Commercial flights (most common)
      'PRIVATE_CARGO': 'yYdaVPLIpwqddAuVOLDorQ==',         // Private/Cargo airline
      'OTHERS_AIR': 'mhapxYyzDmGnIyuZ0XgD8Q==',           // Others (please specify)
      
      // General transport modes (fallback)
      'AIR_GENERAL': 'ZUSsbcDrA+GoD4mQxvf7Ag==',           // General air transport
      'LAND_GENERAL': 'roui+vydIOBtjzLaEq6hCg==',          // General land transport
      'SEA_GENERAL': 'kFiGEpiBus5ZgYvP6i3CNQ==',          // General sea transport
      
      // Fallback mappings
      'AIR': '6XcrGmsUxFe9ua1gehBv/Q==',                   // Default to commercial flight
      'LAND': 'roui+vydIOBtjzLaEq6hCg==',                  // Land transport
      'SEA': 'kFiGEpiBus5ZgYvP6i3CNQ=='                    // Sea transport
    };
    
    // For air travel, determine specific subtype
    if (travelMode === 'AIR') {
      // Check if we can determine the specific flight type
      if (travelInfo?.arrivalFlightNumber) {
        const flightNo = travelInfo.arrivalFlightNumber.toUpperCase();
        
        // Commercial flights typically have airline codes (2 letters + numbers)
        const isCommercial = /^[A-Z]{2}\d+$/.test(flightNo);
        
        if (isCommercial) {
          console.log('🚨 TDAC_TRANSPORT_MODE_IDS keys:', Object.keys(TDAC_TRANSPORT_MODE_IDS));
          console.log('🚨 COMMERCIAL_FLIGHT value:', TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT']);
          const result = TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
          console.log('🚨 Returning result:', result);
          return result;
        }
      }
      
      // Default to commercial flight for air travel (most common case)
      return TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
    }
    
    return TDAC_TRANSPORT_MODE_IDS[travelMode] || TDAC_TRANSPORT_MODE_IDS['COMMERCIAL_FLIGHT'];
  }

  /**
   * Get gender ID based on gender string
   * Uses TDAC's encoded gender IDs
   * @param {string} gender - Gender string (MALE, FEMALE, etc.)
   * @returns {string} - TDAC encoded gender ID
   */
  static getGenderId(gender) {
    // TDAC gender IDs (extracted from HAR file)
    const TDAC_GENDER_IDS = {
      'MALE': 'g5iW15ADyFWOAxDewREkVA==',
      'FEMALE': 'JGb85pWhehCWn5EM6PeL5A==',
      'UNDEFINED': 'W6iZt0z/ayaCvyGt6LXKIA=='
    };

    // If gender is missing or undefined, return empty string
    // The TDAC API validation will catch this and show a proper error message
    if (!gender) return '';

    const normalizedGender = gender.toUpperCase().trim();

    // Map common variations
    if (normalizedGender === 'M' || normalizedGender === 'MALE' || normalizedGender === '男性') {
      return TDAC_GENDER_IDS['MALE'];
    }
    if (normalizedGender === 'F' || normalizedGender === 'FEMALE' || normalizedGender === '女性') {
      return TDAC_GENDER_IDS['FEMALE'];
    }

    // IMPORTANT: TDAC API does not accept UNDEFINED gender
    // Return empty string so validation will catch it and show proper error
    return '';
  }

  /**
   * Get accommodation type ID based on accommodation type
   * Uses TDAC's encoded accommodation IDs
   * @param {string} accommodationType - Accommodation type string
   * @returns {string} - TDAC encoded accommodation ID
   */
  static getAccommodationTypeId(accommodationType) {
    if (!accommodationType) return '';
    
    // TDAC accommodation type IDs (extracted from HAR file)
    const TDAC_ACCOMMODATION_IDS = {
      'HOTEL': 'kSqK152aNAx9HQigxwgnUg==',
      'YOUTH_HOSTEL': 'Bsldsb4eRsgtHy+rwxGvyQ==',
      'GUEST_HOUSE': 'xyft2pbI953g9FKKER4OZw==',
      'FRIEND_HOUSE': 'ze+djQZsddZtZdi37G7mZg==',
      'APARTMENT': 'PUB3ud2M4eOVGBmCEe4q2Q==',
      'OTHERS': 'lIaJ6Z7teVjIeRF2RT97Hw=='
    };
    
    const normalizedType = ThailandTravelerContextBuilder.normalizeAccommodationType(accommodationType);
    return TDAC_ACCOMMODATION_IDS[normalizedType] || TDAC_ACCOMMODATION_IDS.HOTEL;
  }

  /**
   * Normalize accommodation type to TDAC key
   * @param {string} accommodationType - Accommodation type string
   * @returns {string} - Normalized accommodation type key
   */
  static normalizeAccommodationType(accommodationType) {
    if (!accommodationType) return 'HOTEL';
    const normalizedType = accommodationType.toUpperCase().trim();
    
    const typeMapping = {
      'HOTEL': 'HOTEL',
      '酒店': 'HOTEL',
      'RESORT': 'HOTEL',  // TDAC doesn't have resort option, map to HOTEL
      'YOUTH HOSTEL': 'YOUTH_HOSTEL',
      'HOSTEL': 'YOUTH_HOSTEL',
      '青年旅舍': 'YOUTH_HOSTEL',
      'GUEST HOUSE': 'GUEST_HOUSE',
      'GUESTHOUSE': 'GUEST_HOUSE',
      '民宿': 'GUEST_HOUSE',
      'FRIEND\'S HOUSE': 'FRIEND_HOUSE',
      'FRIENDS HOUSE': 'FRIEND_HOUSE',
      'FRIEND': 'FRIEND_HOUSE',  // Map UI's FRIEND to TDAC's FRIEND_HOUSE
      '朋友家': 'FRIEND_HOUSE',
      'APARTMENT': 'APARTMENT',
      '公寓': 'APARTMENT',
      'OTHER': 'OTHERS',
      'OTHERS': 'OTHERS',
      '其他': 'OTHERS'
    };
    
    return typeMapping[normalizedType] || 'HOTEL';
  }

  /**
   * Get human-readable accommodation type display value
   * @param {string} accommodationType - Accommodation type string
   * @returns {string} - Friendly accommodation description
   */
  static getAccommodationTypeDisplay(accommodationType) {
    if (!accommodationType) return '';
    const normalizedType = ThailandTravelerContextBuilder.normalizeAccommodationType(accommodationType);
    
    const displayMap = {
      'HOTEL': 'Hotel (酒店)',
      'YOUTH_HOSTEL': 'Youth Hostel (青年旅舍)',
      'GUEST_HOUSE': 'Guest House (民宿)',
      'FRIEND_HOUSE': "Friend's House (朋友家)",
      'APARTMENT': 'Apartment (公寓)',
      'OTHERS': 'Other (其他)'
    };
    
    return displayMap[normalizedType] || accommodationType;
  }

  /**
   * Get purpose ID based on travel purpose
   * Uses TDAC's encoded purpose IDs
   * @param {string} purpose - Travel purpose string
   * @returns {string} - TDAC encoded purpose ID
   */
  static getPurposeId(purpose) {
    if (!purpose) return '';
    
    // TDAC purpose IDs (extracted from HAR file)
    const TDAC_PURPOSE_IDS = {
      'HOLIDAY': 'ZUSsbcDrA+GoD4mQxvf7Ag==',
      'MEETING': 'roui+vydIOBtjzLaEq6hCg==',
      'SPORTS': 'kFiGEpiBus5ZgYvP6i3CNQ==',
      'BUSINESS': '//wEUc0hKyGLuN5vojDBgA==',
      'INCENTIVE': 'g3Kfs7hn033IoeTa5VYrKQ==',
      'MEDICAL_WELLNESS': 'Khu8eZW5Xt/2dVTwRTc7oA==',
      'EDUCATION': '/LDehQQnXbGFGUe2mSC2lw==',
      'CONVENTION': 'a7NwNw5YbtyIQQClpkDxiQ==',
      'EMPLOYMENT': 'MIIPKOQBf05A/1ueNg8gSA==',
      'EXHIBITION': 'DeSHtTxpXJk+XIG5nUlW6w==',
      'OTHERS': 'J4Ru2J4RqpnDSHeA0k32PQ=='
    };
    
    const normalizedPurpose = purpose.toUpperCase().trim();
    
    // Map common variations
    const purposeMapping = {
      'HOLIDAY': 'HOLIDAY',
      'VACATION': 'HOLIDAY',
      'TOURISM': 'HOLIDAY',
      '度假': 'HOLIDAY',
      '旅游': 'HOLIDAY',
      'BUSINESS': 'BUSINESS',
      '商务': 'BUSINESS',
      'MEETING': 'MEETING',
      '会议': 'MEETING',
      'SPORTS': 'SPORTS',
      'SPORT': 'SPORTS',
      '体育': 'SPORTS',
      'EDUCATION': 'EDUCATION',
      'STUDY': 'EDUCATION',
      '教育': 'EDUCATION',
      '学习': 'EDUCATION',
      'EMPLOYMENT': 'EMPLOYMENT',
      'WORK': 'EMPLOYMENT',
      '就业': 'EMPLOYMENT',
      '工作': 'EMPLOYMENT',
      'MEDICAL': 'MEDICAL_WELLNESS',
      'WELLNESS': 'MEDICAL_WELLNESS',
      '医疗': 'MEDICAL_WELLNESS',
      'CONVENTION': 'CONVENTION',
      'EXHIBITION': 'EXHIBITION',
      'INCENTIVE': 'INCENTIVE',
      'OTHER': 'OTHERS',
      'OTHERS': 'OTHERS',
      '其他': 'OTHERS'
    };
    
    const mappedPurpose = purposeMapping[normalizedPurpose] || 'HOLIDAY'; // Default to holiday
    return TDAC_PURPOSE_IDS[mappedPurpose];
  }

  /**
   * Get nationality ID based on nationality code
   * Uses TDAC's encoded nationality IDs
   * @param {string} nationality - Nationality code (CHN, USA, etc.)
   * @returns {string} - TDAC encoded nationality ID
   */
  static getNationalityId(nationality) {
    if (!nationality) return '';
    
    // TDAC nationality IDs (extracted from HAR file - sample set)
    const TDAC_NATIONALITY_IDS = {
      'CHN': 'n8NVa/feQ+F5Ok859Oywuw==',  // China
      'HKG': 'g6ud3ID/+b3U95emMTZsBw==',  // Hong Kong
      'MAC': '6H4SM3pACzdpLaJx/SR7sg=='   // Macao
      // Note: More nationality IDs would need to be extracted from additional HAR captures
    };
    
    const normalizedNationality = nationality.toUpperCase().trim();
    
    // Return the encoded ID if available, otherwise return empty (will need API lookup)
    return TDAC_NATIONALITY_IDS[normalizedNationality] || '';
  }

  /**
   * Get travel info with multiple fallback attempts
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Travel info or null
   */
  static async getTravelInfoWithFallback(userId) {
    console.log('🔍 Starting getTravelInfoWithFallback for userId:', userId);
    
    // Import UserDataService dynamically
    const UserDataService = require('../data/UserDataService').default;
    
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
        
        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
        
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
    return await ThailandTravelerContextBuilder.buildContext(userId);
  }
}

export default ThailandTravelerContextBuilder;
