/**
 * Japan Traveler Context Builder Service
 * Builds complete traveler payload for Japan manual entry guide from UserDataService data
 * Formats data specifically for Japan's manual arrival card completion
 */
import JapanFormHelper from '../../utils/japan/JapanFormHelper';
import type { UserId } from '../../types/data';

// Type definitions
interface PassportData {
  passportNumber?: string;
  fullName?: string;
  nationality?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  gender?: string;
  [key: string]: unknown;
}

interface PersonalInfoData {
  email?: string;
  phoneNumber?: string;
  occupation?: string;
  provinceCity?: string;
  countryRegion?: string;
  [key: string]: unknown;
}

interface TravelInfoData {
  arrivalDate?: string;
  arrivalArrivalDate?: string;
  arrival_date?: string;
  entryDate?: string;
  arrivalFlightNumber?: string;
  arrivalFlightNo?: string;
  flightNumber?: string;
  flightNo?: string;
  lengthOfStay?: string;
  stayDuration?: string;
  durationOfStay?: string;
  daysOfStay?: string;
  accommodationAddress?: string;
  hotelAddress?: string;
  address?: string;
  destinationAddress?: string;
  accommodationPhone?: string;
  contactPhone?: string;
  hotelPhone?: string;
  phoneNumber?: string;
  travelPurpose?: string;
  customTravelPurpose?: string;
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
}

interface BuildContextResult {
  success: boolean;
  errors: string[];
  payload: JapanPayload | null;
}

interface JapanPayload {
  passportNo: string;
  fullName: string;
  familyName: string;
  givenName: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  gender: string;
  occupation: string;
  cityOfResidence: string;
  residentCountry: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  travelPurpose: string;
  customTravelPurpose: string;
  arrivalFlightNumber: string;
  arrivalDate: string;
  lengthOfStay: string;
  accommodationAddress: string;
  accommodationPhone: string;
  fundItems: FundItemData[];
  totalFunds: Record<string, number>;
  destination: string;
  entryType: string;
  generatedAt: string;
  [key: string]: unknown;
}

interface NameInfo {
  familyName: string;
  givenName: string;
}

interface CountryCodePrefix {
  prefix: string[];
  code: string;
}

class JapanTravelerContextBuilder {
  // Constants
  static readonly DEFAULT_COUNTRY_CODE = '86'; // China
  static readonly DEFAULT_COUNTRY = 'China';

  static readonly NATIONALITY_MAP: Record<string, string> = {
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

  static readonly COUNTRY_CODES: Record<string, string> = {
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
  static async buildContext(userId: UserId): Promise<BuildContextResult> {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;

      // Retrieve all user data for Japan destination
      const userData: UserData = await UserDataService.getAllUserData(userId);
      
      // Get Japan-specific travel info
      const japanTravelInfo = await UserDataService.getTravelInfo(userId, 'japan');
      const fallbackTravelInfo = await UserDataService.getTravelInfo(userId).catch(() => null);

      let travelInfoSource: TravelInfoData = {};
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
      } catch (fundError: unknown) {
        const errorMessage = fundError instanceof Error ? fundError.message : 'Unknown error';
        userData.fundItems = [];
      }

      // Validate that we have the required data
      const validationResult = this.validateUserData(userData);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          payload: null
        };
      }

      // Transform user data to Japan format
      const japanData = this.transformToJapanFormat(userData);

      // Final validation of the complete payload
      const payloadValidation = this.validateJapanPayload(japanData);
      if (!payloadValidation.isValid) {
        return {
          success: false,
          errors: payloadValidation.errors,
          payload: japanData
        };
      }

