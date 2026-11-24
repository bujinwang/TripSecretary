/**
 * Japan Form Helper Utility
 * Provides utilities for Japan manual entry form completion
 * Handles address formatting, field validation, and completion tracking
 */

interface FieldCount {
  filled: number;
  total: number;
  isComplete: boolean;
}

interface SectionBadgeStyle {
  style: string;
  color: string;
  text: string;
  icon: string;
}

interface CompletionSummary {
  sections: Record<string, FieldCount>;
  totalFilled: number;
  totalRequired: number;
  completedSections: number;
  totalSections: number;
  overallPercentage: number;
  isComplete: boolean;
}

interface FundItemMeta {
  key: string;
  icon: string;
  defaultLabel: string;
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

interface TravelPurposeOption {
  value: string;
  label: string;
}

class JapanFormHelper {
  static parseLocalDate(dateStr: string | null | undefined): Date | null {
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

  static getFieldCount(data: Record<string, unknown>, section: string): FieldCount {
    const fieldCounts: Record<string, FieldCount> = {
      passport: this.getPassportFieldCount(data),
      personal: this.getPersonalFieldCount(data),
      travel: this.getTravelFieldCount(data),
      funds: this.getFundsFieldCount(data as unknown[])
    };

    return fieldCounts[section] || { filled: 0, total: 0, isComplete: false };
  }

  static getPassportFieldCount(passport: Record<string, unknown>): FieldCount {
    const requiredFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const filled = requiredFields.filter(field =>
      passport && passport[field] && (passport[field] as string).toString().trim().length > 0
    ).length;

    return {
      filled,
      total: requiredFields.length,
      isComplete: filled === requiredFields.length
    };
  }

  static getPersonalFieldCount(personalInfo: Record<string, unknown>): FieldCount {
    const requiredFields = ['occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email', 'gender'];
    const filled = requiredFields.filter(field =>
      personalInfo && personalInfo[field] && (personalInfo[field] as string).toString().trim().length > 0
    ).length;

    return {
      filled,
      total: requiredFields.length,
      isComplete: filled === requiredFields.length
    };
  }

  static getTravelFieldCount(travelInfo: Record<string, unknown>): FieldCount {
    const baseFields = ['arrivalFlightNumber', 'arrivalDate', 'lengthOfStay'];
    const isTransitPassenger = Boolean(travelInfo?.isTransitPassenger);
    const fields = isTransitPassenger
      ? baseFields
      : [...baseFields, 'accommodationAddress', 'accommodationPhone'];

    let filled = 0;
    const total = fields.length + 1;

    if (travelInfo) {
      const normalizedPurpose = this.normalizeTravelPurpose(travelInfo.travelPurpose as string);
      const customPurposeFilled = Boolean(
        travelInfo.customTravelPurpose && (travelInfo.customTravelPurpose as string).toString().trim().length > 0
      );
      const legacyCustomPurpose =
        normalizedPurpose === 'Other' &&
        !customPurposeFilled &&
        travelInfo.travelPurpose &&
        (travelInfo.travelPurpose as string).toString().trim().length > 0 &&
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
        if (value && (value as string).toString().trim().length > 0) {
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

  static getFundsFieldCount(fundItems: unknown[]): FieldCount {
    const hasValidFunds = fundItems && Array.isArray(fundItems) && fundItems.length > 0 &&
                          fundItems.some(item => item && (item as Record<string, unknown>).type && ((item as Record<string, unknown>).type as string).trim().length > 0);

    return {
      filled: hasValidFunds ? 1 : 0,
      total: 1,
      isComplete: hasValidFunds
    };
  }

  static isFormComplete(allData: Record<string, unknown>): boolean {
    const { passport, personalInfo, travelInfo, fundItems } = allData;

    const passportCount = this.getPassportFieldCount(passport as Record<string, unknown>);
    const personalCount = this.getPersonalFieldCount(personalInfo as Record<string, unknown>);
    const travelCount = this.getTravelFieldCount(travelInfo as Record<string, unknown>);
    const fundsCount = this.getFundsFieldCount(fundItems as unknown[]);

    return passportCount.isComplete &&
           personalCount.isComplete &&
           travelCount.isComplete &&
           fundsCount.isComplete;
  }

  static formatJapaneseAddress(address: string | null | undefined): string {
    if (!address) {
      return '';
    }

    const cleaned = address.trim();

    if (cleaned.includes('\n') || cleaned.includes(',')) {
      return cleaned;
    }

    const parts = cleaned.split(/\s+/);
    if (parts.length >= 4) {
      const postalIndex = parts.findIndex((part: string) => /^\d{3,5}-?\d{0,4}$/.test(part));

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

  static getAddressHelpText(locale = 'zh'): string {
    const helpTexts: Record<string, string> = {
      zh: '请输入完整地址，例如：1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
      en: 'Enter full address, e.g.: 1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
      ja: '完全な住所を入力してください。例：東京都渋谷区渋谷1-2-3 150-0002'
    };

    return helpTexts[locale] || helpTexts.en;
  }

  static validateAccommodationPhone(phone: string | null | undefined): ValidationResult {
    if (!phone) {
      return {
        isValid: false,
        error: 'Accommodation phone number is required'
      };
    }

    const cleaned = phone.replace(/[^\d+\-()]/g, '');

    const patterns = [
      /^0\d{1,4}-\d{1,4}-\d{4}$/,
      /^0\d{9,10}$/,
      /^\+81-\d{1,4}-\d{1,4}-\d{4}$/,
      /^[\d\-+()]{7,}$/
    ];

    const isValid = patterns.some(pattern => pattern.test(cleaned));

    return {
      isValid,
      error: isValid ? null : 'Invalid phone number format'
    };
  }

  static getTravelPurposeOptions(locale = 'zh'): TravelPurposeOption[] {
    const options: Record<string, TravelPurposeOption[]> = {
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

  static normalizeTravelPurpose(purpose: string | null | undefined): string {
    if (!purpose) {
      return 'Tourism';
    }

    const raw = purpose.toString().trim();
    const upper = raw.toUpperCase().replace(/\s+/g, '_');

    const uppercaseMap: Record<string, string> = {
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

  static getAccommodationTypeOptions(locale = 'zh'): TravelPurposeOption[] {
    const options: Record<string, TravelPurposeOption[]> = {
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

  static validateLengthOfStay(lengthOfStay: string | null | undefined): ValidationResult {
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

  static getSectionBadgeStyle(fieldCount: FieldCount): SectionBadgeStyle {
    const { isComplete } = fieldCount;

    return {
      style: isComplete ? 'complete' : 'incomplete',
      color: isComplete ? '#4CAF50' : '#FF9800',
      text: `${fieldCount.filled}/${fieldCount.total}`,
      icon: isComplete ? '\u2713' : '\u26A0'
    };
  }

  static getCompletionSummary(allData: Record<string, unknown>): CompletionSummary {
    const { passport, personalInfo, travelInfo, fundItems } = allData;

    const sections: Record<string, FieldCount> = {
      passport: this.getPassportFieldCount(passport as Record<string, unknown>),
      personal: this.getPersonalFieldCount(personalInfo as Record<string, unknown>),
      travel: this.getTravelFieldCount(travelInfo as Record<string, unknown>),
      funds: this.getFundsFieldCount(fundItems as unknown[])
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

  static getFundItemMeta(type: string | null | undefined): FundItemMeta {
    const typeKey = (type || '').toString().toUpperCase();
    const icons: Record<string, string> = {
      CASH: '\u{1F4B0}',
      BANK_CARD: '\u{1F4B3}',
      CREDIT_CARD: '\u{1F4B3}',
      BANK_BALANCE: '\u{1F3E6}',
      INVESTMENT: '\u{1F4C8}',
      DOCUMENT: '\u{1F4C4}',
      OTHER: '\u{1F9FE}',
    };

    const labels: Record<string, string> = {
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

  static getFundItemIcon(type: string): string {
    return this.getFundItemMeta(type).icon;
  }

  static getFundItemLabel(type: string, translate: ((key: string, options?: Record<string, unknown>) => string) | null): string {
    const meta = this.getFundItemMeta(type);
    if (typeof translate === 'function') {
      return translate(`fundItem.types.${meta.key}`, {
        defaultValue: meta.defaultLabel,
      });
    }
    return meta.defaultLabel;
  }

  static getFundItemSummary(item: Record<string, unknown> | null | undefined, translate: ((key: string, options?: Record<string, unknown>) => string) | null): string {
    if (!item) {
      return '';
    }

    const meta = this.getFundItemMeta(item.type as string);
    const t = typeof translate === 'function' ? translate : null;

    const notProvidedLabel = t
      ? t('fundItem.detail.notProvided', { defaultValue: 'Not provided yet' })
      : 'Not provided yet';

    const descriptionValue = (item.description || item.details || '') as string;
    const currencyValue = item.currency ? (item.currency as string).toUpperCase() : '';

    const normalizeAmount = (value: unknown): string => {
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
      return `${cardLabel} \u2022 ${amountLabel} ${currencyLabel}`.trim();
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
