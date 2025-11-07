/**
 * 入境通 - Passport Data Model
 * Defines the structure and validation for passport information
 */

import SecureStorageService from '../services/security/SecureStorageService';
import { getNationalityDisplayName, getNationalityCode } from '../data/nationalities';

type Gender = 'Male' | 'Female' | 'Undefined' | string | null | undefined;

interface PassportInit {
  id?: string;
  userId?: string;
  passportNumber?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  gender?: Gender;
  expiryDate?: string | null;
  issueDate?: string | null;
  issuePlace?: string | null;
  photoUri?: string | null;
  isPrimary?: boolean | number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ValidationOptions {
  partial?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SaveOptions extends ValidationOptions {
  skipValidation?: boolean;
}

interface SaveResult {
  id: string;
}

interface LoadOptions {
  byUserId?: boolean;
}

interface OCRResult {
  passportNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  expiryDate?: string;
  issueDate?: string;
  issuePlace?: string;
  photoUri?: string;
  [key: string]: unknown;
}

interface NameParts {
  surname: string;
  givenName: string;
}

const PASSPORT_NUMBER_REGEX = /^[A-Z0-9]{6,12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EXPIRY_WARNING_MONTHS = 6;

class Passport {
  id: string;
  userId?: string;
  passportNumber?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  gender?: Gender;
  expiryDate?: string | null;
  issueDate?: string | null;
  issuePlace?: string | null;
  photoUri?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(data: PassportInit = {}) {
    this.id = data.id ?? Passport.generateId();
    this.userId = data.userId;
    this.passportNumber = data.passportNumber ?? null;
    this.fullName = data.fullName ?? null;
    this.dateOfBirth = data.dateOfBirth ?? null;
    this.nationality = data.nationality ?? null;
    this.gender = data.gender ?? null;
    this.expiryDate = data.expiryDate ?? null;
    this.issueDate = data.issueDate ?? null;
    this.issuePlace = data.issuePlace ?? null;
    this.photoUri = data.photoUri ?? null;
    this.isPrimary = Passport.normalizePrimaryFlag(data.isPrimary);
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  static generateId(): string {
    return `passport_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  getNationalityDisplayName(): string | null {
    if (!this.nationality) {
      return null;
    }
    return getNationalityDisplayName(this.nationality) || this.nationality;
  }

  setNationalityFromDisplayName(displayName: string): void {
    const code = getNationalityCode(displayName);
    this.nationality = code ?? displayName;
  }

  getFormattedNationality(): string | null {
    const displayName = this.getNationalityDisplayName();
    if (!this.nationality) {
      return displayName;
    }
    return `${this.nationality} : ${displayName ?? this.nationality}`;
  }

  parseFullName(): NameParts {
    if (!this.fullName) {
      return { surname: '', givenName: '' };
    }

    if (this.fullName.includes(',')) {
      const parts = this.fullName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        return {
          surname: parts[0],
          givenName: parts[1]
        };
      }
    }

    const spaceParts = this.fullName.trim().split(/\s+/);
    if (spaceParts.length >= 2) {
      return {
        surname: spaceParts[0],
        givenName: spaceParts.slice(1).join(' ')
      };
    }

    return {
      surname: '',
      givenName: this.fullName
    };
  }

  setFullNameFromParts(surname: string, givenName: string): void {
    const parts = [surname, givenName].filter(Boolean);
    this.fullName = parts.join(', ');
  }

  getSurname(): string {
    return this.parseFullName().surname;
  }

  getGivenName(): string {
    const parsed = this.parseFullName();
    return parsed.givenName || this.fullName || '';
  }

  validate(options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = [];
    const { partial = false } = options;

    const hasValue = (value: unknown): boolean => value !== null && value !== undefined && value !== '';

    if (!partial) {
      if (!hasValue(this.passportNumber)) {
        errors.push('Passport number is required');
      }
      if (!hasValue(this.fullName)) {
        errors.push('Full name is required');
      }
      if (!hasValue(this.dateOfBirth)) {
        errors.push('Date of birth is required');
      }
      if (!hasValue(this.nationality)) {
        errors.push('Nationality is required');
      }
    }

    if (hasValue(this.gender) && !['Male', 'Female', 'Undefined'].includes(String(this.gender))) {
      errors.push('Gender must be Male, Female, or Undefined');
    }

    if (hasValue(this.passportNumber) && !Passport.isValidPassportNumber(String(this.passportNumber))) {
      errors.push('Invalid passport number format');
    }

    if (hasValue(this.dateOfBirth) && !Passport.isValidDate(String(this.dateOfBirth))) {
      errors.push('Invalid date of birth format');
    }

    if (hasValue(this.expiryDate) && !Passport.isValidDate(String(this.expiryDate))) {
      errors.push('Invalid expiry date format');
    }

    if (hasValue(this.issueDate) && !Passport.isValidDate(String(this.issueDate))) {
      errors.push('Invalid issue date format');
    }

    if (hasValue(this.expiryDate) && hasValue(this.issueDate)) {
      const expiry = new Date(String(this.expiryDate));
      const issue = new Date(String(this.issueDate));
      if (expiry <= issue) {
        errors.push('Expiry date must be after issue date');
      }
    }

    if (hasValue(this.expiryDate)) {
      const expiry = new Date(String(this.expiryDate));
      const now = new Date();
      if (expiry <= now) {
        errors.push('Passport has expired');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isExpired(): boolean {
    if (!this.expiryDate) {
      return false;
    }
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    return expiry <= now;
  }

  expiresSoon(): boolean {
    if (!this.expiryDate) {
      return false;
    }
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + EXPIRY_WARNING_MONTHS * 30 * 24 * 60 * 60 * 1000);
    return expiry <= sixMonthsFromNow && expiry > now;
  }

  daysUntilExpiry(): number | null {
    if (!this.expiryDate) {
      return null;
    }
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toPlainObject(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      passportNumber: this.passportNumber,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      gender: this.gender,
      expiryDate: this.expiryDate,
      issueDate: this.issueDate,
      issuePlace: this.issuePlace,
      photoUri: this.photoUri,
      isPrimary: this.isPrimary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async save(options: SaveOptions = {}): Promise<SaveResult> {
    try {
      console.log('=== PASSPORT MODEL SAVE DEBUG ===');
      console.log('Passport.save called');
      console.log('Passport instance data:', {
        id: this.id,
        userId: this.userId,
        passportNumber: this.passportNumber,
        fullName: this.fullName,
        dateOfBirth: this.dateOfBirth,
        nationality: this.nationality,
        gender: this.gender,
        expiryDate: this.expiryDate
      });
      console.log('options received:', options);
      console.log('options.skipValidation:', options.skipValidation);
      console.log('options.partial:', options.partial);

      if (!options.skipValidation) {
        console.log('=== VALIDATION IS RUNNING ===');
        console.log('About to call this.validate()');
        const validation = this.validate({ partial: options.partial ?? false });
        console.log('Validation result:', validation);
        if (!validation.isValid) {
          console.log('Validation failed with errors:', validation.errors);
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        } else {
          console.log('Validation passed');
        }
      } else {
        console.log('=== SKIPPING VALIDATION ===');
        console.log('skipValidation is true, bypassing validation');
      }

      this.updatedAt = new Date().toISOString();

      const dataToSave: Record<string, unknown> = {
        id: this.id,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      Passport.assignIfPresent(dataToSave, 'passportNumber', this.passportNumber);
      Passport.assignIfPresent(dataToSave, 'fullName', this.fullName);
      Passport.assignIfPresent(dataToSave, 'dateOfBirth', this.dateOfBirth);
      Passport.assignIfPresent(dataToSave, 'nationality', this.nationality);
      Passport.assignIfPresent(dataToSave, 'gender', this.gender);
      Passport.assignIfPresent(dataToSave, 'expiryDate', this.expiryDate);
      Passport.assignIfPresent(dataToSave, 'issueDate', this.issueDate);
      Passport.assignIfPresent(dataToSave, 'issuePlace', this.issuePlace);
      Passport.assignIfPresent(dataToSave, 'photoUri', this.photoUri);
      dataToSave.isPrimary = this.isPrimary;

      console.log('About to call SecureStorageService.savePassport with filtered data:', dataToSave);
      const result = await SecureStorageService.savePassport(dataToSave as Record<string, unknown>);

      console.log('SecureStorageService.savePassport completed successfully');
      return result as SaveResult;
    } catch (error) {
      const err = error as Error;
      console.error('=== PASSPORT MODEL SAVE ERROR ===');
      console.error('Error in Passport.save:', err.message);
      console.error('Error stack:', err.stack);
      throw error;
    }
  }

  static async load(idOrUserId: string, options: LoadOptions = {}): Promise<Passport | null> {
    try {
      const data = options.byUserId
        ? await SecureStorageService.getUserPassport(idOrUserId)
        : await SecureStorageService.getPassport(idOrUserId);

      if (!data) {
        return null;
      }

      return new Passport(data as PassportInit);
    } catch (error) {
      console.error('Failed to load passport:', error);
      throw error;
    }
  }

  static async loadPrimary(userId: string): Promise<Passport | null> {
    try {
      const data = await SecureStorageService.getUserPassport(userId);
      if (!data) {
        return null;
      }
      return new Passport(data as PassportInit);
    } catch (error) {
      console.error('Failed to load primary passport:', error);
      throw error;
    }
  }

  static async listPassports(userId: string): Promise<Passport[]> {
    try {
      const passportsData = await SecureStorageService.listUserPassports(userId);
      if (!passportsData || passportsData.length === 0) {
        return [];
      }
      return passportsData.map(data => new Passport(data as PassportInit));
    } catch (error) {
      console.error('Failed to list passports:', error);
      throw error;
    }
  }

  async delete(): Promise<boolean> {
    try {
      console.warn('Delete passport not yet implemented in SecureStorageService');
      return false;
    } catch (error) {
      console.error('Failed to delete passport:', error);
      throw error;
    }
  }

  getSummary(): Record<string, unknown> {
    return {
      id: this.id,
      nationality: this.nationality,
      expiryDate: this.expiryDate,
      isExpired: this.isExpired(),
      expiresSoon: this.expiresSoon(),
      daysUntilExpiry: this.daysUntilExpiry(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  exportData(): Record<string, unknown> {
    return {
      id: this.id,
      passportNumber: this.passportNumber,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      gender: this.gender,
      expiryDate: this.expiryDate,
      issueDate: this.issueDate,
      issuePlace: this.issuePlace,
      photoUri: this.photoUri,
      isPrimary: this.isPrimary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        isExpired: this.isExpired(),
        expiresSoon: this.expiresSoon(),
        daysUntilExpiry: this.daysUntilExpiry()
      }
    };
  }

  static fromOCRResult(ocrResult: OCRResult, userId: string): Passport {
    return new Passport({
      userId,
      passportNumber: ocrResult.passportNumber ?? null,
      fullName: ocrResult.fullName ?? null,
      dateOfBirth: ocrResult.dateOfBirth ?? null,
      nationality: ocrResult.nationality ?? null,
      gender: ocrResult.gender ?? null,
      expiryDate: ocrResult.expiryDate ?? null,
      issueDate: ocrResult.issueDate ?? null,
      issuePlace: ocrResult.issuePlace ?? null,
      photoUri: ocrResult.photoUri ?? null
    });
  }

  getDisplayName(): string {
    if (this.fullName && this.passportNumber) {
      return `${this.fullName} (${this.passportNumber})`;
    }
    return this.passportNumber || 'Unnamed Passport';
  }

  async setAsPrimary(): Promise<SaveResult> {
    if (!this.userId) {
      throw new Error('Cannot set as primary: userId is not set');
    }

    this.isPrimary = true;
    return this.save({ skipValidation: true });
  }

  private static normalizePrimaryFlag(flag: PassportInit['isPrimary']): boolean {
    if (typeof flag === 'boolean') {
      return flag;
    }
    if (typeof flag === 'number') {
      return flag === 1;
    }
    if (typeof flag === 'string') {
      return flag === '1' || flag.toLowerCase() === 'true';
    }
    return false;
  }

  private static isValidPassportNumber(number: string): boolean {
    return PASSPORT_NUMBER_REGEX.test(number.replace(/\s/g, ''));
  }

  private static isValidDate(dateStr: string): boolean {
    if (!DATE_REGEX.test(dateStr)) {
      return false;
    }
    const date = new Date(dateStr);
    return !Number.isNaN(date.getTime());
  }

  private static assignIfPresent(target: Record<string, unknown>, key: string, value: unknown): void {
    if (value !== null && value !== undefined && value !== '') {
      target[key] = value;
    }
  }
}

export default Passport;