      return {
        success: true,
        errors: [],
        payload: japanData
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [`Failed to build traveler context: ${errorMessage}`],
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
  static validateUserData(userData: UserData): ValidationResult {
    const errors: string[] = [];

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
  static validateJapanPayload(payload: JapanPayload): ValidationResult {
    const errors: string[] = [];
    const normalizedPayload = {
      ...payload,
      ...this.normalizeTravelInfo(payload as unknown as TravelInfoData),
    };

    // Required fields for Japan manual entry
    const requiredFields: Array<keyof JapanPayload> = [
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
      if (!value || String(value).trim().length === 0) {
        errors.push(`Japan field '${String(field)}' is required but missing`);
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
      const days = parseInt(String(normalizedPayload.lengthOfStay), 10);
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
  static isValidDate(dateStr: string | undefined): boolean {
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
   * @param {string} email - Email address
   * @returns {boolean} - Is valid email
   */
  static isValidEmail(email: string | undefined): boolean {
    if (!email) {
      return false;
    }
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
  static transformToJapanFormat(userData: UserData): JapanPayload {
    const { passport, personalInfo, travelInfo, fundItems } = userData;

    // Parse full name into components
    const nameInfo = this.parseFullName(passport?.fullName || '');
    const normalizedTravelInfo = this.normalizeTravelInfo(travelInfo || {});

    // Transform to Japan manual entry format
    const japanData: JapanPayload = {
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
  static normalizeTravelInfo(travelInfo: TravelInfoData | Record<string, unknown> = {}): TravelInfoData {
    if (!travelInfo || typeof travelInfo !== 'object') {
      return {};
    }

    const info = travelInfo as TravelInfoData;

    const arrivalDate =
      info.arrivalDate ||
      info.arrivalArrivalDate ||
      info.arrival_date ||
      info.entryDate ||
      null;

    const arrivalFlightNumber =
      info.arrivalFlightNumber ||
      info.arrivalFlightNo ||
      info.flightNumber ||
      info.flightNo ||
      null;

    const lengthOfStay =
      info.lengthOfStay ||
      info.stayDuration ||
      info.durationOfStay ||
      info.daysOfStay ||
      null;

    const accommodationAddress =
      info.accommodationAddress ||
      info.hotelAddress ||
      info.address ||
      info.destinationAddress ||
      null;

    const accommodationPhone =
      info.accommodationPhone ||
      info.contactPhone ||
      info.hotelPhone ||
      info.phoneNumber ||
      null;

    return {
      ...info,
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
  static parseFullName(fullName: string): NameInfo {
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
  static getCountryFromNationality(nationality: string | undefined): string {
    if (!nationality) {
      return this.DEFAULT_COUNTRY;
    }
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
  static cleanPhoneNumber(phoneNumber: string | undefined): string {
    if (!phoneNumber) {
      return '';
    }
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  /**
   * Parse country code from cleaned phone number
   * @param {string} cleaned - Cleaned phone number
   * @returns {string|null} - Country code or null
   */
  static parseCountryCode(cleaned: string): string | null {
    const codePrefixes: CountryCodePrefix[] = [
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
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract phone code from phone number
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone code
   */
  static extractPhoneCode(phoneNumber: string | undefined): string {
    if (!phoneNumber) {
      return this.DEFAULT_COUNTRY_CODE;
    }

    const cleaned = this.cleanPhoneNumber(phoneNumber);
    const code = this.parseCountryCode(cleaned);

    return code || this.DEFAULT_COUNTRY_CODE;
  }

  /**
   * Extract phone number without country code
   * @param {string} phoneNumber - Full phone number
   * @returns {string} - Phone number without country code
   */
  static extractPhoneNumber(phoneNumber: string | undefined): string {
    if (!phoneNumber) {
      return '';
    }

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
  static formatDateForJapan(dateStr: string | null | undefined): string {
    if (!dateStr) {
      return '';
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to format date:', errorMessage);
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
  static calculateTotalFunds(fundItems: FundItemData[] | undefined): Record<string, number> {
    if (!fundItems || !Array.isArray(fundItems)) {
      return {};
    }

    const totals: Record<string, number> = {};
    
    fundItems.forEach(item => {
      if (item.amount && item.currency) {
        const currency = String(item.currency);
        if (!totals[currency]) {
          totals[currency] = 0;
        }
        totals[currency] += parseFloat(String(item.amount));
      }
    });

    return totals;
  }
}

export default JapanTravelerContextBuilder;

