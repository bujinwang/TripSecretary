/**
 * Thailand Data Validator Service
 * Provides validation logic for Thailand-specific data requirements
 * Validates passport, personal info, travel info, and fund data for TDAC submission
 */

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
  occupation?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: unknown;
}

interface TravelInfoData {
  arrivalFlightNumber?: string;
  arrivalDepartureAirport?: string;
  arrivalArrivalAirport?: string;
  arrivalDepartureDate?: string;
  arrivalArrivalDate?: string;
  departureFlightNumber?: string;
  departureDepartureAirport?: string;
  departureArrivalAirport?: string;
  departureDepartureDate?: string;
  departureArrivalDate?: string;
  hotelName?: string;
  hotelAddress?: string;
  province?: string;
  [key: string]: unknown;
}

interface FundItemData {
  type?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

interface FieldStatus {
  [key: string]: boolean;
}

interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  errors: string[];
  fieldCount: {
    filled: number;
    total: number;
  };
}

interface CompleteValidationResult {
  isValid: boolean;
  isComplete: boolean;
  errors: string[];
  categories: {
    passport: ValidationResult;
    personalInfo: ValidationResult;
    travelInfo: ValidationResult;
    fundItems: ValidationResult;
  };
}

interface SubmissionWindowResult {
  isWithin72Hours: boolean;
  canSubmit: boolean;
  hoursRemaining: number | null;
  message: string;
}

