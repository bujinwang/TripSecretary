/**
 * PassportDataService Migration Tests
 * Tests for AsyncStorage to SQLite migration logic
 */

import PassportDataService from '../PassportDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
// FundingProof removed - migration tests updated
import SecureStorageService from '../../security/SecureStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../../models/Passport');
jest.mock('../../../models/PersonalInfo');
// FundingProof mock removed
jest.mock('../../security/SecureStorageService');
jest.mock('@react-native-async-storage/async-storage');

describe('PassportDataService - Migration Logic', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    PassportDataService.clearCache();
  });

  describe('migrateFromAsyncStorage', () => {
    it('should migrate all data types from AsyncStorage to SQLite', async () => {
      // Mock AsyncStorage data
      const asyncPassport = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2030-12-31'
      };

      const asyncPersonalInfo = {
        phoneNumber: '+86 13812345678',
        email: 'test@example.com',
        occupation: 'Engineer'
      };

      const asyncFundingProof = {
        cashAmount: '10000 THB',
        bankCards: 'Visa ****1234'
      };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        if (key === '@personal_info' || key === `@personal_info_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPersonalInfo));
        }
        if (key === '@funding_proof' || key === `@funding_proof_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncFundingProof));
        }
        return Promise.resolve(null);
      });

      // Mock SecureStorageService
      SecureStorageService.needsMigration.mockResolvedValue(true);
      SecureStorageService.markMigrationComplete.mockResolvedValue();

      // Mock model constructors and save methods
      const mockPassportInstance = {
        id: 'passport-1',
        save: jest.fn().mockResolvedValue(true)
      };
      const mockPersonalInfoInstance = {
        id: 'personal-1',
        save: jest.fn().mockResolvedValue(true)
      };
      const mockFundingProofInstance = {
        id: 'funding-1',
        save: jest.fn().mockResolvedValue(true)
      };

      Passport.mockImplementation(() => mockPassportInstance);
      PersonalInfo.mockImplementation(() => mockPersonalInfoInstance);
      FundingProof.mockImplementation(() => mockFundingProofInstance);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      // Verify migration was performed
      expect(result.migrated).toBe(true);
      expect(result.passport).toBe(true);
      expect(result.personalInfo).toBe(true);
      expect(result.fundingProof).toBe(true);

      // Verify data was saved
      expect(mockPassportInstance.save).toHaveBeenCalled();
      expect(mockPersonalInfoInstance.save).toHaveBeenCalled();
      expect(mockFundingProofInstance.save).toHaveBeenCalled();

      // Verify migration was marked complete
      expect(SecureStorageService.markMigrationComplete).toHaveBeenCalledWith(testUserId);
    });

    it('should skip migration if already completed', async () => {
      SecureStorageService.needsMigration.mockResolvedValue(false);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(result.migrated).toBe(false);
      expect(result.reason).toBe('Migration already completed');
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should handle partial data migration', async () => {
      // Only passport data exists in AsyncStorage
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify({
            passportNumber: 'E12345678',
            fullName: 'ZHANG, WEI'
          }));
        }
        return Promise.resolve(null);
      });

      SecureStorageService.needsMigration.mockResolvedValue(true);
      SecureStorageService.markMigrationComplete.mockResolvedValue();

      const mockPassportInstance = {
        save: jest.fn().mockResolvedValue(true)
      };
      Passport.mockImplementation(() => mockPassportInstance);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(result.migrated).toBe(true);
      expect(result.passport).toBe(true);
      expect(result.personalInfo).toBe(false);
      expect(result.fundingProof).toBe(false);
    });

    it('should handle migration errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage read failed'));
      SecureStorageService.needsMigration.mockResolvedValue(true);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(result.migrated).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('AsyncStorage read failed');
    });

    it('should preserve all fields during migration', async () => {
      const completePassportData = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN',
        gender: 'Male',
        expiryDate: '2030-12-31',
        issueDate: '2020-12-31',
        issuePlace: 'Shanghai',
        photoUri: 'file:///path/to/photo.jpg'
      };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(completePassportData));
        }
        return Promise.resolve(null);
      });

      SecureStorageService.needsMigration.mockResolvedValue(true);
      SecureStorageService.markMigrationComplete.mockResolvedValue();

      let savedData = null;
      Passport.mockImplementation((data) => {
        savedData = data;
        return {
          save: jest.fn().mockResolvedValue(true)
        };
      });

      await PassportDataService.migrateFromAsyncStorage(testUserId);

      // Verify all fields were preserved
      expect(savedData).toMatchObject(completePassportData);
      expect(savedData.userId).toBe(testUserId);
    });

    it('should handle corrupt AsyncStorage data', async () => {
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve('invalid json{');
        }
        return Promise.resolve(null);
      });

      SecureStorageService.needsMigration.mockResolvedValue(true);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(result.migrated).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not mark migration complete if save fails', async () => {
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify({
            passportNumber: 'E12345678'
          }));
        }
        return Promise.resolve(null);
      });

      SecureStorageService.needsMigration.mockResolvedValue(true);

      const mockPassportInstance = {
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };
      Passport.mockImplementation(() => mockPassportInstance);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(result.migrated).toBe(false);
      expect(SecureStorageService.markMigrationComplete).not.toHaveBeenCalled();
    });
  });

  describe('loadAllFromAsyncStorage', () => {
    it('should load all data from AsyncStorage', async () => {
      const asyncPassport = { passportNumber: 'E12345678' };
      const asyncPersonalInfo = { email: 'test@example.com' };
      const asyncFundingProof = { cashAmount: '10000 THB' };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        if (key === '@personal_info' || key === `@personal_info_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPersonalInfo));
        }
        if (key === '@funding_proof' || key === `@funding_proof_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncFundingProof));
        }
        return Promise.resolve(null);
      });

      const result = await PassportDataService.loadAllFromAsyncStorage(testUserId);

      expect(result.passport).toEqual(asyncPassport);
      expect(result.personalInfo).toEqual(asyncPersonalInfo);
      expect(result.fundingProof).toEqual(asyncFundingProof);
    });

    it('should handle missing AsyncStorage data', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await PassportDataService.loadAllFromAsyncStorage(testUserId);

      expect(result.passport).toBeNull();
      expect(result.personalInfo).toBeNull();
      expect(result.fundingProof).toBeNull();
    });

    it('should try both user-specific and generic keys', async () => {
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify({ passportNumber: 'E12345678' }));
        }
        return Promise.resolve(null);
      });

      const result = await PassportDataService.loadAllFromAsyncStorage(testUserId);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`@passport_${testUserId}`);
      expect(result.passport).toBeDefined();
    });
  });

  describe('Migration Idempotency', () => {
    it('should be safe to run migration multiple times', async () => {
      const asyncPassport = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI'
      };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        return Promise.resolve(null);
      });

      // First migration
      SecureStorageService.needsMigration.mockResolvedValueOnce(true);
      SecureStorageService.markMigrationComplete.mockResolvedValue();

      const mockPassportInstance = {
        save: jest.fn().mockResolvedValue(true)
      };
      Passport.mockImplementation(() => mockPassportInstance);

      const result1 = await PassportDataService.migrateFromAsyncStorage(testUserId);
      expect(result1.migrated).toBe(true);

      // Second migration attempt - should skip
      SecureStorageService.needsMigration.mockResolvedValueOnce(false);

      const result2 = await PassportDataService.migrateFromAsyncStorage(testUserId);
      expect(result2.migrated).toBe(false);
      expect(result2.reason).toBe('Migration already completed');
    });
  });

  describe('Data Transformation During Migration', () => {
    it('should add userId to migrated data', async () => {
      const asyncPassport = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI'
        // No userId in AsyncStorage data
      };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(asyncPassport));
        }
        return Promise.resolve(null);
      });

      SecureStorageService.needsMigration.mockResolvedValue(true);
      SecureStorageService.markMigrationComplete.mockResolvedValue();

      let savedData = null;
      Passport.mockImplementation((data) => {
        savedData = data;
        return {
          save: jest.fn().mockResolvedValue(true)
        };
      });

      await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(savedData.userId).toBe(testUserId);
    });

    it('should handle legacy data formats', async () => {
      // Old format without some new fields
      const legacyPassport = {
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        dateOfBirth: '1988-01-22',
        nationality: 'CHN'
        // Missing: gender, issuePlace, etc.
      };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@passport' || key === `@passport_${testUserId}`) {
          return Promise.resolve(JSON.stringify(legacyPassport));
        }
        return Promise.resolve(null);
      });

      SecureStorageService.needsMigration.mockResolvedValue(true);
      SecureStorageService.markMigrationComplete.mockResolvedValue();

      const mockPassportInstance = {
        save: jest.fn().mockResolvedValue(true)
      };
      Passport.mockImplementation(() => mockPassportInstance);

      const result = await PassportDataService.migrateFromAsyncStorage(testUserId);

      expect(result.migrated).toBe(true);
      expect(mockPassportInstance.save).toHaveBeenCalled();
    });
  });
});
