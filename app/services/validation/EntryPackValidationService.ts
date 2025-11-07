/**
 * Entry Pack Validation Service
 *
 * Validates entry pack data for completeness and correctness
 * Supports bilingual error messages (English/Thai for Thailand, other languages for other countries)
 *
 * Usage:
 *   const validation = EntryPackValidationService.validateEntryPack(entryPackData, 'th');
 *   console.log(validation.isComplete); // true/false
 *   console.log(validation.sections); // { tdac: { isComplete, missingFields }, ... }
 */

// Type definitions
interface TDACSubmission {
  arrCardNo?: string;
  mdacNumber?: string;
  entryPermitNumber?: string;
  sgacNumber?: string;
  entryCardNumber?: string;
  i94Number?: string;
  [key: string]: unknown;
}

interface PersonalInfo {
  fullName?: string;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  [key: string]: unknown;
}

interface TravelInfo {
  arrivalDate?: string;
  flightNumber?: string;
  hotelAddress?: string;
  province?: string;
  district?: string;
  state?: string;
  [key: string]: unknown;
}

interface FundItem {
  type?: string;
  amount?: number;
  [key: string]: unknown;
}

interface EntryPack {
  tdacSubmission?: TDACSubmission;
  personalInfo?: PersonalInfo;
  passport?: PersonalInfo;
  travel?: TravelInfo;
  funds?: FundItem[];
  [key: string]: unknown;
}

interface SectionValidation {
  isComplete: boolean;
  missingFields: string[];
}

interface MissingField {
  section: string;
  field: string;
  message: string;
}

interface ValidationResult {
  isComplete: boolean;
  completedSections: number;
  totalSections: number;
  sections: {
    tdac: SectionValidation;
    personal: SectionValidation;
    travel: SectionValidation;
    funds: SectionValidation;
  };
  missingFields: MissingField[];
  errors: string[];
}

type CountryCode = 'th' | 'my' | 'hk' | 'sg' | 'tw' | 'us' | string;
type CountryName = 'thailand' | 'malaysia' | 'hongkong' | 'singapore' | 'taiwan' | 'usa' | string;

class EntryPackValidationService {
  /**
   * Validate complete entry pack
   * @param {Object} entryPack - Entry pack data object
   * @param {string} country - Country code (ISO 3166-1 alpha-2, e.g., 'th', 'my', 'hk')
   * @returns {Object} Validation result
   */
  static validateEntryPack(entryPack: EntryPack | null | undefined, country: CountryCode = 'th'): ValidationResult {
    if (!entryPack) {
      return {
        isComplete: false,
        completedSections: 0,
        totalSections: 4,
        sections: {
          tdac: { isComplete: false, missingFields: ['all'] },
          personal: { isComplete: false, missingFields: ['all'] },
          travel: { isComplete: false, missingFields: ['all'] },
          funds: { isComplete: false, missingFields: ['all'] }
        },
        missingFields: [],
        errors: []
      };
    }

    const sections = {
      tdac: this.validateTDACSection(entryPack.tdacSubmission, country),
      personal: this.validatePersonalSection(entryPack.personalInfo || entryPack.passport, country),
      travel: this.validateTravelSection(entryPack.travel, country),
      funds: this.validateFundsSection(entryPack.funds, country)
    };

    const completedSections = Object.values(sections).filter(s => s.isComplete).length;
    const totalSections = 4;
    const isComplete = completedSections === totalSections;

    // Collect all missing fields
    const missingFields: MissingField[] = [];
    Object.entries(sections).forEach(([sectionKey, section]) => {
      if (!section.isComplete && section.missingFields.length > 0) {
        section.missingFields.forEach(field => {
          missingFields.push({
            section: sectionKey,
            field: field,
            message: this.getFieldLabel(sectionKey, field, country)
          });
        });
      }
    });

    return {
      isComplete,
      completedSections,
      totalSections,
      sections,
      missingFields,
      errors: []
    };
  }