class ThailandDataValidator {
  /**
   * Validate passport data for Thailand entry
   * @param {Object} passport - Passport data object
   * @returns {Object} - Validation result with completion status
   */
  static validatePassportData(passport: PassportData | null | undefined): ValidationResult {
    const errors: string[] = [];
    // Thailand TDAC requires: passport number, full name, nationality, date of birth, expiry date
    const requiredFields: Array<keyof PassportData> = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const fieldStatus: FieldStatus = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = passport?.[field];
      const hasValue = passport && value && String(value).trim().length > 0;
      fieldStatus[field] = hasValue;
      
      if (!hasValue) {
        errors.push(`护照${this.getFieldDisplayName(field)}为必填项`);
      }
    });

    // Format validations
    if (passport) {
      // Passport number format validation
      if (passport.passportNumber && !this.isValidPassportNumber(passport.passportNumber)) {
        errors.push('护照号码格式无效');
        fieldStatus.passportNumber = false;
      }

      // Date validations
      if (passport.dateOfBirth && !this.isValidDate(passport.dateOfBirth)) {
        errors.push('出生日期格式无效');
        fieldStatus.dateOfBirth = false;
      }

      if (passport.expiryDate && !this.isValidDate(passport.expiryDate)) {
        errors.push('护照有效期格式无效');
        fieldStatus.expiryDate = false;
      }

      // Check if passport is expired
      if (passport.expiryDate && this.isValidDate(passport.expiryDate)) {
        const expiryDate = new Date(passport.expiryDate);
        const now = new Date();
        if (expiryDate <= now) {
          errors.push('护照已过期');
          fieldStatus.expiryDate = false;
        }
      }

      // Check if passport expires within 6 months (Thailand requirement)
      if (passport.expiryDate && this.isValidDate(passport.expiryDate)) {
        const expiryDate = new Date(passport.expiryDate);
        const now = new Date();
        const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
        if (expiryDate <= sixMonthsFromNow && expiryDate > now) {
          errors.push('护照将在6个月内过期，建议更新护照');
        }
      }

      // Gender validation (optional but if provided must be valid)
      if (passport.gender && !['Male', 'Female', 'Undefined'].includes(passport.gender)) {
        errors.push('性别值无效');
      }
    }

    const filledCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalCount = requiredFields.length;

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldCount: {
        filled: filledCount,
        total: totalCount
      }
    };
  }

  /**
   * Validate personal information for Thailand entry
   * @param {Object} personalInfo - Personal info data object
   * @returns {Object} - Validation result with completion status
   */
  static validatePersonalInfo(personalInfo: PersonalInfoData | null | undefined): ValidationResult {
    const errors: string[] = [];
    // Thailand TDAC requires: occupation, phone number, email
    // Note: sex/gender is handled separately in passport validation
    const requiredFields: Array<keyof PersonalInfoData> = ['occupation', 'phoneNumber', 'email'];
    const fieldStatus: FieldStatus = {};

    // Check required fields
    requiredFields.forEach(field => {
      const value = personalInfo?.[field];
      const hasValue = personalInfo && value && String(value).trim().length > 0;
      fieldStatus[field] = hasValue;
      
      if (!hasValue) {
        errors.push(`个人信息${this.getFieldDisplayName(field)}为必填项`);
      }
    });

    // Format validations
    if (personalInfo) {
      // Email validation
      if (personalInfo.email && !this.isValidEmail(personalInfo.email)) {
        errors.push('邮箱格式无效');
        fieldStatus.email = false;
      }

      // Phone validation
      if (personalInfo.phoneNumber && !this.isValidPhoneNumber(personalInfo.phoneNumber)) {
        errors.push('电话号码格式无效');
        fieldStatus.phoneNumber = false;
      }

      // Occupation validation
      if (personalInfo.occupation && personalInfo.occupation.trim().length < 2) {
        errors.push('职业信息至少需要2个字符');
        fieldStatus.occupation = false;
      }

      // Additional Thailand-specific validations
      if (personalInfo.occupation && personalInfo.occupation.trim().length > 50) {
        errors.push('职业信息不能超过50个字符');
        fieldStatus.occupation = false;
      }
    }

    const filledCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalCount = requiredFields.length;

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldCount: {
        filled: filledCount,
        total: totalCount
      }
    };
  }

  /**
   * Validate travel information for Thailand entry
   * @param {Object} travelInfo - Travel info data object
   * @returns {Object} - Validation result with completion status
   */
  static validateTravelInfo(travelInfo: TravelInfoData | null | undefined): ValidationResult {
    const errors: string[] = [];
    // Thailand TDAC requires comprehensive flight and accommodation information
    const requiredFields: Array<keyof TravelInfoData> = [
      'arrivalFlightNumber', 'arrivalDepartureAirport', 'arrivalArrivalAirport',
      'arrivalDepartureDate', 'arrivalArrivalDate',
      'departureFlightNumber', 'departureDepartureAirport', 'departureArrivalAirport',
      'departureDepartureDate', 'departureArrivalDate',
      'hotelName', 'hotelAddress'
    ];
    const fieldStatus: FieldStatus = {};

    // Check required fields
    requiredFields.forEach(field => {
      const value = travelInfo?.[field];
      const hasValue = travelInfo && value && String(value).trim().length > 0;
      fieldStatus[field] = hasValue;
      
      if (!hasValue) {
        errors.push(`旅行信息${this.getFieldDisplayName(field)}为必填项`);
      }
    });

    // Format validations
    if (travelInfo) {
      // Flight number validations
      if (travelInfo.arrivalFlightNumber && !this.isValidFlightNumber(travelInfo.arrivalFlightNumber)) {
        errors.push('入境航班号格式无效');
        fieldStatus.arrivalFlightNumber = false;
      }

      if (travelInfo.departureFlightNumber && !this.isValidFlightNumber(travelInfo.departureFlightNumber)) {
        errors.push('离境航班号格式无效');
        fieldStatus.departureFlightNumber = false;
      }

      // Date validations
      const dateFields: Array<{ field: keyof TravelInfoData; name: string }> = [
        { field: 'arrivalDepartureDate', name: '入境起飞日期' },
        { field: 'arrivalArrivalDate', name: '入境到达日期' },
        { field: 'departureDepartureDate', name: '离境起飞日期' },
        { field: 'departureArrivalDate', name: '离境到达日期' }
      ];
      
      dateFields.forEach(({ field, name }) => {
        const value = travelInfo[field];
        if (value && !this.isValidDate(String(value))) {
          errors.push(`${name}格式无效`);
          fieldStatus[field] = false;
        }
      });

      // Business logic validations
      if (travelInfo.arrivalArrivalDate && travelInfo.departureArrivalDate) {
        const arrivalDate = new Date(travelInfo.arrivalArrivalDate);
        const departureDate = new Date(travelInfo.departureArrivalDate);
        
        if (departureDate <= arrivalDate) {
          errors.push('离境日期必须晚于入境日期');
        }
      }

      // Check arrival date is in the future (must be at least tomorrow)
      if (travelInfo.arrivalArrivalDate && this.isValidDate(travelInfo.arrivalArrivalDate)) {
        const arrivalDate = new Date(travelInfo.arrivalArrivalDate);
        arrivalDate.setHours(0, 0, 0, 0); // Normalize to start of day

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        // Arrival must be at least tomorrow (not today)
        if (arrivalDate <= today) {
          errors.push('入境日期必须是明天或之后的日期');
          fieldStatus.arrivalArrivalDate = false;
        }
      }

      // Hotel/accommodation validations
      if (travelInfo.hotelName && travelInfo.hotelName.trim().length < 2) {
        errors.push('住宿名称至少需要2个字符');
        fieldStatus.hotelName = false;
      }

      if (travelInfo.hotelAddress && travelInfo.hotelAddress.trim().length < 10) {
        errors.push('住宿地址至少需要10个字符');
        fieldStatus.hotelAddress = false;
      }

      // Province validation (Thailand-specific requirement)
      if (travelInfo.province && travelInfo.province.trim().length === 0) {
        errors.push('省份信息为必填项');
        fieldStatus.province = false;
      }
    }

    const filledCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalCount = requiredFields.length;

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldCount: {
        filled: filledCount,
        total: totalCount
      }
    };
  }

  /**
   * Validate fund items for Thailand entry
   * @param {Array} fundItems - Array of fund item objects
   * @returns {Object} - Validation result with completion status
   */
  static validateFundItems(fundItems: FundItemData[] | null | undefined): ValidationResult {
    const errors: string[] = [];
    
    if (!fundItems || !Array.isArray(fundItems) || fundItems.length === 0) {
      return {
        isValid: false,
        isComplete: false,
        errors: ['至少需要一项资金证明'],
        fieldCount: {
          filled: 0,
          total: 1
        }
      };
    }

    let validItemCount = 0;
    
    fundItems.forEach((item, index) => {
      if (!item.type) {
        errors.push(`资金证明 ${index + 1}: 类型为必填项`);
      } else {
        const validTypes = ['credit_card', 'cash', 'bank_balance', 'investment', 'other'];
        if (!validTypes.includes(item.type)) {
          errors.push(`资金证明 ${index + 1}: 类型无效`);
        } else {
          validItemCount++;
        }
      }

      // Amount validation (optional but if provided must be valid)
      if (item.amount !== null && item.amount !== undefined) {
        if (typeof item.amount !== 'number' || item.amount <= 0) {
          errors.push(`资金证明 ${index + 1}: 金额必须是正数`);
        } else {
          // Thailand minimum fund requirement check (20,000 THB equivalent)
          const minAmount = this.getMinimumFundAmount(item.currency || 'THB');
          if (item.amount < minAmount) {
            errors.push(`资金证明 ${index + 1}: 金额低于泰国入境最低要求`);
          }
        }
      }

      // Currency validation
      if (item.currency && !this.isValidCurrency(item.currency)) {
        errors.push(`资金证明 ${index + 1}: 货币代码无效`);
      }
    });

    return {
      isValid: errors.length === 0,
      isComplete: validItemCount > 0,
      errors,
      fieldCount: {
        filled: validItemCount,
        total: 1 // At least 1 valid fund item required
      }
    };
  }

  /**
   * Validate complete data set for Thailand entry
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete validation result
   */
  static async validateComplete(userId: UserId): Promise<CompleteValidationResult> {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;
      
      // Get all data for Thailand destination
      const [passport, personalInfo, travelInfo, fundItems] = await Promise.all([
        UserDataService.getPassport(userId),
        UserDataService.getPersonalInfo(userId),
        UserDataService.getTravelInfo(userId, 'thailand'), // Thailand-specific destination
        UserDataService.getFundItems(userId)
      ]);

      // Validate each category
      const passportValidation = this.validatePassportData(passport);
      const personalInfoValidation = this.validatePersonalInfo(personalInfo);
      const travelInfoValidation = this.validateTravelInfo(travelInfo);
      const fundItemsValidation = this.validateFundItems(fundItems);

      // Combine results
      const allErrors = [
        ...passportValidation.errors,
        ...personalInfoValidation.errors,
        ...travelInfoValidation.errors,
        ...fundItemsValidation.errors
      ];

      const allComplete = passportValidation.isComplete && 
                         personalInfoValidation.isComplete && 
                         travelInfoValidation.isComplete && 
                         fundItemsValidation.isComplete;

      const allValid = passportValidation.isValid && 
                      personalInfoValidation.isValid && 
                      travelInfoValidation.isValid && 
                      fundItemsValidation.isValid;

      return {
        isValid: allValid,
        isComplete: allComplete,
        errors: allErrors,
        categories: {
          passport: passportValidation,
          personalInfo: personalInfoValidation,
          travelInfo: travelInfoValidation,
          fundItems: fundItemsValidation
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to validate complete Thailand data:', errorMessage);
      return {
        isValid: false,
        isComplete: false,
        errors: ['数据加载失败，无法进行验证'],
        categories: {
          passport: { isValid: false, isComplete: false, errors: ['护照数据加载失败'], fieldCount: { filled: 0, total: 5 } },
          personalInfo: { isValid: false, isComplete: false, errors: ['个人信息加载失败'], fieldCount: { filled: 0, total: 3 } },
          travelInfo: { isValid: false, isComplete: false, errors: ['旅行信息加载失败'], fieldCount: { filled: 0, total: 12 } },
          fundItems: { isValid: false, isComplete: false, errors: ['资金证明加载失败'], fieldCount: { filled: 0, total: 1 } }
        }
      };
    }
  }

  // Helper validation methods

  /**
   * Validate passport number format
   * @param {string} passportNumber - Passport number
   * @returns {boolean} - Is valid format
   */
  static isValidPassportNumber(passportNumber: string | undefined): boolean {
    if (!passportNumber) {
      return false;
    }
    const cleaned = passportNumber.replace(/\s/g, '');
    const passportRegex = /^[A-Z0-9]{6,12}$/i;
    return passportRegex.test(cleaned);
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

  /**
   * Validate phone number format
   * @param {string} phone - Phone number
   * @returns {boolean} - Is valid phone
   */
  static isValidPhoneNumber(phone: string | undefined): boolean {
    if (!phone) {
      return false;
    }
    const cleanPhone = phone.replace(/[^\d+\s-()]/g, '');
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(cleanPhone) && cleanPhone.replace(/\D/g, '').length >= 7;
  }

  /**
   * Validate flight number format
   * @param {string} flightNumber - Flight number
   * @returns {boolean} - Is valid format
   */
  static isValidFlightNumber(flightNumber: string | undefined): boolean {
    if (!flightNumber) {
      return false;
    }
    const cleaned = flightNumber.replace(/\s/g, '');
    const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i;
    return flightRegex.test(cleaned);
  }

  /**
   * Get field display name in Chinese for error messages
   * @param {string} fieldName - Field name
   * @returns {string} - Display name in Chinese
   */
  static getFieldDisplayName(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      // Passport fields
      'passportNumber': '号码',
      'fullName': '姓名',
      'nationality': '国籍',
      'dateOfBirth': '出生日期',
      'expiryDate': '有效期',
      
      // Personal info fields
      'occupation': '职业',
      'phoneNumber': '电话号码',
      'email': '邮箱',
      
      // Travel info fields
      'arrivalFlightNumber': '入境航班号',
      'arrivalDepartureAirport': '入境起飞机场',
      'arrivalArrivalAirport': '入境到达机场',
      'arrivalDepartureDate': '入境起飞日期',
      'arrivalArrivalDate': '入境到达日期',
      'departureFlightNumber': '离境航班号',
      'departureDepartureAirport': '离境起飞机场',
      'departureArrivalAirport': '离境到达机场',
      'departureDepartureDate': '离境起飞日期',
      'departureArrivalDate': '离境到达日期',
      'hotelName': '住宿名称',
      'hotelAddress': '住宿地址'
    };
    
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Get minimum fund amount based on currency
   * Thailand requires 20,000 THB equivalent for tourists
   * @param {string} currency - Currency code
   * @returns {number} - Minimum amount in that currency
   */
  static getMinimumFundAmount(currency: string): number {
    // Approximate exchange rates (should be updated regularly)
    const minimumAmounts: Record<string, number> = {
      'THB': 20000,
      'USD': 600,
      'EUR': 550,
      'CNY': 4000,
      'JPY': 80000,
      'GBP': 480,
      'AUD': 850,
      'CAD': 800,
      'SGD': 800,
      'HKD': 4700,
      'MYR': 2500
    };
    
    return minimumAmounts[currency] || minimumAmounts['THB'];
  }

  /**
   * Validate currency code
   * @param {string} currency - Currency code
   * @returns {boolean} - Is valid currency
   */
  static isValidCurrency(currency: string | undefined): boolean {
    if (!currency) {
      return false;
    }
    const validCurrencies = [
      'THB', 'USD', 'EUR', 'CNY', 'JPY', 'GBP', 'AUD', 'CAD', 
      'SGD', 'HKD', 'MYR', 'KRW', 'TWD', 'INR', 'PHP'
    ];
    
    return validCurrencies.includes(currency);
  }

  /**
   * Check if arrival date is within 72-hour submission window
   * @param {string} arrivalDate - Arrival date (YYYY-MM-DD)
   * @returns {Object} - Window status information
   */
  static checkSubmissionWindow(arrivalDate: string | undefined): SubmissionWindowResult {
    if (!arrivalDate || !this.isValidDate(arrivalDate)) {
      return {
        isWithin72Hours: false,
        canSubmit: false,
        hoursRemaining: null,
        message: '入境日期无效'
      };
    }

    const arrival = new Date(arrivalDate);
    const now = new Date();
    const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilArrival <= 0) {
      return {
        isWithin72Hours: false,
        canSubmit: false,
        hoursRemaining: 0,
        message: '入境日期已过'
      };
    }

    if (hoursUntilArrival <= 72) {
      return {
        isWithin72Hours: true,
        canSubmit: true,
        hoursRemaining: Math.ceil(hoursUntilArrival),
        message: '可以提交TDAC'
      };
    }

    return {
      isWithin72Hours: false,
      canSubmit: false,
      hoursRemaining: Math.ceil(hoursUntilArrival),
      message: `还需等待 ${Math.ceil((hoursUntilArrival - 72) / 24)} 天后可提交`
    };
  }
}

export default ThailandDataValidator;

