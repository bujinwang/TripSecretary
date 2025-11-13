/**
 * 入境通 - Personal Information Data Model
 * Defines the structure and validation for personal information
 */

import SecureStorageService from '../services/security/SecureStorageService';

export interface PersonalInfoInit {
  id?: string;
  userId?: string;
  passportId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  homeAddress?: string | null;
  occupation?: string | null;
  provinceCity?: string | null;
  countryRegion?: string | null;
  phoneCode?: string | null;
  isDefault?: number;
  label?: string | null;
  createdAt?: string;
  updatedAt?: string;
  gender?: string | null;
  [key: string]: unknown;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SaveOptions {
  skipValidation?: boolean;
}

interface SaveResult {
  id: string;
}

interface ImmigrationCompleteness {
  required: Record<'phoneNumber' | 'email' | 'homeAddress' | 'occupation', boolean>;
  completeCount: number;
  totalRequired: number;
  percentage: number;
  missingFields: string[];
}

type PersonalInfoUpdates = Record<string, unknown>;

class PersonalInfo {
  id: string;
  userId?: string;
  passportId: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  homeAddress?: string | null;
  occupation?: string | null;
  provinceCity?: string | null;
  countryRegion?: string | null;
  phoneCode?: string | null;
  isDefault: number;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  gender?: string | null;

  constructor(data: PersonalInfoInit = {}) {
    this.id = data.id ?? PersonalInfo.generateId();
    this.userId = data.userId;
    this.passportId = data.passportId ?? null;
    this.phoneNumber = data.phoneNumber ?? null;
    this.email = data.email ?? null;
    this.homeAddress = data.homeAddress ?? null;
    this.occupation = data.occupation ?? null;
    this.provinceCity = data.provinceCity ?? null;
    this.countryRegion = data.countryRegion ?? null;
    this.phoneCode = data.phoneCode ?? null;
    this.isDefault = typeof data.isDefault === 'number' ? data.isDefault : 0;
    this.label = data.label ?? null;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
    this.gender = data.gender ?? null;
  }

  static generateId(): string {
    return `personal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    if (this.phoneNumber && !this.isValidPhoneNumber(this.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    const hasEmail = typeof this.email === 'string' && this.email.trim().length > 0;
    const hasPhone = typeof this.phoneNumber === 'string' && this.phoneNumber.trim().length > 0;
    if (!hasEmail && !hasPhone) {
      errors.push('At least one contact method (email or phone) is required');
    }

    if (this.homeAddress && this.homeAddress.trim().length < 5) {
      errors.push('Home address must be at least 5 characters long');
    }

    if (this.occupation && this.occupation.trim().length < 2) {
      errors.push('Occupation must be at least 2 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/[^\d+\s-()]/g, '');
    const phoneRegex = /^[\+]?[\d\s\-()]{7,}$/;
    return phoneRegex.test(cleanPhone) && cleanPhone.replace(/\D/g, '').length >= 7;
  }

  getFormattedPhoneNumber(): string {
    if (!this.phoneNumber) {
      return '';
    }

    const cleaned = this.phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('86') && cleaned.length === 13) {
      return `+86 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith('852') && cleaned.length === 11) {
      return `+852 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.startsWith('853') && cleaned.length === 10) {
      return `+853 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }

    return this.phoneNumber;
  }

  getPrimaryContact(): string {
    if (this.email) {
      return this.email;
    }
    if (this.phoneNumber) {
      return this.getFormattedPhoneNumber();
    }
    return '';
  }

  hasCompleteContactInfo(): boolean {
    return (
      (this.email != null && this.isValidEmail(this.email)) ||
      (this.phoneNumber != null && this.isValidPhoneNumber(this.phoneNumber))
    );
  }

  getLocationString(): string {
    const parts: string[] = [];
    if (this.provinceCity) {
      parts.push(this.provinceCity);
    }
    if (this.countryRegion) {
      parts.push(this.countryRegion);
    }
    return parts.join(', ') || 'Not specified';
  }

  async save(options: SaveOptions = {}): Promise<SaveResult> {
    try {
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      this.updatedAt = new Date().toISOString();
      if (!this.userId) {
        throw new Error('User ID is required to save personal info');
      }
      const userId = this.userId;

      const result = await SecureStorageService.savePersonalInfo({
        id: this.id,
        userId,
        passportId: this.passportId,
        phoneNumber: this.phoneNumber ?? undefined,
        email: this.email ?? undefined,
        homeAddress: this.homeAddress ?? undefined,
        occupation: this.occupation ?? undefined,
        provinceCity: this.provinceCity ?? undefined,
        countryRegion: this.countryRegion ?? undefined,
        phoneCode: this.phoneCode ?? undefined,
        isDefault: this.isDefault,
        label: this.label ?? undefined,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });

      return result;
    } catch (error) {
      console.error('Failed to save personal info:', error);
      throw error;
    }
  }

