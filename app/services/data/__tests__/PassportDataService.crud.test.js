/**
 * PassportDataService CRUD Operations Tests
 * Tests for Create, Read, Update, Delete operations and migration logic
 */

import PassportDataService from '../PassportDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
// FundingProof model removed - use FundItem instead
import SecureStorageService from '../../security/SecureStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../../models/Passport', () => {
  const actualPassport = jest.requireActual('../../../models/Passport');
  return {
    __esModule: true,
    default: jest.fn(() => ({})),
    loadPrimary: jest.fn(),
  };
});
jest.mock('../../../models/PersonalInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
  loadDefault: jest.fn(),
}));
// FundingProof mock removed
jest.mock('../../security/SecureStorageService');
jest.mock('@react-native-async-storage/async-storage');

describe('PassportDataService - CRUD Operations', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    PassportDataService.clearCache();
    PassportDataService.resetCacheStats();
  });

  describe('CREATE Operations', () => {
    describe('savePassport', () => {
      it('should save new passport data', async () => {
        const passportData = {
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI',
          dateOfBirth: '1988-01-22',
          nationality: 'CHN',
          gender: 'Male',
          expiryDate: '2030-12-31',
          issueDate: '2020-12-31',
          issuePlace: 'Shanghai'
        };

        const savedPassport = {
          id: 'passport-1',
          userId: testUserId,
          ...passportData
        };

        const mockPassportInstance = {
          ...savedPassport,
          save: jest.fn().mockResolvedValue(true)
        };

        Passport.mockImplementation(() => mockPassportInstance);
        Passport.load.mockResolvedValue(savedPassport);

        const result = await PassportDataService.savePassport(passportData, testUserId);

        expect(Passport).toHaveBeenCalledWith(expect.objectContaining({
          ...passportData,
          userId: testUserId
        }));
        expect(mockPassportInstance.save).toHaveBeenCalled();
        expect(result.userId).toEqual(testUserId);
        expect(result.passportNumber).toEqual(passportData.passportNumber);
      });

      it('should throw error when userId is missing', async () => {
        const passportData = {
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        };

        await expect(
          PassportDataService.savePassport(passportData, null)
        ).rejects.toThrow('userId is required');
      });

      it('should invalidate cache after saving', async () => {
        const passportData = {
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI',
          nationality: 'CHN'
        };

        const mockPassportInstance = {
          id: 'passport-1',
          userId: testUserId,
          save: jest.fn().mockResolvedValue(true)
        };

        Passport.mockImplementation(() => mockPassportInstance);
        Passport.load.mockResolvedValue(mockPassportInstance);

        // Pre-populate cache
        PassportDataService.cache.passport.set(testUserId, { old: 'data' });

        await PassportDataService.savePassport(passportData, testUserId);

        // Cache should be invalidated
        const stats = PassportDataService.getCacheStats();
        expect(stats.invalidations).toBeGreaterThan(0);
      });
    });

    describe('savePersonalInfo', () => {
      it('should save new personal info data', async () => {
        const personalData = {
          phoneNumber: '+86 13812345678',
          email: 'test@example.com',
          homeAddress: '123 Main St',
          occupation: 'Engineer',
          provinceCity: 'Shanghai',
          countryRegion: 'CHN'
        };

        const savedPersonalInfo = {
          id: 'personal-1',
          userId: testUserId,
          ...personalData
        };

        const mockPersonalInfoInstance = {
          ...savedPersonalInfo,
          save: jest.fn().mockResolvedValue(true)
        };

        PersonalInfo.mockImplementation(() => mockPersonalInfoInstance);
        PersonalInfo.load.mockResolvedValue(savedPersonalInfo);

        const result = await PassportDataService.savePersonalInfo(personalData, testUserId);

        expect(PersonalInfo).toHaveBeenCalledWith(expect.objectContaining({
          ...personalData,
          userId: testUserId
        }));
        expect(mockPersonalInfoInstance.save).toHaveBeenCalled();
        expect(result.userId).toEqual(testUserId);
        expect(result.email).toEqual(personalData.email);
      });
    });

    // saveFundingProof tests removed - use saveFundItem instead
  });

  describe('READ Operations', () => {
    describe('getPassport', () => {
      it('should load passport data', async () => {
        const mockPassport = {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        };

        Passport.load.mockResolvedValue(mockPassport);

        const result = await PassportDataService.getPassport(testUserId);

        expect(Passport.load).toHaveBeenCalledWith(testUserId);
        expect(result).toEqual(mockPassport);
      });

      it('should return null when passport not found', async () => {
        Passport.load.mockResolvedValue(null);

        const result = await PassportDataService.getPassport(testUserId);

        expect(result).toBeNull();
      });

      it('should use cache on subsequent calls', async () => {
        const mockPassport = {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678'
        };

        Passport.load.mockResolvedValue(mockPassport);

        // First call
        await PassportDataService.getPassport(testUserId);
        expect(Passport.load).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        await PassportDataService.getPassport(testUserId);
        expect(Passport.load).toHaveBeenCalledTimes(1);

        const stats = PassportDataService.getCacheStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(1);
      });
    });

    describe('getPersonalInfo', () => {
      it('should load personal info data', async () => {
        const mockPersonalInfo = {
          id: 'personal-1',
          userId: testUserId,
          email: 'test@example.com',
          phoneNumber: '+86 13812345678'
        };

        PersonalInfo.load.mockResolvedValue(mockPersonalInfo);

        const result = await PassportDataService.getPersonalInfo(testUserId);

        expect(PersonalInfo.load).toHaveBeenCalledWith(testUserId);
        expect(result).toEqual(mockPersonalInfo);
      });
    });

    // getFundingProof tests removed - use getFundItems instead

    describe('getAllUserData', () => {
      it('should load all user data types', async () => {
        const mockPassport = { id: 'passport-1', userId: testUserId };
        const mockPersonalInfo = { id: 'personal-1', userId: testUserId };

        Passport.load.mockResolvedValue(mockPassport);
        PersonalInfo.load.mockResolvedValue(mockPersonalInfo);

        const result = await PassportDataService.getAllUserData(testUserId, {
          useBatchLoad: false
        });

        expect(result.passport).toEqual(mockPassport);
        expect(result.personalInfo).toEqual(mockPersonalInfo);
        expect(result.userId).toBe(testUserId);
      });

      it('should handle partial data gracefully', async () => {
        Passport.load.mockResolvedValue({ id: 'passport-1' });
        PersonalInfo.load.mockResolvedValue(null);

        const result = await PassportDataService.getAllUserData(testUserId, {
          useBatchLoad: false
        });

        expect(result.passport).toBeDefined();
        expect(result.personalInfo).toBeNull();
      });
    });
  });

  describe('UPDATE Operations', () => {
    describe('updatePassport', () => {
      it('should update existing passport', async () => {
        const existingPassport = {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI',
          save: jest.fn().mockResolvedValue(true)
        };

        Passport.load.mockResolvedValue(existingPassport);

        const updates = {
          fullName: 'ZHANG, WEI (UPDATED)',
          expiryDate: '2035-12-31'
        };

        await PassportDataService.updatePassport('passport-1', updates);

        expect(existingPassport.fullName).toBe('ZHANG, WEI (UPDATED)');
        expect(existingPassport.expiryDate).toBe('2035-12-31');
        expect(existingPassport.save).toHaveBeenCalled();
      });

      it('should throw error when passport not found', async () => {
        Passport.load.mockResolvedValue(null);

        await expect(
          PassportDataService.updatePassport('nonexistent-id', { fullName: 'TEST' })
        ).rejects.toThrow('Passport not found');
      });

      it('should invalidate cache after update', async () => {
        const mockPassport = {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678',
          save: jest.fn().mockResolvedValue(true)
        };

        Passport.load.mockResolvedValue(mockPassport);

        await PassportDataService.updatePassport('passport-1', { fullName: 'NEW NAME' });

        const stats = PassportDataService.getCacheStats();
        expect(stats.invalidations).toBeGreaterThan(0);
      });
    });

    describe('updatePersonalInfo', () => {
      it('should update existing personal info', async () => {
        const existingPersonalInfo = {
          id: 'personal-1',
          userId: testUserId,
          email: 'old@example.com',
          mergeUpdates: jest.fn().mockResolvedValue(true)
        };

        PersonalInfo.load.mockResolvedValue(existingPersonalInfo);

        const updates = {
          email: 'new@example.com'
        };

        await PassportDataService.updatePersonalInfo('personal-1', updates);

        expect(existingPersonalInfo.mergeUpdates).toHaveBeenCalledWith(updates, { skipValidation: true });
      });
    });

    /*
    describe('updateFundingProof', () => {
      it('should update existing funding proof', async () => {
        const existingFundingProof = {
          id: 'funding-1',
          userId: testUserId,
          cashAmount: '10000 THB',
          update: jest.fn().mockResolvedValue(true)
        };

        FundingProof.load.mockResolvedValue(existingFundingProof);

        const updates = {
          cashAmount: '20000 THB'
        };

        await PassportDataService.updateFundingProof('funding-1', updates);

        expect(existingFundingProof.update).toHaveBeenCalledWith(updates, { skipValidation: true });
      });
    });
    */
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      Passport.load.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        PassportDataService.getPassport(testUserId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle validation errors', async () => {
      const mockPassportInstance = {
        save: jest.fn().mockRejectedValue(new Error('Validation failed'))
      };

      Passport.mockImplementation(() => mockPassportInstance);

      await expect(
        PassportDataService.savePassport({ passportNumber: '' }, testUserId)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle concurrent update conflicts', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        save: jest.fn()
          .mockRejectedValueOnce(new Error('Concurrent modification'))
          .mockResolvedValueOnce(true)
      };

      Passport.load.mockResolvedValue(mockPassport);

      // First update should fail
      await expect(
        PassportDataService.updatePassport('passport-1', { fullName: 'TEST' })
      ).rejects.toThrow('Concurrent modification');
    });
  });
});
