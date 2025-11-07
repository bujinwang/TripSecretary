/**
 * Japan Form Helper Utility
 * Provides utilities for Japan manual entry form completion
 * Handles address formatting, field validation, and completion tracking
 */

class JapanFormHelper {
  /**
   * Convert ISO date string (YYYY-MM-DD) to local midnight Date object
   * @param {string} dateStr - ISO date string
   * @returns {Date|null} - Date at local midnight or null if invalid
   */
  static parseLocalDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) {
      return null;
    }

    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    const localDate = new Date(year, month - 1, day);
    localDate.setHours(0, 0, 0, 0);

    if (
      localDate.getFullYear() !== year ||
      localDate.getMonth() !== month - 1 ||
      localDate.getDate() !== day
    ) {
      return null;
    }

    return localDate;
  }

  /**
   * Get field count for a specific section
   * @param {Object} data - Section data
   * @param {string} section - Section type ('passport', 'personal', 'travel', 'funds')
   * @returns {Object} - Field count information
   */
  static getFieldCount(data, section) {
    const fieldCounts = {
      passport: this.getPassportFieldCount(data),
      personal: this.getPersonalFieldCount(data),
      travel: this.getTravelFieldCount(data),
      funds: this.getFundsFieldCount(data)
    };

    return fieldCounts[section] || { filled: 0, total: 0 };
  }

  /**
   * Get passport section field count
   * @param {Object} passport - Passport data
   * @returns {Object} - Field count
   */
  static getPassportFieldCount(passport) {
    const requiredFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const filled = requiredFields.filter(field => 
      passport && passport[field] && passport[field].toString().trim().length > 0
    ).length;

    return {
      filled,
      total: requiredFields.length,
      isComplete: filled === requiredFields.length
    };
  }

  /**
   * Get personal info section field count
   * @param {Object} personalInfo - Personal info data
   * @returns {Object} - Field count
   */
  static getPersonalFieldCount(personalInfo) {
    const requiredFields = ['occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email', 'gender'];
    const filled = requiredFields.filter(field => 
      personalInfo && personalInfo[field] && personalInfo[field].toString().trim().length > 0
    ).length;

    return {
      filled,
      total: requiredFields.length,
      isComplete: filled === requiredFields.length
    };
  }

  /**
   * Get travel info section field count (Japan-specific)
   * @param {Object} travelInfo - Travel info data
   * @returns {Object} - Field count
   */
  static getTravelFieldCount(travelInfo) {
    const baseFields = ['arrivalFlightNumber', 'arrivalDate', 'lengthOfStay'];
    const isTransitPassenger = Boolean(travelInfo?.isTransitPassenger);
    const fields = isTransitPassenger
      ? baseFields
      : [...baseFields, 'accommodationAddress', 'accommodationPhone'];

    let filled = 0;
    const total = fields.length + 1; // +1 for travel purpose requirement

    if (travelInfo) {
      const normalizedPurpose = this.normalizeTravelPurpose(travelInfo.travelPurpose);
      const customPurposeFilled = Boolean(
        travelInfo.customTravelPurpose && travelInfo.customTravelPurpose.toString().trim().length > 0
      );
      const legacyCustomPurpose =
        normalizedPurpose === 'Other' &&
        !customPurposeFilled &&
        travelInfo.travelPurpose &&
        travelInfo.travelPurpose.toString().trim().length > 0 &&
        travelInfo.travelPurpose !== 'Other';

      const purposeIsFilled =
        (normalizedPurpose && normalizedPurpose !== 'Other') ||
        (normalizedPurpose === 'Other' && (customPurposeFilled || legacyCustomPurpose));

      if (purposeIsFilled) {
        filled += 1;
      }

      fields.forEach(field => {
        let value = travelInfo[field];
        if (!value && field === 'arrivalDate') {
          value = travelInfo.arrivalArrivalDate;
        }
        if (!value && field === 'accommodationAddress') {
          value = travelInfo.hotelAddress;
        }
        if (!value && field === 'accommodationPhone') {
          value = travelInfo.accommodationPhone || travelInfo.contactPhone || travelInfo.hotelPhone;
        }
        if (value && value.toString().trim().length > 0) {
          filled += 1;
        }
      });
    }

    return {
      filled,
      total,
      isComplete: filled === total
    };
  }

  /**
   * Get funds section field count
   * @param {Array} fundItems - Fund items array
   * @returns {Object} - Field count
   */
  static getFundsFieldCount(fundItems) {
    const hasValidFunds = fundItems && Array.isArray(fundItems) && fundItems.length > 0 &&
                         fundItems.some(item => item.type && item.type.trim().length > 0);

    return {
      filled: hasValidFunds ? 1 : 0,
      total: 1,
      isComplete: hasValidFunds
    };
  }

  /**
   * Check if all sections are complete
   * @param {Object} allData - All user data
   * @returns {boolean} - Is form complete
   */
  static isFormComplete(allData) {
    const { passport, personalInfo, travelInfo, fundItems } = allData;
    
    const passportCount = this.getPassportFieldCount(passport);
    const personalCount = this.getPersonalFieldCount(personalInfo);
    const travelCount = this.getTravelFieldCount(travelInfo);
    const fundsCount = this.getFundsFieldCount(fundItems);

    return passportCount.isComplete && 
           personalCount.isComplete && 
           travelCount.isComplete && 
           fundsCount.isComplete;
  }

  /**
   * Format Japanese address for display
   * @param {string} address - Raw address string
   * @returns {string} - Formatted address
   */
  static formatJapaneseAddress(address) {
    if (!address) {
return '';
}

    // Clean up the address
    const cleaned = address.trim();
    
    // If it already looks formatted, return as-is
    if (cleaned.includes('\n') || cleaned.includes(',')) {
      return cleaned;
    }

    // Try to format common patterns
    // Example: "1-2-3 Shibuya Shibuya-ku Tokyo 150-0002"
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 4) {
      // Try to identify postal code (5 digits or 3-4 digits)
      const postalIndex = parts.findIndex(part => /^\d{3,5}-?\d{0,4}$/.test(part));
      
      if (postalIndex > 0) {
        const beforePostal = parts.slice(0, postalIndex).join(' ');
        const postal = parts[postalIndex];
        const afterPostal = parts.slice(postalIndex + 1).join(' ');
        
        if (afterPostal) {
          return `${beforePostal}\n${afterPostal} ${postal}`;
        } else {
          return `${beforePostal}\n${postal}`;
        }
      }
    }

    return cleaned;
  }

  /**
   * Get address formatting help text
   * @param {string} locale - Locale code
   * @returns {string} - Help text
   */
  static getAddressHelpText(locale = 'zh') {
    const helpTexts = {
      zh: '请输入完整地址，例如：1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
      en: 'Enter full address, e.g.: 1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
      ja: '完全な住所を入力してください。例：東京都渋谷区渋谷1-2-3 150-0002'
    };

    return helpTexts[locale] || helpTexts.en;
  }

  /**
   * Validate accommodation phone number for Japan
   * @param {string} phone - Phone number
   * @returns {Object} - Validation result
   */
  static validateAccommodationPhone(phone) {
    if (!phone) {
      return {
        isValid: false,
        error: 'Accommodation phone number is required'
      };
    }

    // Clean phone number
    const cleaned = phone.replace(/[^\d+\-()]/g, '');
    
    // Japan phone number patterns
    const patterns = [
      /^0\d{1,4}-\d{1,4}-\d{4}$/, // Landline: 03-1234-5678
      /^0\d{9,10}$/, // Landline without hyphens: 0312345678
      /^\+81-\d{1,4}-\d{1,4}-\d{4}$/, // International: +81-3-1234-5678
      /^[\d\-+()]{7,}$/ // General pattern for international numbers
    ];

    const isValid = patterns.some(pattern => pattern.test(cleaned));

    return {
      isValid,
      error: isValid ? null : 'Invalid phone number format'
    };
  }

  /**
   * Get travel purpose options for Japan
   * @param {string} locale - Locale code
   * @returns {Array} - Travel purpose options
   */
  static getTravelPurposeOptions(locale = 'zh') {
    const options = {
      zh: [
        { value: 'Tourism', label: '观光旅游' },
        { value: 'Business', label: '商务' },
        { value: 'Visiting Relatives', label: '亲属探访' },
        { value: 'Transit', label: '过境转机' },
        { value: 'Other', label: '其他' }
      ],
      en: [
        { value: 'Tourism', label: 'Tourism' },
        { value: 'Business', label: 'Business' },
        { value: 'Visiting Relatives', label: 'Visiting Relatives' },
        { value: 'Transit', label: 'Transit' },
        { value: 'Other', label: 'Other' }
      ]
    };

    return options[locale] || options.en;
  }

  /**
   * Normalize legacy travel purpose values to the current set
   * @param {string} purpose - Stored travel purpose value
   * @returns {string} - Normalized travel purpose
   */
  static normalizeTravelPurpose(purpose) {
    if (!purpose) {
      return 'Tourism';
    }

    const raw = purpose.toString().trim();
    const upper = raw.toUpperCase().replace(/\s+/g, '_');

    const uppercaseMap = {
      TOURISM: 'Tourism',
      BUSINESS: 'Business',
      VISITING_RELATIVES: 'Visiting Relatives',
      VISITINGFRIENDSRELATIVES: 'Visiting Relatives',
      TRANSIT: 'Transit',
      OTHER: 'Other',
    };

    if (uppercaseMap[upper]) {
      return uppercaseMap[upper];
    }

    if (raw === 'Visiting Friends/Relatives') {
      return 'Visiting Relatives';
    }

    if (raw === 'Conference') {
      return 'Business';
    }

    const allowedPurposes = ['Tourism', 'Business', 'Visiting Relatives', 'Transit', 'Other'];
    return allowedPurposes.includes(raw) ? raw : 'Other';
  }

  /**
   * Get accommodation type options for Japan
   * @param {string} locale - Locale code
   * @returns {Array} - Accommodation type options
   */
  static getAccommodationTypeOptions(locale = 'zh') {
    const options = {
      zh: [
        { value: 'Hotel', label: '酒店' },
        { value: 'Ryokan', label: '日式旅馆' },
        { value: 'Friend\'s House', label: '朋友家' },
        { value: 'Airbnb', label: 'Airbnb' },
        { value: 'Other', label: '其他' }
      ],
      en: [
        { value: 'Hotel', label: 'Hotel' },
        { value: 'Ryokan', label: 'Ryokan' },
        { value: 'Friend\'s House', label: 'Friend\'s House' },
        { value: 'Airbnb', label: 'Airbnb' },
        { value: 'Other', label: 'Other' }
      ]
    };

    return options[locale] || options.en;
  }

  /**
   * Validate length of stay
   * @param {string} lengthOfStay - Length of stay in days
   * @returns {Object} - Validation result
   */
  static validateLengthOfStay(lengthOfStay) {
    if (!lengthOfStay) {
      return {
        isValid: false,
        error: 'Length of stay is required'
      };
    }

    const days = parseInt(lengthOfStay);
    
    if (isNaN(days)) {
      return {
        isValid: false,
        error: 'Length of stay must be a number'
      };
    }

    if (days <= 0) {
      return {
        isValid: false,
        error: 'Length of stay must be greater than 0'
      };
    }

    if (days > 365) {
      return {
        isValid: false,
        error: 'Length of stay cannot exceed 365 days'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Get section completion badge style
   * @param {Object} fieldCount - Field count object
   * @returns {Object} - Badge style information
   */
  static getSectionBadgeStyle(fieldCount) {
    const isComplete = fieldCount.isComplete;
    
    return {
      style: isComplete ? 'complete' : 'incomplete',
      color: isComplete ? '#4CAF50' : '#FF9800', // Green for complete, orange for incomplete
      text: `${fieldCount.filled}/${fieldCount.total}`,
      icon: isComplete ? '✓' : '⚠'
    };
  }

  /**
   * Generate form completion summary
   * @param {Object} allData - All user data
   * @returns {Object} - Completion summary
   */
  static getCompletionSummary(allData) {
    const { passport, personalInfo, travelInfo, fundItems } = allData;
    
    const sections = {
      passport: this.getPassportFieldCount(passport),
      personal: this.getPersonalFieldCount(personalInfo),
      travel: this.getTravelFieldCount(travelInfo),
      funds: this.getFundsFieldCount(fundItems)
    };

    const totalFilled = Object.values(sections).reduce((sum, section) => sum + section.filled, 0);
    const totalRequired = Object.values(sections).reduce((sum, section) => sum + section.total, 0);
    const completedSections = Object.values(sections).filter(section => section.isComplete).length;
    const totalSections = Object.keys(sections).length;

    return {
      sections,
      totalFilled,
      totalRequired,
      completedSections,
      totalSections,
      overallPercentage: Math.round((totalFilled / totalRequired) * 100),
      isComplete: this.isFormComplete(allData)
    };
  }

  /**
   * Normalize fund item metadata
   * @param {string} type
   * @returns {{key: string, icon: string, defaultLabel: string}}
   */
  static getFundItemMeta(type) {
    const typeKey = (type || '').toString().toUpperCase();
    const icons = {
      CASH: '💰',
      BANK_CARD: '💳',
      CREDIT_CARD: '💳',
      BANK_BALANCE: '🏦',
      INVESTMENT: '📈',
      DOCUMENT: '📄',
      OTHER: '🧾',
    };

    const labels = {
      CASH: 'Cash',
      BANK_CARD: 'Bank Card',
      CREDIT_CARD: 'Bank Card',
      BANK_BALANCE: 'Bank Balance',
      INVESTMENT: 'Investment',
      DOCUMENT: 'Supporting Document',
      OTHER: 'Funding',
    };

    const normalizedKey = icons[typeKey] ? typeKey : 'OTHER';

    return {
      key: normalizedKey,
      icon: icons[normalizedKey],
      defaultLabel: labels[normalizedKey],
    };
  }

  /**
   * Get display icon for fund item type
   * @param {string} type
   * @returns {string}
   */
  static getFundItemIcon(type) {
    return this.getFundItemMeta(type).icon;
  }

  /**
   * Get localized label for fund item type
   * @param {string} type
    * @param {Function} translate
   * @returns {string}
   */
  static getFundItemLabel(type, translate) {
    const meta = this.getFundItemMeta(type);
    if (typeof translate === 'function') {
      return translate(`fundItem.types.${meta.key}`, {
        defaultValue: meta.defaultLabel,
      });
    }
    return meta.defaultLabel;
  }

  /**
   * Build summary string for fund item
   * @param {Object} item
   * @param {Function} translate
   * @returns {string}
   */
  static getFundItemSummary(item, translate) {
    if (!item) {
      return '';
    }

    const meta = this.getFundItemMeta(item.type);
    const t = typeof translate === 'function' ? translate : null;

    const notProvidedLabel = t
      ? t('fundItem.detail.notProvided', { defaultValue: 'Not provided yet' })
      : 'Not provided yet';

    const descriptionValue = item.description || item.details || '';
    const currencyValue = item.currency ? item.currency.toUpperCase() : '';

    const normalizeAmount = (value) => {
      if (value === null || value === undefined || value === '') {
return '';
}
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toLocaleString();
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
return '';
}
        const parsed = Number(trimmed.replace(/,/g, ''));
        return Number.isNaN(parsed) ? trimmed : parsed.toLocaleString();
      }
      return `${value}`;
    };

    const amountValue = normalizeAmount(item.amount);
    const typeKey = meta.key;
    const isAmountType = ['CASH', 'BANK_CARD', 'CREDIT_CARD', 'BANK_BALANCE', 'INVESTMENT'].includes(typeKey);

    if (typeKey === 'DOCUMENT') {
      return descriptionValue || notProvidedLabel;
    }

    if (typeKey === 'BANK_CARD' || typeKey === 'CREDIT_CARD') {
      const cardLabel = descriptionValue || notProvidedLabel;
      const amountLabel = amountValue || notProvidedLabel;
      const currencyLabel = currencyValue || notProvidedLabel;
      return `${cardLabel} • ${amountLabel} ${currencyLabel}`.trim();
    }

    if (isAmountType) {
      const amountLabel = amountValue || notProvidedLabel;
      const currencyLabel = currencyValue || notProvidedLabel;
      return `${amountLabel} ${currencyLabel}`.trim();
    }

    return descriptionValue || amountValue || currencyValue || notProvidedLabel;
  }
}

export default JapanFormHelper;