  static async loadDefault(userId: string): Promise<PersonalInfo | null> {
    try {
      const data = await SecureStorageService.getPersonalInfo(userId);

      if (!data) {
        return null;
      }

      return new PersonalInfo(data as PersonalInfoInit);
    } catch (error) {
      console.error('Failed to load default personal info:', error);
      throw error;
    }
  }

  static async load(personalInfoId: string): Promise<PersonalInfo | null> {
    try {
      const data = await SecureStorageService.getPersonalInfoById(personalInfoId);
      if (!data) {
        return null;
      }
      return new PersonalInfo(data as PersonalInfoInit);
    } catch (error) {
      console.error('Failed to load personal info by ID:', error);
      throw error;
    }
  }

  static async getByUserId(userId: string): Promise<PersonalInfo | null> {
    return PersonalInfo.loadDefault(userId);
  }

  async update(updates: PersonalInfoUpdates, options: SaveOptions = {}): Promise<SaveResult> {
    try {
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();

      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return this.save(options);
    } catch (error) {
      console.error('Failed to update personal info:', error);
      throw error;
    }
  }

  async mergeUpdates(updates: PersonalInfoUpdates, options: SaveOptions = {}): Promise<SaveResult> {
    try {
      const nonEmptyUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id' || key === 'createdAt') {
          continue;
        }

        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === 'string' && value.trim().length === 0) {
          continue;
        }

        nonEmptyUpdates[key] = value;
      }

      if (Object.keys(nonEmptyUpdates).length === 0) {
        return { id: this.id };
      }

      this.updatedAt = new Date().toISOString();
      Object.assign(this, nonEmptyUpdates);

      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return this.save(options);
    } catch (error) {
      console.error('❌ Failed to merge personal info updates:', error);
      console.error('Error details:', (error as Error).message, (error as Error).stack);
      throw error;
    }
  }

  getSummary(): Record<string, unknown> {
    return {
      id: this.id,
      hasEmail: !!this.email,
      hasPhone: !!this.phoneNumber,
      hasAddress: !!this.homeAddress,
      occupation: this.occupation,
      location: this.getLocationString(),
      hasCompleteContact: this.hasCompleteContactInfo(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  exportData(): Record<string, unknown> {
    return {
      id: this.id,
      passportId: this.passportId,
      phoneNumber: this.phoneNumber,
      email: this.email,
      homeAddress: this.homeAddress,
      occupation: this.occupation,
      provinceCity: this.provinceCity,
      countryRegion: this.countryRegion,
      phoneCode: this.phoneCode,
      isDefault: this.isDefault,
      label: this.label,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        hasCompleteContact: this.hasCompleteContactInfo(),
        primaryContact: this.getPrimaryContact(),
        location: this.getLocationString()
      }
    };
  }

  static fromUserInput(inputData: Record<string, unknown>, userId: string): PersonalInfo {
    return new PersonalInfo({
      userId,
      passportId: (inputData.passportId as string | null | undefined) ?? null,
      phoneNumber: (inputData.phoneNumber as string | null | undefined) ?? null,
      email: (inputData.email as string | null | undefined) ?? null,
      homeAddress: (inputData.homeAddress as string | null | undefined) ?? null,
      occupation: (inputData.occupation as string | null | undefined) ?? null,
      provinceCity: (inputData.provinceCity as string | null | undefined) ?? null,
      countryRegion: (inputData.countryRegion as string | null | undefined) ?? null,
      phoneCode: (inputData.phoneCode as string | null | undefined) ?? null,
      isDefault: (inputData.isDefault as number | undefined) ?? 0,
      label: (inputData.label as string | null | undefined) ?? null
    });
  }

  getDisplayName(): string {
    const contact = this.getPrimaryContact();
    if (contact) {
      return contact;
    }
    return 'Contact information not provided';
  }

  checkImmigrationCompleteness(): ImmigrationCompleteness {
    const required = {
      phoneNumber: !!this.phoneNumber,
      email: !!this.email,
      homeAddress: !!this.homeAddress,
      occupation: !!this.occupation
    } as const;

    const completeCount = Object.values(required).filter(Boolean).length;
    const totalRequired = Object.keys(required).length;

    return {
      required,
      completeCount,
      totalRequired,
      percentage: Math.round((completeCount / totalRequired) * 100),
      missingFields: Object.keys(required).filter(key => !required[key as keyof typeof required])
    };
  }
}

export default PersonalInfo;
