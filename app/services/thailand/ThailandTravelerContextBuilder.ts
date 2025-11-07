/**
 * Thailand Traveler Context Builder Service
 * Builds complete traveler payload for TDAC submission from UserDataService data
 * Merges user data with TDAC defaults and validates completeness
 */

// Import will be done dynamically to avoid module resolution issues
import { formatLocalDate, isValidDateString } from '../../utils/dateUtils';
import { parseFullName } from '../../utils/nameUtils';
import { extractCountryCode, extractNationalNumber } from '../../utils/phoneUtils';
import { formatLocationCode } from '../../utils/locationUtils';
import { isTestOrDummyAddress } from '../../utils/addressValidation.js';
import tdacSessionManager from './TDACSessionManager';
import {
  normalizeAccommodationType,
  getAccommodationTypeDisplay,
  requiresDetailedAddress
} from '../../config/destinations/thailand/accommodationTypes';
import {
  normalizeTravelPurpose,
  getTravelPurposeDisplay
} from '../../config/destinations/thailand/travelPurposes';
import LoggingService from '../LoggingService';
import type { UserId } from '../../types/data';
import type { Logger } from '../../types/services';

const logger: Logger = LoggingService.for('ThailandTravelerContextBuilder');

// Type definitions
interface PassportData {
  passportNumber?: string;
  fullName?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  visaNumber?: string;
  [key: string]: any;
}

interface PersonalInfoData {
  email?: string;
  phoneNumber?: string;
  phoneCode?: string;
  occupation?: string;
  provinceCity?: string;
  countryRegion?: string;
  [key: string]: any;
}

interface TravelInfoData {
  arrivalArrivalDate?: string;
  arrivalFlightNumber?: string;
  arrivalDepartureAirport?: string;
  departureDepartureDate?: string;
  departureFlightNumber?: string;
  departureCountry?: string;
  accommodationType?: string;
  province?: string;
  district?: string;
  districtDisplay?: string;
  subDistrict?: string;
  subDistrictDisplay?: string;
  postalCode?: string;
  hotelAddress?: string;
  address?: string;
  travelPurpose?: string;
  travelMode?: string;
  recentStayCountry?: string;
  visaNumber?: string;
  [key: string]: any;
}

interface FundItemData {
  amount?: number;
  currency?: string;
  type?: string;
  [key: string]: any;
}

interface UserData {
  passport?: PassportData | null;
  personalInfo?: PersonalInfoData | null;
  travelInfo?: TravelInfoData | null;
  fundItems?: FundItemData[];
  [key: string]: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface BuildContextResult {
  success: boolean;
  errors: string[];
  warnings?: string[];
  payload: TDACPayload | null;
}

interface TDACPayload {
  // Personal Information In Passport
  familyName: string;
  firstName: string;
  middleName?: string;
  passportNo: string;
  nationality: string;
  nationalityDesc: string;
  
  // Personal Information
  birthDate: string;
  occupation: string;
  gender: string;
  countryResidence: string;
  cityResidence: string;
  phoneCode: string;
  phoneNo: string;
  
  // Contact
  email: string;
  
  // Trip Information
  arrivalDate: string;
  departureDate?: string | null;
  countryBoarded: string;
  recentStayCountry: string;
  purpose: string;
  travelMode: string;
  flightNo: string;
  tranModeId: string;
  
  // Departure flight information
  departureFlightNo?: string;
  departureFlightNumber?: string;
  departureTravelMode?: string;
  departureTransportModeId?: string;
  
  // Accommodation
  accommodationType: string;
  accommodationTypeDisplay?: string;
  province: string;
  provinceDisplay?: string;
  district: string;
  districtDisplay?: string;
  subDistrict: string;
  subDistrictDisplay?: string;
  postCode: string;
  address: string;
  
  // Visa
  visaNo?: string;
  
