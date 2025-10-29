/**
 * Entry Pack Validation Service
 *
 * Validates entry pack data for completeness and correctness
 * Supports bilingual error messages (English/Thai for Thailand, other languages for other countries)
 *
 * Usage:
 *   const validation = EntryPackValidationService.validateEntryPack(entryPackData, 'thailand');
 *   console.log(validation.isComplete); // true/false
 *   console.log(validation.sections); // { tdac: { isComplete, missingFields }, ... }
 */

class EntryPackValidationService {
  /**
   * Validate complete entry pack
   * @param {Object} entryPack - Entry pack data object
   * @param {string} country - Country code (thailand, malaysia, hongkong, etc.)
   * @returns {Object} Validation result
   */
  static validateEntryPack(entryPack, country = 'thailand') {
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
    const missingFields = [];
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
  static validateTDACSection(tdacSubmission, country) {
    const missingFields = [];

    if (!tdacSubmission) {
      return {
        isComplete: false,
        missingFields: ['tdacSubmission']
      };
    }

    // Check required fields based on country
    const requiredFields = this.getRequiredTDACFields(country);

    requiredFields.forEach(field => {
      if (!tdacSubmission[field] || tdacSubmission[field] === '') {
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
  static validatePersonalSection(personalInfo, country) {
    const missingFields = [];

    if (!personalInfo) {
      return {
        isComplete: false,
        missingFields: ['personalInfo']
      };
    }

    const requiredFields = ['fullName', 'passportNumber', 'nationality', 'dateOfBirth'];

    requiredFields.forEach(field => {
      if (!personalInfo[field] || personalInfo[field] === '') {
        missingFields.push(field);
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
  static validateTravelSection(travelInfo, country) {
    const missingFields = [];

    if (!travelInfo) {
      return {
        isComplete: false,
        missingFields: ['travelInfo']
      };
    }

    // Required fields vary by country
    const requiredFields = this.getRequiredTravelFields(country);

    requiredFields.forEach(field => {
      if (!travelInfo[field] || travelInfo[field] === '') {
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
  static validateFundsSection(funds, country) {
    const missingFields = [];

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
  static getRequiredTDACFields(country) {
    const fieldsByCountry = {
      thailand: ['arrCardNo'],
      malaysia: ['mdacNumber'],
      hongkong: ['entryPermitNumber'],
      singapore: ['sgacNumber'],
      taiwan: ['entryCardNumber'],
      usa: ['i94Number']
    };

    return fieldsByCountry[country] || ['arrCardNo'];
  }

  /**
   * Get required travel fields by country
   */
  static getRequiredTravelFields(country) {
    const baseFields = ['arrivalDate', 'flightNumber', 'hotelAddress'];

    const countrySpecificFields = {
      thailand: [...baseFields, 'province'],
      hongkong: [...baseFields, 'district'],
      malaysia: [...baseFields, 'state'],
      singapore: baseFields,
      taiwan: baseFields,
      usa: baseFields
    };

    return countrySpecificFields[country] || baseFields;
  }

  /**
   * Get user-friendly field label (bilingual)
   */
  static getFieldLabel(section, field, country) {
    const labels = {
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
      // Add other countries as needed
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
      }
    };

    const countryLabels = labels[country] || labels.thailand;
    return countryLabels[section]?.[field] || field;
  }

  /**
   * Get validation summary message
   */
  static getValidationSummary(validation, country = 'thailand') {
    if (validation.isComplete) {
      return country === 'thailand'
        ? 'ข้อมูลครบถ้วน พร้อมส่ง / All information complete. Ready to submit!'
        : 'All information complete. Ready to submit!';
    }

    const messages = {
      thailand: `ยังขาดข้อมูล ${validation.missingFields.length} รายการ / Missing ${validation.missingFields.length} required fields`,
      malaysia: `Missing ${validation.missingFields.length} required fields`,
      hongkong: `缺少 ${validation.missingFields.length} 個必填項目 / Missing ${validation.missingFields.length} required fields`,
      singapore: `Missing ${validation.missingFields.length} required fields`,
      taiwan: `缺少 ${validation.missingFields.length} 個必填項目 / Missing ${validation.missingFields.length} required fields`,
      usa: `Missing ${validation.missingFields.length} required fields`
    };

    return messages[country] || messages.thailand;
  }

  /**
   * Get section display name
   */
  static getSectionDisplayName(sectionKey, country = 'thailand') {
    const names = {
      thailand: {
        tdac: 'ปัตร TDAC / TDAC Card',
        personal: 'ข้อมูลส่วนตัว / Personal Information',
        travel: 'ข้อมูลการเดินทาง / Travel Details',
        funds: 'เงินทุน / Proof of Funds'
      },
      malaysia: {
        tdac: 'MDAC Card',
        personal: 'Personal Information',
        travel: 'Travel Details',
        funds: 'Proof of Funds'
      },
      hongkong: {
        tdac: '入境資料 / Entry Information',
        personal: '個人資料 / Personal Information',
        travel: '旅行資料 / Travel Details',
        funds: '資金證明 / Proof of Funds'
      }
    };

    return names[country]?.[sectionKey] || sectionKey;
  }
}

export default EntryPackValidationService;
