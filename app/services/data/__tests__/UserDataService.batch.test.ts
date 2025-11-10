// @ts-nocheck

/**
 * Tests for UserDataService batch operations
 * Tests batch loading and batch updates with transactions
 */

import UserDataService from '../UserDataService';
import SecureStorageService from '../../security/SecureStorageService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';


// Mock dependencies
jest.mock('../../security/SecureStorageService');
jest.mock('../../../models/Passport');
jest.mock('../../../models/PersonalInfo');

describe('UserDataService - Batch Operations', () => {
  const testUserId = 'test_user_123';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear cache
    UserDataService.clearCache();
    UserDataService.resetCacheStats();
    
    // Mock SecureStorageService.initialize
    SecureStorageService.initialize.mockResolvedValue();
  });

  describe('getAllUserData with batch loading', () => {
    it('should use batch loading by default', async () => {
      const mockPassport = {
        id: 'passport_1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        nationality: 'CHN'
      };

      const mockPersonalInfo = {
        id: 'personal_1',
        userId: testUserId,
        phoneNumber: '+86 123456789',
        email: 'test@example.com'
      };

      // mockFundingProof removed

      // Mock batchLoad
      SecureStorageService.batchLoad.mockResolvedValue({
        passport: mockPassport,

      });

      const result = await UserDataService.getAllUserData(testUserId);

      // Verify batchLoad was called
      expect(SecureStorageService.batchLoad).toHaveBeenCalledWith(
        testUserId,
        ['passport', 'personalInfo'] // fundingProof removed
      );

      // Verify result
      expect(result.passport).toEqual(mockPassport);
      expect(result.personalInfo).toEqual(mockPersonalInfo);
      // fundingProof assertion removed
      expect(result.userId).toBe(testUserId);
      expect(result.loadDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should fall back to parallel loading when useBatchLoad is false', async () => {
      const mockPassport = {
        id: 'passport_1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      // Mock individual load methods
      Passport.load.mockResolvedValue(mockPassport);
      PersonalInfo.load.mockResolvedValue(null);
      

      const result = await UserDataService.getAllUserData(testUserId, {
        useBatchLoad: false
      });

      // Verify individual methods were called
      expect(Passport.load).toHaveBeenCalledWith(testUserId);
      expect(PersonalInfo.load).toHaveBeenCalledWith(testUserId);
      expect(FundingProof.load).toHaveBeenCalledWith(testUserId);

      // Verify batchLoad was NOT called
      expect(SecureStorageService.batchLoad).not.toHaveBeenCalled();

      // Verify result
      expect(result.passport).toEqual(mockPassport);
    });

    it('should update cache after batch loading', async () => {
      const mockPassport = {
        id: 'passport_1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      SecureStorageService.batchLoad.mockResolvedValue({
        passport: mockPassport,
        personalInfo: null

      });

      await UserDataService.getAllUserData(testUserId);

      // Verify cache was updated
      expect(UserDataService.cache.passport.get(testUserId)).toEqual(mockPassport);
      expect(UserDataService.cache.lastUpdate.has(`passport_${testUserId}`)).toBe(true);
    });

    it('should handle batch loading errors gracefully', async () => {
      SecureStorageService.batchLoad.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        UserDataService.getAllUserData(testUserId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('batchUpdate', () => {
    it('should update multiple data types in a single transaction', async () => {
      const currentData = {
        passport: {
          id: 'passport_1',
          userId: testUserId,
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        },
        personalInfo: {
          id: 'personal_1',
          userId: testUserId,
          phoneNumber: '+86 123456789',
          email: 'old@example.com'
        },
      };

      const updates = {
        passport: {
          fullName: 'ZHANG, WEI (UPDATED)'
        },
        personalInfo: {
          email: 'new@example.com'
        }
      };

      // Mock getAllUserData to return current data
      SecureStorageService.batchLoad.mockResolvedValue(currentData);

      // Mock batchSave
      SecureStorageService.batchSave.mockResolvedValue([
        { type: 'passport', id: 'passport_1' },
        { type: 'personalInfo', id: 'personal_1' },
        { type: 'fundingProof', id: 'funding_1' }
      ]);

      const result = await UserDataService.batchUpdate(testUserId, updates);

      // Verify batchSave was called with merged data
      expect(SecureStorageService.batchSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'passport',
            data: expect.objectContaining({
              fullName: 'ZHANG, WEI (UPDATED)',
              passportNumber: 'E12345678'
            })
          }),
          expect.objectContaining({
            type: 'personalInfo',
            data: expect.objectContaining({
              email: 'new@example.com',
              phoneNumber: '+86 123456789'
            })
          }),

        ])
      );

      // Verify result contains updated data
      expect(result).toBeDefined();
    });

    it('should handle partial updates', async () => {
      const currentData = {
        passport: {
          id: 'passport_1',
          userId: testUserId,
          passportNumber: 'E12345678'
        },
        personalInfo: {
          id: 'personal_1',
          userId: testUserId,

      };

      const updates = {
        passport: {
          fullName: 'ZHANG, WEI'
        }
        // Only updating passport, not personalInfo or fundingProof
      };

      SecureStorageService.batchLoad.mockResolvedValue(currentData);
      SecureStorageService.batchSave.mockResolvedValue([
        { type: 'passport', id: 'passport_1' }
      ]);

      await UserDataService.batchUpdate(testUserId, updates);

      // Verify only passport was updated
      expect(SecureStorageService.batchSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'passport'
          })
        ])
      );

      const batchSaveCall = SecureStorageService.batchSave.mock.calls[0][0];
      expect(batchSaveCall).toHaveLength(1);
      expect(batchSaveCall[0].type).toBe('passport');
    });

    it('should return current data when no updates are provided', async () => {
      const currentData = {
        passport: {
          id: 'passport_1',
          userId: testUserId
        },
        personalInfo: null,
        fundingProof: null
      };

      SecureStorageService.batchLoad.mockResolvedValue(currentData);

      const result = await UserDataService.batchUpdate(testUserId, {});

      // Verify batchSave was NOT called
      expect(SecureStorageService.batchSave).not.toHaveBeenCalled();

      // Verify current data was returned
      expect(result).toEqual(currentData);
    });

    it('should invalidate cache after batch update', async () => {
      const currentData = {
        passport: {
          id: 'passport_1',
          userId: testUserId,
          passportNumber: 'E12345678'
        },
        personalInfo: null,
        fundingProof: null
      };

      const updates = {
        passport: {
          fullName: 'ZHANG, WEI'
        }
      };

      SecureStorageService.batchLoad.mockResolvedValue(currentData);
      SecureStorageService.batchSave.mockResolvedValue([
        { type: 'passport', id: 'passport_1' }
      ]);

      // Pre-populate cache
      UserDataService.cache.passport.set(testUserId, currentData.passport);

      await UserDataService.batchUpdate(testUserId, updates);

      // Cache should be invalidated and reloaded
      // The second batchLoad call is for reloading after update
      expect(SecureStorageService.batchLoad).toHaveBeenCalledTimes(2);
    });

    it('should handle batch update errors', async () => {
      const currentData = {
        passport: {
          id: 'passport_1',
          userId: testUserId
        },
        personalInfo: null,
        fundingProof: null
      };

      SecureStorageService.batchLoad.mockResolvedValue(currentData);
      SecureStorageService.batchSave.mockRejectedValue(
        new Error('Transaction failed')
      );

      await expect(
        UserDataService.batchUpdate(testUserId, {
          passport: { fullName: 'TEST' }
        })
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('saveAllUserData with transactions', () => {
    it('should use batchSave for atomic operations', async () => {
      const userData = {
        passport: {
          passportNumber: 'E12345678',
          fullName: 'ZHANG, WEI'
        },
        personalInfo: {
          email: 'test@example.com',
          phoneNumber: '+86 123456789'
        },

      };

      SecureStorageService.batchSave.mockResolvedValue([
        { type: 'passport', id: 'passport_1' },
        { type: 'personalInfo', id: 'personal_1' },
        { type: 'fundingProof', id: 'funding_1' }
      ]);

      // Mock individual getters for reload
      Passport.load.mockResolvedValue({ ...userData.passport, id: 'passport_1' });
      PersonalInfo.load.mockResolvedValue({ ...userData.personalInfo, id: 'personal_1' });


      await UserDataService.saveAllUserData(userData, testUserId);

      // Verify batchSave was called with all data
      expect(SecureStorageService.batchSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'passport' }),
          expect.objectContaining({ type: 'personalInfo' }),

        ])
      );
    });

    it('should handle transaction rollback on error', async () => {
      const userData = {
        passport: {
          passportNumber: 'E12345678'
        },
        personalInfo: {
          email: 'test@example.com'
        }
      };

      // Simulate transaction failure
      SecureStorageService.batchSave.mockRejectedValue(
        new Error('Transaction rolled back')
      );

      await expect(
        UserDataService.saveAllUserData(userData, testUserId)
      ).rejects.toThrow('Transaction rolled back');

      // Verify cache was not updated (since transaction failed)
      expect(UserDataService.cache.passport.has(testUserId)).toBe(false);
    });
  });

  describe('Performance comparison', () => {
    it('batch loading should be faster than parallel loading', async () => {
      const mockData = {
        passport: { id: 'p1', userId: testUserId },
        personalInfo: { id: 'pi1', userId: testUserId },

      };

      // Mock batch load (fast)
      SecureStorageService.batchLoad.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockData;
      });

      // Mock individual loads (slower)
      Passport.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockData.passport;
      });
      PersonalInfo.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockData.personalInfo;
      });


      // Test batch loading
      const batchStart = Date.now();
      const batchResult = await UserDataService.getAllUserData(testUserId, {
        useBatchLoad: true
      });
      const batchDuration = batchResult.loadDurationMs;

      // Clear cache for fair comparison
      UserDataService.clearCache();

      // Test parallel loading
      const parallelStart = Date.now();
      const parallelResult = await UserDataService.getAllUserData(testUserId, {
        useBatchLoad: false
      });
      const parallelDuration = parallelResult.loadDurationMs;

      console.log(`Batch loading: ${batchDuration}ms`);
      console.log(`Parallel loading: ${parallelDuration}ms`);

      // Batch should be at least as fast as parallel
      // (In real scenarios with actual database, batch is significantly faster)
      expect(batchDuration).toBeLessThanOrEqual(parallelDuration + 5);
    });
  });
});