  /**
   * Validate TDAC/Entry Card section
   */
  static validateTDACSection(tdacSubmission: TDACSubmission | null | undefined, country: CountryCode): SectionValidation {
    const missingFields: string[] = [];

    if (!tdacSubmission) {
      return {
        isComplete: false,
        missingFields: ['tdacSubmission']
      };
    }

    // Check required fields based on country
    const requiredFields = this.getRequiredTDACFields(country);

    requiredFields.forEach(field => {
      const value = tdacSubmission[field];
      if (!value || (typeof value === 'string' && value === '')) {
        missingFields.push(field);
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validate Personal Information section
   */
  static validatePersonalSection(personalInfo: PersonalInfo | null | undefined, country: CountryCode): SectionValidation {
    const missingFields: string[] = [];

    if (!personalInfo) {
      return {
        isComplete: false,
        missingFields: ['personalInfo']
      };
    }

    const requiredFields: Array<keyof PersonalInfo> = ['fullName', 'passportNumber', 'nationality', 'dateOfBirth'];

    requiredFields.forEach(field => {
      const value = personalInfo[field];
      if (!value || (typeof value === 'string' && value === '')) {
        missingFields.push(String(field));
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validate Travel Information section
   */
  static validateTravelSection(travelInfo: TravelInfo | null | undefined, country: CountryCode): SectionValidation {
    const missingFields: string[] = [];

    if (!travelInfo) {
      return {
        isComplete: false,
        missingFields: ['travelInfo']
      };
    }

    // Required fields vary by country
    const requiredFields = this.getRequiredTravelFields(country);

    requiredFields.forEach(field => {
      const value = travelInfo[field];
      if (!value || (typeof value === 'string' && value === '')) {
        missingFields.push(field);
      }
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validate Funds section
   */
  static validateFundsSection(funds: FundItem[] | null | undefined, country: CountryCode): SectionValidation {
    const missingFields: string[] = [];

    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return {
        isComplete: false,
        missingFields: ['funds']
      };
    }

    // At least one fund entry required
    // Each fund should have type and amount
    const invalidFunds = funds.filter(fund => {
      return !fund.type || !fund.amount || fund.amount <= 0;
    });

    if (invalidFunds.length > 0) {
      missingFields.push('validFundEntries');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Get required TDAC fields by country
   */
  static getRequiredTDACFields(country: CountryCode): string[] {
    const countryName = this.normalizeCountryName(country);
    const fieldsByCountry: Record<CountryName, string[]> = {
      thailand: ['arrCardNo'],
      malaysia: ['mdacNumber'],
      hongkong: ['entryPermitNumber'],
      singapore: ['sgacNumber'],
      taiwan: ['entryCardNumber'],
      usa: ['i94Number']
    };

    return fieldsByCountry[countryName] || ['arrCardNo'];
  }

  /**
   * Get required travel fields by country
   */
  static getRequiredTravelFields(country: CountryCode): string[] {
    const baseFields = ['arrivalDate', 'flightNumber', 'hotelAddress'];
    const countryName = this.normalizeCountryName(country);

    const countrySpecificFields: Record<CountryName, string[]> = {
      thailand: [...baseFields, 'province'],
      hongkong: [...baseFields, 'district'],
      malaysia: [...baseFields, 'state'],
      singapore: baseFields,
      taiwan: baseFields,
      usa: baseFields
    };

    return countrySpecificFields[countryName] || baseFields;
  }

  /**
   * Normalize country code to country name
   */
  static normalizeCountryName(country: CountryCode): CountryName {
    const mapping: Record<string, CountryName> = {
      'th': 'thailand',
      'my': 'malaysia',
      'hk': 'hongkong',
      'sg': 'singapore',
      'tw': 'taiwan',
      'us': 'usa'
    };
    return mapping[country.toLowerCase()] || 'thailand';
  }

  /**
   * Get user-friendly field label (bilingual)
   */
  static getFieldLabel(section: string, field: string, country: CountryCode): string {
    const countryName = this.normalizeCountryName(country);
    
    const labels: Record<CountryName, Record<string, Record<string, string>>> = {
      thailand: {
        tdac: {
          tdacSubmission: 'บัตร TDAC / TDAC Card',
          arrCardNo: 'หมายเลข TDAC / TDAC Number'
        },
        personal: {
          personalInfo: 'ข้อมูลส่วนบุคคล / Personal Information',
          fullName: 'ชื่อเต็ม / Full Name',
          passportNumber: 'หมายเลขหนังสือเดินทาง / Passport Number',
          nationality: 'สัญชาติ / Nationality',
          dateOfBirth: 'วันเกิด / Date of Birth'
        },
        travel: {
          travelInfo: 'ข้อมูลการเดินทาง / Travel Information',
          arrivalDate: 'วันเข้าประเทศ / Arrival Date',
          flightNumber: 'เที่ยวบิน / Flight Number',
          hotelAddress: 'ที่อยู่ที่พัก / Hotel Address',
          province: 'จังหวัด / Province'
        },
        funds: {
          funds: 'ข้อมูลเงินพกพา / Funds Information',
          validFundEntries: 'รายการเงินทุนที่ถูกต้อง / Valid Fund Entries'
        }
      },
      malaysia: {
        tdac: {
          tdacSubmission: 'MDAC Entry / MDAC',
          mdacNumber: 'MDAC Number'
        },
        personal: {
          personalInfo: 'Personal Information / Maklumat Peribadi',
          fullName: 'Full Name / Nama Penuh',
          passportNumber: 'Passport Number / Nombor Pasport',
          nationality: 'Nationality / Warganegara',
          dateOfBirth: 'Date of Birth / Tarikh Lahir'
        },
        travel: {
          travelInfo: 'Travel Information / Maklumat Perjalanan',
          arrivalDate: 'Arrival Date / Tarikh Ketibaan',
          flightNumber: 'Flight Number / Nombor Penerbangan',
          hotelAddress: 'Hotel Address / Alamat Hotel',
          state: 'State / Negeri'
        },
        funds: {
          funds: 'Funds Information / Maklumat Kewangan',
          validFundEntries: 'Valid Fund Entries / Entri Dana Sah'
        }
      },
      hongkong: {
        tdac: {},
        personal: {},
        travel: {},
        funds: {}
      },
      singapore: {
        tdac: {},
        personal: {},
        travel: {},
        funds: {}
      },
      taiwan: {
        tdac: {},
        personal: {},
        travel: {},
        funds: {}
      },
      usa: {
        tdac: {},
        personal: {},
        travel: {},
        funds: {}
      }
    };

    const countryLabels = labels[countryName] || labels.thailand;
    return countryLabels[section]?.[field] || field;
  }

  /**
   * Get validation summary message
   */
  static getValidationSummary(validation: ValidationResult, country: CountryCode = 'th'): string {
    if (validation.isComplete) {
      return country === 'th'
        ? 'ข้อมูลครบถ้วน พร้อมส่ง / All information complete. Ready to submit!'
        : 'All information complete. Ready to submit!';
    }

    const countryName = this.normalizeCountryName(country);
    const messages: Record<CountryName, string> = {
      thailand: `ยังขาดข้อมูล ${validation.missingFields.length} รายการ / Missing ${validation.missingFields.length} required fields`,
      malaysia: `Missing ${validation.missingFields.length} required fields`,
      hongkong: `缺少 ${validation.missingFields.length} 個必填項目 / Missing ${validation.missingFields.length} required fields`,
      singapore: `Missing ${validation.missingFields.length} required fields`,
      taiwan: `缺少 ${validation.missingFields.length} 個必填項目 / Missing ${validation.missingFields.length} required fields`,
      usa: `Missing ${validation.missingFields.length} required fields`
    };

    return messages[countryName] || messages.thailand;
  }

  /**
   * Get section display name
   */
  static getSectionDisplayName(sectionKey: string, country: CountryCode = 'th'): string {
    const names: Record<string, Record<string, string>> = {
      th: {
        tdac: 'ปัตร TDAC / TDAC Card',
        personal: 'ข้อมูลส่วนตัว / Personal Information',
        travel: 'ข้อมูลการเดินทาง / Travel Details',
        funds: 'เงินทุน / Proof of Funds'
      },
      my: {
        tdac: 'MDAC Card',
        personal: 'Personal Information',
        travel: 'Travel Details',
        funds: 'Proof of Funds'
      },
      hk: {
        tdac: '入境資料 / Entry Information',
        personal: '個人資料 / Personal Information',
        travel: '旅行資料 / Travel Details',
        funds: '資金證明 / Proof of Funds'
      }
    };

    return names[country]?.[sectionKey] || names.th?.[sectionKey] || sectionKey;
  }
}

export default EntryPackValidationService;

