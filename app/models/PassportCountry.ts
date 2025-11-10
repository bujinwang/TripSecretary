/**
 * PassportCountry Model - Represents visa requirements for a specific passport and country.
 */

import SecureStorageService from '../services/security/SecureStorageService';

interface PassportCountryInit {
  passportId?: string;
  countryCode?: string;
  visaRequired?: boolean | number;
  maxStayDays?: number | null;
  notes?: string | null;
  createdAt?: string;
}

interface SaveResult {
  passportId: string;
  countryCode: string;
  visaRequired: boolean;
  maxStayDays: number | null;
  notes: string | null;
  createdAt: string;
}

interface PassportCountryRecord {
  passportId: string;
  countryCode: string;
  visaRequired: boolean;
  maxStayDays: number | null;
  notes: string | null;
  createdAt: string;
}

class PassportCountry {
  passportId?: string;
  countryCode?: string;
  visaRequired: boolean;
  maxStayDays: number | null;
  notes: string | null;
  createdAt: string;

  constructor(data: PassportCountryInit = {}) {
    this.passportId = data.passportId;
    this.countryCode = data.countryCode;
    this.visaRequired = PassportCountry.normalizeBoolean(data.visaRequired);
    this.maxStayDays = data.maxStayDays ?? null;
    this.notes = data.notes ?? null;
    this.createdAt = data.createdAt ?? new Date().toISOString();
  }

  async save(): Promise<SaveResult> {
    try {
      if (!this.passportId || !this.countryCode) {
        throw new Error('passportId and countryCode are required to save PassportCountry');
      }

      const result = await SecureStorageService.savePassportCountry({
        passportId: this.passportId,
        countryCode: this.countryCode,
        visaRequired: this.visaRequired,
        maxStayDays: this.maxStayDays,
        notes: this.notes,
        createdAt: this.createdAt
      });

      return {
        passportId: result.passportId,
        countryCode: result.countryCode,
        visaRequired: this.visaRequired,
        maxStayDays: this.maxStayDays,
        notes: this.notes,
        createdAt: this.createdAt
      };
    } catch (error) {
      console.error('Failed to save PassportCountry:', error);
      throw error;
    }
  }

  static async load(passportId: string, countryCode: string): Promise<PassportCountry | null> {
    try {
      const data = await SecureStorageService.getPassportCountry(passportId, countryCode);
      if (!data) {
        return null;
      }
      return new PassportCountry(data as PassportCountryInit);
    } catch (error) {
      console.error('Failed to load PassportCountry:', error);
      throw error;
    }
  }

  static async getByPassportId(passportId: string): Promise<PassportCountry[]> {
    try {
      const data = await SecureStorageService.getPassportCountriesByPassportId(passportId);
      return data.map((item: PassportCountryRecord) => new PassportCountry(item));
    } catch (error) {
      console.error('Failed to get PassportCountries by passportId:', error);
      throw error;
    }
  }

  private static normalizeBoolean(value?: boolean | number): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }
}

export default PassportCountry;

