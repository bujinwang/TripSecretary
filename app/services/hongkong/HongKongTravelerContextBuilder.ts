/**
 * Hong Kong Traveler Context Builder Service
 * Builds complete traveler payload for Hong Kong entry preparation from UserDataService data
 * Note: As of Oct 2024, Hong Kong eliminated physical arrival cards
 * This service prepares data for immigration officer interviews and visa applications
 */

import type { UserId } from '../../types/data';

// Type definitions
interface PassportData {
  passportNumber?: string;
  fullName?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  [key: string]: unknown;
}

interface PersonalInfoData {
  email?: string;
  phoneNumber?: string;
  phoneCode?: string;
  occupation?: string;
  provinceCity?: string;
  countryRegion?: string;
  [key: string]: unknown;
}

interface TravelInfoData {
  arrivalArrivalDate?: string;
  arrivalFlightNumber?: string;
  departureDepartureDate?: string;
  departureFlightNumber?: string;
  accommodationType?: string;
  province?: string;
  district?: string;
  hotelAddress?: string;
  address?: string;
  travelPurpose?: string;
  [key: string]: unknown;
}

interface FundItemData {
  amount?: number;
  currency?: string;
  type?: string;
  [key: string]: unknown;
}

interface UserData {
  passport?: PassportData | null;
  personalInfo?: PersonalInfoData | null;
  travelInfo?: TravelInfoData | null;
  fundItems?: FundItemData[];
  [key: string]: unknown;
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
  payload: HKPayload | null;
}

interface HKPayload {
  familyName: string;
  firstName: string;
  middleName: string;
  passportNo: string;
  nationality: string;
  birthDate: string;
  occupation: string;
  gender: string;
  countryResidence: string;
  cityResidence: string;
  phoneCode: string;
  phoneNo: string;
  email: string;
  arrivalDate: string;
  departureDate: string | null;
  purpose: string;
  flightNo: string;
  departureFlightNo: string;
  accommodationType: string;
  district: string;
  address: string;
  fundItems: FundItemData[];
  [key: string]: unknown;
}

interface NameInfo {
  familyName: string;
  firstName: string;
  middleName: string;
}

class HongKongTravelerContextBuilder {
  /**
   * Build complete Hong Kong traveler context from user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete traveler payload or validation errors
   */
  static async buildContext(userId: UserId): Promise<BuildContextResult> {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;

      // Retrieve all user data in a single operation for efficiency
      const userData: UserData = await UserDataService.getAllUserData(userId);

      // Get travel info and fund items separately
      const [travelInfo, fundItems] = await Promise.all([
        HongKongTravelerContextBuilder.getTravelInfoWithFallback(userId),
        UserDataService.getFundItems(userId).catch(() => [])
      ]);

      // Add travel info and fund items to user data
      userData.travelInfo = travelInfo;
      userData.fundItems = fundItems;

      // Validate that we have the required data
      const validationResult = HongKongTravelerContextBuilder.validateUserData(userData);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings || [],
          payload: null
        };
      }

      // Transform user data to Hong Kong format
      const hkData = HongKongTravelerContextBuilder.transformToHKFormat(userData);

      // Build complete traveler payload
      const travelerPayload: HKPayload = {
        ...hkData
      };

      return {
        success: true,
        errors: [],
        warnings: validationResult.warnings || [],
        payload: travelerPayload
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [`Failed to build traveler context: ${errorMessage}`],
        warnings: [],
        payload: null
      };
    }
  }

  /**
   * Validate that user data contains ALL required information
   * @param {Object} userData - User data from UserDataService
   * @returns {Object} - Validation result
   */
  static validateUserData(userData: UserData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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
  static transformToHKFormat(userData: UserData): HKPayload {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    // Parse full name into components
    const nameInfo = HongKongTravelerContextBuilder.parseFullName(passport?.fullName || '');

    // Transform to HK format
    const hkData: HKPayload = {
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

    return hkData;
  }

  /**
   * Parse full name into components
   * @param {string} fullName - Full name string
   * @returns {Object} - Name components
   */
  static parseFullName(fullName: string): NameInfo {
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
  static getCountryFromNationality(nationality: string | undefined): string {
    if (!nationality) {
      return '';
    }

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
   * Get phone code from personal info
   * @param {Object} personalInfo - Personal info object
   * @returns {string} - Phone code (without + prefix)
   */
  static getPhoneCode(personalInfo: PersonalInfoData | null | undefined): string {
    if (!personalInfo) {
      return '';
    }

    if (personalInfo.phoneCode) {
      let phoneCode = String(personalInfo.phoneCode).trim();
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
  static getPhoneNumber(personalInfo: PersonalInfoData | null | undefined): string {
    if (!personalInfo || !personalInfo.phoneNumber) {
      return '';
    }
    return String(personalInfo.phoneNumber).trim();
  }

  /**
   * Format date for HK (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {string} - Formatted date
   */
  static formatDateForHK(dateStr: string | undefined): string {
    if (!dateStr) {
      return '';
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to format date:', errorMessage);
      return '';
    }
  }

  /**
   * Get travel info with multiple fallback attempts
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Travel info or null
   */
  static async getTravelInfoWithFallback(userId: UserId): Promise<TravelInfoData | null> {
    const UserDataService = require('../data/UserDataService').default;

    // Try different destination IDs
    const destinationIds: (string | null)[] = [
      'hk',        // Primary Hong Kong ID
      'hongkong',  // Fallback
      null         // Try without destination parameter
    ];

    for (const destinationId of destinationIds) {
      try {
        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        if (travelInfo && typeof travelInfo === 'object') {
          // Validate essential fields
          if (travelInfo.arrivalArrivalDate && travelInfo.arrivalFlightNumber) {
            return travelInfo as TravelInfoData;
          }
        }
      } catch (error: unknown) {
        // Continue to next destination ID
        continue;
      }
    }

    return null;
  }

  /**
   * Get traveler context with error handling and fallbacks
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Traveler context with success/error status
   */
  static async buildHongKongTravelerContext(userId: UserId): Promise<BuildContextResult> {
    return await HongKongTravelerContextBuilder.buildContext(userId);
  }
}

export default HongKongTravelerContextBuilder;