  // Technical fields
  userId: UserId;
  cloudflareToken: string;
  [key: string]: any;
}

interface NameInfo {
  familyName: string;
  firstName: string;
  middleName?: string;
}

class ThailandTravelerContextBuilder {
  /**
   * Build complete Thailand traveler context from user data
   * @param userId - User ID
   * @returns Promise resolving to complete traveler payload or validation errors
   */
  static async buildContext(userId: UserId): Promise<BuildContextResult> {
    try {
      logger.info('Building Thailand traveler context', { userId });

      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;

      // Retrieve all user data in a single operation for efficiency
      const userData: UserData = await UserDataService.getAllUserData(userId);
      
      // Also get travel info and fund items separately since they're not included in getAllUserData
      // Try multiple destination identifiers to ensure we find the data
      const [travelInfo, fundItems] = await Promise.all([
        ThailandTravelerContextBuilder.getTravelInfoWithFallback(userId),
        UserDataService.getFundItems(userId).catch(() => [])
      ]);
      
      // Add travel info and fund items to user data
      userData.travelInfo = travelInfo;
      userData.fundItems = fundItems;
      
      logger.debug('Retrieved user data', {
        hasPassport: !!userData.passport,
        hasPersonalInfo: !!userData.personalInfo,
        hasTravelInfo: !!userData.travelInfo,
        fundItemsCount: userData.fundItems?.length || 0
      });

      // Log detailed travel info for debugging
      if (userData.travelInfo) {
        logger.debug('Travel info details', {
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
        logger.warn('No travel info found - this will cause validation to fail', { userId });
      }

      // Initialize TDAC session manager to fetch/cache dropdown IDs
      logger.debug('Initializing TDAC session manager...');
      await tdacSessionManager.initialize();
      logger.debug('TDAC session manager ready');

      // Validate that we have the required data
      const validationResult = ThailandTravelerContextBuilder.validateUserData(userData);
      if (!validationResult.isValid) {
        logger.warn('User data validation failed', { errors: validationResult.errors, userId });
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings || [],
          payload: null
        };
      }

      // Log warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        logger.warn('User data validation warnings', { warnings: validationResult.warnings, userId });
      }

      // Transform user data to TDAC format
      const tdacData = ThailandTravelerContextBuilder.transformToTDACFormat(userData);
      logger.debug('Transformed to TDAC format', {
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
      const travelerPayload: TDACPayload = {
        ...tdacData,
        // Technical fields required by TDAC API
        userId, // Include userId for post-submission entry info creation
        cloudflareToken: 'auto',
        tranModeId: ThailandTravelerContextBuilder.getTransportModeId(travelInfo || {}), // Required transport mode
      };
      
      logger.debug('Using pure user data with minimal technical fields');

      // Final validation of the complete payload
      const payloadValidation = ThailandTravelerContextBuilder.validateTDACPayload(travelerPayload);
      if (!payloadValidation.isValid) {
        logger.warn('TDAC payload validation failed', { errors: payloadValidation.errors, userId });
        return {
          success: false,
          errors: payloadValidation.errors,
          payload: travelerPayload
        };
      }

      logger.info('Thailand traveler context built successfully', { userId });

      
      return {
        success: true,
        errors: [],
        warnings: validationResult.warnings || [],
        payload: travelerPayload
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to build Thailand traveler context', err, { userId });
      return {
        success: false,
        errors: [`Failed to build traveler context: ${err.message}`],
        payload: null
      };
    }
  }

  /**
   * Validate that user data contains ALL required information for TDAC submission
   * TDAC requires strict validation - no defaults allowed for critical fields
   * @param userData - User data from UserDataService
   * @returns Validation result
   */
  static validateUserData(userData: UserData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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
      const address = userData.travelInfo.hotelAddress || userData.travelInfo.address;
      if (!address) {
        errors.push('住宿地址是必需的');
      } else {
        // Validate address quality
        if (isTestOrDummyAddress(address)) {
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
   * @param userData - User data from UserDataService
   * @returns TDAC-formatted data
   */
  static transformToTDACFormat(userData: UserData): Partial<TDACPayload> {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    logger.debug('Transforming user data to TDAC format', {
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
    const nameInfo: NameInfo = parseFullName(passport?.fullName || '', { debug: true });

    // Transform passport data - use ONLY actual user data, no fallbacks
    const tdacData: Partial<TDACPayload> = {
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
      tranModeId: ThailandTravelerContextBuilder.getTransportModeId(travelInfo || {}), // Add transport mode ID
      
      // Departure flight information (optional but include if provided)
      // Map to the fields that TDACAPIService expects
      departureFlightNo: travelInfo?.departureFlightNumber || '',
      departureFlightNumber: travelInfo?.departureFlightNumber || '', // Alternative field name
      departureTravelMode: ThailandTravelerContextBuilder.getTravelMode(travelInfo),
      departureTransportModeId: ThailandTravelerContextBuilder.getTransportModeId(travelInfo || {}),
      
      // Accommodation (from user's travel info)
      // IMPORTANT: Pass plain text accommodation type, NOT the TDAC ID
      // TDACAPIService will look it up from the session-specific cache
      accommodationType: travelInfo?.accommodationType || '', // Pass "HOTEL", "GUEST_HOUSE", etc. as plain text
      accommodationTypeDisplay: ThailandTravelerContextBuilder.getAccommodationTypeDisplay(travelInfo?.accommodationType),
      province: ThailandTravelerContextBuilder.transformProvince(travelInfo?.province),
      provinceDisplay: ThailandTravelerContextBuilder.getProvinceDisplayName(travelInfo?.province),
      // For HOTEL accommodation, district/subDistrict/postCode are not required and should be empty
      // Use requiresDetailedAddress() helper to determine if detailed address is needed
      district: requiresDetailedAddress(travelInfo?.accommodationType) ? (travelInfo?.district || '') : '',
      districtDisplay: requiresDetailedAddress(travelInfo?.accommodationType) ? formatLocationCode(
        travelInfo?.districtDisplay || travelInfo?.district
      ) : '',
      subDistrict: requiresDetailedAddress(travelInfo?.accommodationType) ? (travelInfo?.subDistrict || '') : '',
      subDistrictDisplay: requiresDetailedAddress(travelInfo?.accommodationType) ? formatLocationCode(
        travelInfo?.subDistrictDisplay || travelInfo?.subDistrict
      ) : '',
      postCode: requiresDetailedAddress(travelInfo?.accommodationType) ? (travelInfo?.postalCode || '') : '',
      address: travelInfo?.hotelAddress || travelInfo?.address || '',
      
      // Visa (optional, from user's travel info)
      visaNo: travelInfo?.visaNumber || passport?.visaNumber || ''
    };

    logger.debug('Transformed TDAC data', {
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
   * @param fullName - Full name string
   * @returns Name components
   */
  static parseFullName(fullName: string): NameInfo {
    // Delegate to centralized utility
    return parseFullName(fullName, { debug: true });
  }

  /**
   * Transform gender to TDAC format
   * @param gender - Gender from passport
   * @returns TDAC gender format
   */
  static transformGender(gender: string): string {
    if (!gender) {
      return ''; // No default - user must provide
    }
    
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
   * @param nationality - Nationality code
   * @returns Country code
   */
  static getCountryFromNationality(nationality?: string): string {
    if (!nationality) {
      return ''; // No default - user must provide
    }
    
    // Map common nationality codes to country codes
    const nationalityMap: Record<string, string> = {
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
   * @param personalInfo - Personal info object
   * @returns Phone code for TDAC (without + prefix)
   */
  static getPhoneCode(personalInfo?: PersonalInfoData): string {
    if (!personalInfo) {
      return '';
    }

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
   * @param personalInfo - Personal info object
   * @returns Phone number without country code
   */
  static getPhoneNumber(personalInfo?: PersonalInfoData): string {
    if (!personalInfo) {
      return '';
    }

    // Use phoneNumber field directly (should already be without country code)
    if (personalInfo.phoneNumber) {
      return personalInfo.phoneNumber.toString().trim();
    }

    return '';
  }

  /**
   * Extract phone code from phone number (legacy fallback method)
   * @deprecated Use extractCountryCode from utils/phoneUtils.js instead
   * @param phoneNumber - Full phone number
   * @returns Phone code
   */
  static extractPhoneCode(phoneNumber?: string): string {
    // Delegate to centralized utility
    return extractCountryCode(phoneNumber || '', { strict: true });
  }

  /**
   * Extract phone number without country code
   * @deprecated Use extractNationalNumber from utils/phoneUtils.js instead
   * @param phoneNumber - Full phone number
   * @returns Phone number without country code
   */
  static extractPhoneNumber(phoneNumber?: string): string {
    // Delegate to centralized utility
    return extractNationalNumber(phoneNumber || '');
  }

  /**
   * Transform travel purpose to TDAC format
   * @deprecated Use normalizeTravelPurpose from config/destinations/thailand/travelPurposes.js instead
   * @param purpose - Travel purpose from user input
   * @returns TDAC purpose format
   */
  static transformTravelPurpose(purpose?: string): string {
    // Delegate to centralized config for backward compatibility
    return normalizeTravelPurpose(purpose || '');
  }

  /**
   * Transform accommodation type to TDAC format
   * @param type - Accommodation type from user input
   * @returns TDAC accommodation format
   */
  static transformAccommodationType(type?: string): string {
    if (!type) {
      return ''; // No default - user must provide
    }
    
    const typeMap: Record<string, string> = {
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
   * @param province - Province from user input
   * @returns TDAC province format
   */
  static transformProvince(province?: string): string {
    if (!province) {
      return ''; // No default - user must provide
    }
    
    // Handle "Bangkok - 曼谷" format
    if (province.includes('Bangkok') || province.includes('曼谷')) {
      return 'BANGKOK';
    }
    
    // Map other common provinces
    const provinceMap: Record<string, string> = {
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
   * @param provinceCode - Province code stored in traveler data
   * @returns Display value with localized name when available
   */
  static getProvinceDisplayName(provinceCode?: string): string {
    if (!provinceCode) {
      return '';
    }
    try {
      const provinceData = require('../../data/thailandProvinces');
      const provinces = provinceData?.thailandProvinces || [];
      const normalized = provinceCode.toUpperCase().trim();
      const match = provinces.find((item: any) => item.code === normalized);
      if (!match) {
        return formatLocationCode(provinceCode);
      }
      return `${match.name} - ${match.nameZh}`;
    } catch (error) {
      logger.warn('Failed to load province display data', error instanceof Error ? error : new Error(String(error)), { provinceCode });
      return formatLocationCode(provinceCode);
    }
  }

  /**
   * Format location strings for display (convert codes like AMNAT_CHAROEN → Amnat Charoen)
   * @deprecated Use formatLocationCode from utils/locationUtils.js instead
   * @param value - Location string or code
   * @returns Formatted display string
   */
  static formatLocationDisplay(value: string): string {
    // Delegate to centralized utility for backward compatibility
    return formatLocationCode(value);
  }

  /**
   * Get country boarded (departure country) with multiple fallback strategies
   * @param travelInfo - Travel information
   * @param passport - Passport information
   * @returns Country code for departure country
   */
  static getCountryBoarded(travelInfo?: TravelInfoData, passport?: PassportData): string {
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
   * @param airportCode - Airport code
   * @returns Country code
   */
  static getCountryFromAirport(airportCode?: string): string {
    if (!airportCode) {
      return '';
    }

    // Normalize airport code
    const normalizedCode = airportCode.toUpperCase().trim();

    // Map common airport codes to countries
    const airportMap: Record<string, string> = {
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
   * @param dateStr - Date string or Date object
   * @returns Formatted date in YYYY-MM-DD format
   */
  static formatDateForTDAC(dateStr?: string | Date): string {
    if (!dateStr) {
      return '';
    }

    try {
      // If already in valid YYYY-MM-DD format, return as-is
      if (typeof dateStr === 'string' && isValidDateString(dateStr)) {
        return dateStr;
      }

      // Otherwise, format using timezone-safe utility
      const formatted = formatLocalDate(dateStr);
      return formatted || '';
    } catch (error) {
      logger.error('Failed to format date', error instanceof Error ? error : new Error(String(error)), { date: dateStr });
      return '';
    }
  }

  /**
   * Validate complete TDAC payload - STRICT validation for TDAC submission
   * All required fields must be present and valid
   * @param payload - TDAC payload
   * @returns Validation result
   */
  static validateTDACPayload(payload: Partial<TDACPayload>): ValidationResult {
    const errors: string[] = [];

    // TDAC CRITICAL REQUIRED FIELDS - Must be present and non-empty
    const criticalFields: Array<{ field: keyof TDACPayload; name: string }> = [
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
      const value = payload[field];
      if (!value || value.toString().trim().length === 0) {
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
      logger.warn('Flight number format may be invalid, suggested format like AC223', { flightNo: payload.flightNo });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param dateStr - Date string
   * @returns Is valid date
   */
  static isValidDate(dateStr?: string): boolean {
    if (!dateStr) {
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return false;
    }

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate email format
   * @param email - Email address
   * @returns Is valid email
   */
  static isValidEmail(email?: string): boolean {
    if (!email) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Determine travel mode from travel information
   * @param travelInfo - Travel information
   * @returns Travel mode (AIR, LAND, SEA)
   */
  static getTravelMode(travelInfo?: TravelInfoData): string {
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
   * Uses TDAC session manager for dynamic ID retrieval
   * @param travelInfo - Travel information
   * @returns TDAC encoded transport mode ID
   */
  static getTransportModeId(travelInfo?: TravelInfoData): string {
    logger.debug('getTransportModeId called', { arrivalFlightNumber: travelInfo?.arrivalFlightNumber });
    const travelMode = ThailandTravelerContextBuilder.getTravelMode(travelInfo);
    logger.debug('Determined travel mode', { travelMode });

    // For air travel, determine specific subtype
    if (travelMode === 'AIR') {
      // Check if we can determine the specific flight type
      if (travelInfo?.arrivalFlightNumber) {
        const flightNo = travelInfo.arrivalFlightNumber.toUpperCase();

        // Commercial flights typically have airline codes (2 letters + numbers)
        const isCommercial = /^[A-Z]{2}\d+$/.test(flightNo);

        if (isCommercial) {
          logger.debug('Using COMMERCIAL_FLIGHT mode');
          try {
            return tdacSessionManager.getTransportModeId('COMMERCIAL_FLIGHT');
          } catch (error) {
            logger.error('Error getting transport mode ID from session manager', error instanceof Error ? error : new Error(String(error)));
            return '';
          }
        }
      }

      // Default to commercial flight for air travel (most common case)
      try {
        return tdacSessionManager.getTransportModeId('COMMERCIAL_FLIGHT');
      } catch (error) {
        logger.error('Error getting transport mode ID from session manager', error instanceof Error ? error : new Error(String(error)), { travelMode });
        return '';
      }
    }

    // Use session manager to get encrypted ID for other modes
    try {
      return tdacSessionManager.getTransportModeId(travelMode);
    } catch (error) {
      logger.error('Error getting transport mode ID from session manager', error instanceof Error ? error : new Error(String(error)), { travelMode });
      return '';
    }
  }

  /**
   * Get gender ID based on gender string
   * Uses TDAC session manager for dynamic ID retrieval
   * @param gender - Gender string (MALE, FEMALE, etc.)
   * @returns TDAC encoded gender ID
   */
  static getGenderId(gender?: string): string {
    // If gender is missing or undefined, return empty string
    // The TDAC API validation will catch this and show a proper error message
    if (!gender) {
      return '';
    }

    const normalizedGender = gender.toUpperCase().trim();

    // Map common variations to standard values
    let standardGender = normalizedGender;
    if (normalizedGender === 'M' || normalizedGender === '男性') {
      standardGender = 'MALE';
    } else if (normalizedGender === 'F' || normalizedGender === '女性') {
      standardGender = 'FEMALE';
    }

    // IMPORTANT: TDAC API does not accept UNDEFINED gender
    // Return empty string so validation will catch it and show proper error
    if (standardGender === 'UNDEFINED') {
      return '';
    }

    // Use session manager to get encrypted ID
    try {
      return tdacSessionManager.getGenderId(standardGender);
    } catch (error) {
      logger.error('Error getting gender ID from session manager', error instanceof Error ? error : new Error(String(error)), { gender });
      return '';
    }
  }

  /**
   * Get accommodation type ID based on accommodation type
   * Uses TDAC session manager for dynamic ID retrieval
   * @param accommodationType - Accommodation type string
   * @returns TDAC encoded accommodation ID
   */
  static getAccommodationTypeId(accommodationType?: string): string {
    if (!accommodationType) {
      // Use session manager to get default HOTEL ID
      try {
        return tdacSessionManager.getAccommodationId('HOTEL');
      } catch (error) {
        logger.error('Error getting accommodation ID from session manager', error instanceof Error ? error : new Error(String(error)), { accommodationType });
        return '';
      }
    }

    const normalizedType = ThailandTravelerContextBuilder.normalizeAccommodationType(accommodationType);

    // Use session manager to get encrypted ID
    try {
      return tdacSessionManager.getAccommodationId(normalizedType);
    } catch (error) {
      logger.error('Error getting accommodation ID from session manager', error instanceof Error ? error : new Error(String(error)), { accommodationType });
      return '';
    }
  }

  /**
   * Normalize accommodation type to TDAC key
   * @deprecated Use normalizeAccommodationType from config/destinations/thailand/accommodationTypes.js instead
   * @param accommodationType - Accommodation type string
   * @returns Normalized accommodation type key
   */
  static normalizeAccommodationType(accommodationType?: string): string {
    // Delegate to centralized config for backward compatibility
    return normalizeAccommodationType(accommodationType || '');
  }

  /**
   * Get human-readable accommodation type display value
   * @deprecated Use getAccommodationTypeDisplay from config/destinations/thailand/accommodationTypes.js instead
   * @param accommodationType - Accommodation type string
   * @returns Friendly accommodation description
   */
  static getAccommodationTypeDisplay(accommodationType?: string): string {
    // Delegate to centralized config for backward compatibility
    return getAccommodationTypeDisplay(accommodationType || '');
  }

  /**
   * Get purpose ID based on travel purpose
   * Uses TDAC session manager for dynamic ID retrieval
   * @param purpose - Travel purpose string
   * @returns TDAC encoded purpose ID
   */
  static getPurposeId(purpose?: string): string {
    if (!purpose) {
      return '';
    }

    // Normalize purpose using centralized config
    const normalizedPurpose = normalizeTravelPurpose(purpose);

    // Use session manager to get encrypted ID
    try {
      return tdacSessionManager.getPurposeId(normalizedPurpose);
    } catch (error) {
      logger.error('Error getting purpose ID from session manager', error instanceof Error ? error : new Error(String(error)), { purpose });
      return '';
    }
  }

  /**
   * Get nationality ID based on nationality code
   * Uses TDAC session manager for dynamic ID retrieval
   * @param nationality - Nationality code (CHN, USA, etc.)
   * @returns TDAC encoded nationality ID
   */
  static getNationalityId(nationality?: string): string {
    if (!nationality) {
      return '';
    }

    const normalizedNationality = nationality.toUpperCase().trim();

    // Use session manager to get encrypted ID
    // Returns empty string if nationality not in fallback list
    try {
      return tdacSessionManager.getNationalityId(normalizedNationality);
    } catch (error) {
      logger.error('Error getting nationality ID from session manager', error instanceof Error ? error : new Error(String(error)), { nationality });
      return '';
    }
  }

  /**
   * Get travel info with multiple fallback attempts
   * @param userId - User ID
   * @returns Promise resolving to travel info or null
   */
  static async getTravelInfoWithFallback(userId: UserId): Promise<TravelInfoData | null> {
    logger.debug('Starting getTravelInfoWithFallback', { userId });
    
    // Import UserDataService dynamically
    const UserDataService = require('../data/UserDataService').default;
    
    // Based on database analysis, data is stored with destination='th'
    // Try the most likely destination IDs first
    const destinationIds: (string | null)[] = [
      'th',        // Confirmed from database - this should work
      null         // Try without destination parameter as final fallback
    ];
    
    for (const destinationId of destinationIds) {
      try {
        const destinationStr = destinationId === null ? 'null' : destinationId;
        logger.debug('Trying to get travel info with destination', { userId, destinationStr, destinationId });
        
        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
        
        if (travelInfo && typeof travelInfo === 'object') {
          logger.debug('Found travel info with destination', { 
            userId, 
            destinationStr, 
            keyFields: {
              arrivalArrivalDate: travelInfo.arrivalArrivalDate,
              arrivalFlightNumber: travelInfo.arrivalFlightNumber,
              departureDepartureDate: travelInfo.departureDepartureDate,
              departureFlightNumber: travelInfo.departureFlightNumber,
              accommodationType: travelInfo.accommodationType,
              province: travelInfo.province,
              hotelAddress: travelInfo.hotelAddress
            }
          });
          
          // Validate that we have the essential fields
          if (travelInfo.arrivalArrivalDate && travelInfo.arrivalFlightNumber) {
            logger.debug('Travel info has required fields - returning data', { userId, destinationStr });
            return travelInfo as TravelInfoData;
          } else {
            logger.debug('Travel info missing essential fields, continuing search...', { userId, destinationStr });
          }
        } else {
          logger.debug('No travel info found for destination', { userId, destinationStr, returned: travelInfo });
        }
      } catch (error) {
        const destinationStr = destinationId === null ? 'null' : destinationId;
        logger.warn('Failed to get travel info with destination', error instanceof Error ? error : new Error(String(error)), { userId, destinationStr });
      }
    }
    
    logger.warn('No valid travel info found with any method - this will cause validation to fail', { userId });
    return null;
  }

  /**
   * Get traveler context with error handling and fallbacks
   * @param userId - User ID
   * @returns Promise resolving to traveler context with success/error status
   */
  static async buildThailandTravelerContext(userId: UserId): Promise<BuildContextResult> {
    return await ThailandTravelerContextBuilder.buildContext(userId);
  }
}

export default ThailandTravelerContextBuilder;

