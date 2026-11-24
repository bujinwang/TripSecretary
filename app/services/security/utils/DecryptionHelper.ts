/**
 * Decryption Helper Utility
 * Handles decryption of sensitive fields from database records
 */

import EncryptionService, { FieldType } from '../EncryptionService';

type NullableString = string | null;

export interface PassportDecryptedFields {
  passport_number: NullableString;
  full_name: NullableString;
  date_of_birth: NullableString;
  nationality: NullableString;
}

export interface PersonalInfoDecryptedFields {
  phone_number: NullableString;
  email: NullableString;
  home_address: NullableString;
}

export interface DigitalArrivalCardDecryptedFields {
  api_response?: unknown | null;
  error_details?: unknown | null;
}

class DecryptionHelper {
  private readonly encryption = EncryptionService;

  private encryptionEnabled = false; // TODO: Re-enable before production

  async decryptField(
    encryptedValue: string | null | undefined,
    fieldType: FieldType | string = 'general'
  ): Promise<NullableString> {
    if (!encryptedValue) {
      return null;
    }

    if (!this.encryptionEnabled) {
      return encryptedValue;
    }

    try {
      return await this.encryption.decrypt(encryptedValue, fieldType as FieldType);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to decrypt ${fieldType}:`, message);
      return null;
    }
  }

  async decryptFields(
    row: Record<string, unknown> | null | undefined,
    fieldNames: string[] = []
  ): Promise<Record<string, NullableString>> {
    const decrypted: Record<string, NullableString> = {};

    if (!row) {
      return decrypted;
    }

    for (const fieldName of fieldNames) {
      const value = row[fieldName];
      decrypted[fieldName] = await this.decryptField(
        typeof value === 'string' ? value : null,
        fieldName
      );
    }

    return decrypted;
  }

  async decryptPassportFields(
    passportRow: Record<string, unknown> | null | undefined
  ): Promise<PassportDecryptedFields> {
    const result: PassportDecryptedFields = {
      passport_number: null,
      full_name: null,
      date_of_birth: null,
      nationality: null
    };

    if (!passportRow) {
      return result;
    }

    const fieldMapping: Record<string, keyof PassportDecryptedFields> = {
      encrypted_passport_number: 'passport_number',
      encrypted_full_name: 'full_name',
      encrypted_date_of_birth: 'date_of_birth',
      encrypted_nationality: 'nationality'
    };

    for (const [encryptedField, decryptedField] of Object.entries(fieldMapping)) {
      const value = passportRow[encryptedField];
      result[decryptedField] = await this.decryptField(
        typeof value === 'string' ? value : null,
        decryptedField
      );
    }

    return result;
  }

  async decryptPersonalInfoFields(
    personalInfoRow: Record<string, unknown> | null | undefined
  ): Promise<PersonalInfoDecryptedFields> {
    const result: PersonalInfoDecryptedFields = {
      phone_number: null,
      email: null,
      home_address: null
    };

    if (!personalInfoRow) {
      return result;
    }

    const fieldMapping: Record<string, keyof PersonalInfoDecryptedFields> = {
      encrypted_phone_number: 'phone_number',
      encrypted_email: 'email',
      encrypted_home_address: 'home_address'
    };

    for (const [encryptedField, decryptedField] of Object.entries(fieldMapping)) {
      const value = personalInfoRow[encryptedField];
      result[decryptedField] = await this.decryptField(
        typeof value === 'string' ? value : null,
        decryptedField
      );
    }

    return result;
  }

  async decryptDigitalArrivalCardFields(
    dacRow: Record<string, unknown> | null | undefined
  ): Promise<DigitalArrivalCardDecryptedFields> {
    if (!dacRow) {
      return {};
    }

    const decrypted: DigitalArrivalCardDecryptedFields = {};

    if (dacRow.api_response) {
      try {
        decrypted.api_response =
          typeof dacRow.api_response === 'string'
            ? JSON.parse(dacRow.api_response)
            : dacRow.api_response;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Failed to parse DAC api_response:', message);
        decrypted.api_response = null;
      }
    }

    if (dacRow.error_details) {
      try {
        decrypted.error_details =
          typeof dacRow.error_details === 'string'
            ? JSON.parse(dacRow.error_details)
            : dacRow.error_details;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Failed to parse DAC error_details:', message);
        decrypted.error_details = null;
      }
    }

    return decrypted;
  }

  async batchDecryptFields(
    rows: Array<Record<string, unknown>> | null | undefined,
    fieldNames: string[] = []
  ): Promise<Array<Record<string, unknown>>> {
    if (!Array.isArray(rows)) {
      return [];
    }

    const decryptedRows: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      const decryptedFields = await this.decryptFields(row, fieldNames);
      decryptedRows.push({
        ...row,
        ...decryptedFields
      });
    }

    return decryptedRows;
  }

  setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
  }

  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }
}

const decryptionHelper = new DecryptionHelper();

export default decryptionHelper;

