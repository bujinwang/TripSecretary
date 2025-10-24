/**
 * UserDataService Performance Tests
 * Tests for data load times, concurrent access, and cache effectiveness
 */

import UserDataService from '../UserDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
// FundingProof removed - performance tests updated
import SecureStorageService from '../../security/SecureStorageService';

// Mock dependencies


// FundingProof mock removed
jest.mock('../../security/SecureStorageService');

describe('UserDataService - Performance Tests', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    UserDataService.clearCache();
    UserDataService.resetCacheStats();
    Passport.load = jest.fn().mockResolvedValue({ userId: testUserId });
    Passport.loadPrimary = jest.fn().mockResolvedValue({ userId: testUserId });
    PersonalInfo.load = jest.fn().mockResolvedValue({ userId: testUserId });
    PersonalInfo.loadDefault = jest.fn().mockResolvedValue({ userId: testUserId });
  });

  describe('Data Load Time Performance', () => {
    it('should load passport data within 100ms', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI'
      };

      // Simulate realistic database delay
      Passport.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockPassport;
      });

      const startTime = Date.now();
      const result = await UserDataService.getPassport(testUserId);
      const duration = Date.now() - startTime;

      expect(result).toEqual(mockPassport);
      expect(duration).toBeLessThan(100);
    });

    it('should load personal info within 100ms', async () => {
      const mockPersonalInfo = {
        id: 'personal-1',
        userId: testUserId,
        email: 'test@example.com'
      };

      PersonalInfo.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockPersonalInfo;
      });

      const startTime = Date.now();
      const result = await UserDataService.getPersonalInfo(testUserId);
      const duration = Date.now() - startTime;

      expect(result).toEqual(mockPersonalInfo);
      expect(duration).toBeLessThan(100);
    });

    /*it('should load funding proof within 100ms', async () => {
      const mockFundingProof = {
        id: 'funding-1',
        userId: testUserId,
        cashAmount: '10000 THB'
      };

      FundingProof.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockFundingProof;
      });

      const startTime = Date.now();
      const result = await UserDataService.getFundingProof(testUserId);
      const duration = Date.now() - startTime;

      expect(result).toEqual(mockFundingProof);
      expect(duration).toBeLessThan(100);
    });*/

    it('should load all user data within 200ms using batch load', async () => {
      const mockData = {
        passport: { id: 'passport-1', userId: testUserId },
        personalInfo: { id: 'personal-1', userId: testUserId },
        fundingProof: { id: 'funding-1', userId: testUserId }
      };

      SecureStorageService.batchLoad.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockData;
      });

      const startTime = Date.now();
      const result = await UserDataService.getAllUserData(testUserId);
      const duration = Date.now() - startTime;

      expect(result.passport).toBeDefined();
      expect(result.personalInfo).toBeDefined();
      expect(result.fundingProof).toBeDefined();
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Cache Performance', () => {
    it('should serve cached data in under 10ms', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      // First load - populate cache
      await UserDataService.getPassport(testUserId);

      // Second load - from cache
      const startTime = Date.now();
      const result = await UserDataService.getPassport(testUserId);
      const duration = Date.now() - startTime;

      expect(result).toEqual(mockPassport);
      expect(duration).toBeLessThan(10);
    });

    it('should achieve >80% cache hit rate in typical usage', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      // Simulate typical usage: 1 load, 9 reads
      await UserDataService.getPassport(testUserId); // miss
      for (let i = 0; i < 9; i++) {
        await UserDataService.getPassport(testUserId); // hits
      }

      const stats = UserDataService.getCacheStats();
      expect(stats.hitRate).toBeGreaterThanOrEqual(80);
      expect(stats.hits).toBe(9);
      expect(stats.misses).toBe(1);
    });

    it('should maintain cache performance with multiple data types', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      const mockPersonalInfo = { id: 'personal-1', userId: testUserId };

      Passport.load.mockResolvedValue(mockPassport);
      PersonalInfo.load.mockResolvedValue(mockPersonalInfo);

      // Load all data types once
      await UserDataService.getPassport(testUserId);
      await UserDataService.getPersonalInfo(testUserId);

      // Read multiple times
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await UserDataService.getPassport(testUserId);
        await UserDataService.getPersonalInfo(testUserId);
      }
      const duration = Date.now() - startTime;

      // 20 cached reads should be very fast
      expect(duration).toBeLessThan(100);

      const stats = UserDataService.getCacheStats();
      expect(stats.hits).toBe(20);
      expect(stats.misses).toBe(2);
    });
  });

  describe('Concurrent Access Performance', () => {
    it('should handle 10 concurrent reads efficiently', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockPassport;
      });

      const startTime = Date.now();
      const promises = Array(10).fill(null).map(() =>
        UserDataService.getPassport(testUserId)
      );
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All should return same data
      results.forEach(result => {
        expect(result).toEqual(mockPassport);
      });

      // Should complete in reasonable time (not 10x the single load time)
      expect(duration).toBeLessThan(500);
    });

    it('should handle 100 concurrent reads without errors', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      const promises = Array(100).fill(null).map(() =>
        UserDataService.getPassport(testUserId)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toEqual(mockPassport);
      });
    });

    it('should handle concurrent reads and writes', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'ZHANG, WEI',
        save: jest.fn().mockResolvedValue(true)
      };

      Passport.load.mockResolvedValue(mockPassport);
      UserDataService.updatePassport = jest.fn().mockResolvedValue();

      const reads = Array(5).fill(null).map(() =>
        UserDataService.getPassport(testUserId)
      );

      const writes = Array(5).fill(null).map((_, i) =>
        UserDataService.updatePassport('passport-1', {
          fullName: `ZHANG, WEI ${i}`
        })
      );

      const results = await Promise.all([...reads, ...writes]);

      expect(results).toHaveLength(10);
    });

    it('should handle concurrent access from multiple users', async () => {
      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

      Passport.load.mockImplementation(async (userId) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return {
          id: `passport-${userId}`,
          userId,
          passportNumber: `E${userId}`
        };
      });

      const startTime = Date.now();
      const promises = users.map(userId =>
        UserDataService.getPassport(userId)
      );
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.userId).toBe(users[index]);
      });

      // Should complete efficiently
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Batch Operation Performance', () => {
    it('should load all data faster with batch load than parallel load', async () => {
      const mockData = {
        passport: { id: 'passport-1', userId: testUserId },
        personalInfo: { id: 'personal-1', userId: testUserId },
      };

      // Mock batch load (fast)
      SecureStorageService.batchLoad.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockData;
      });

      // Mock individual loads (slower)
      Passport.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return mockData.passport;
      });
      PersonalInfo.load.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return mockData.personalInfo;
      });

      // Test batch load
      const batchStart = Date.now();
      await UserDataService.getAllUserData(testUserId, { useBatchLoad: true });
      const batchDuration = Date.now() - batchStart;

      // Clear cache
      UserDataService.clearCache();

      // Test parallel load
      const parallelStart = Date.now();
      await UserDataService.getAllUserData(testUserId, { useBatchLoad: false });
      const parallelDuration = Date.now() - parallelStart;

      console.log(`Batch load: ${batchDuration}ms, Parallel load: ${parallelDuration}ms`);

      // Batch should be faster or comparable
      expect(batchDuration).toBeLessThanOrEqual(parallelDuration + 10);
    });

    it('should handle batch updates efficiently', async () => {
      const currentData = {
        passport: {
          id: 'passport-1',
          userId: testUserId,
          passportNumber: 'E12345678'
        },
        personalInfo: {
          id: 'personal-1',
          userId: testUserId,
          email: 'test@example.com'
        },
      };

      SecureStorageService.batchLoad.mockResolvedValue(currentData);
      SecureStorageService.batchSave.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return [
          { type: 'passport', id: 'passport-1' },
          { type: 'personalInfo', id: 'personal-1' },
        ];
      });

      const updates = {
        passport: { fullName: 'ZHANG, WEI' },
        personalInfo: { phoneNumber: '+86 13812345678' },
      };

      const startTime = Date.now();
      await UserDataService.batchUpdate(testUserId, updates);
      const duration = Date.now() - startTime;

      // Should complete efficiently
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated cache operations', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await UserDataService.getPassport(testUserId);
        UserDataService.invalidateCache('passport', testUserId);
      }

      // Cache should not grow unbounded
      const cacheSize = UserDataService.cache.passport.size;
      expect(cacheSize).toBeLessThanOrEqual(10);
    });

    it('should clear cache efficiently', () => {
      // Populate cache with multiple users
      for (let i = 0; i < 100; i++) {
        UserDataService.cache.passport.set(`user-${i}`, { id: `passport-${i}` });
        UserDataService.cache.personalInfo.set(`user-${i}`, { id: `personal-${i}` });
      }

      const startTime = Date.now();
      UserDataService.clearCache();
      const duration = Date.now() - startTime;

      expect(UserDataService.cache.passport.size).toBe(0);
      expect(UserDataService.cache.personalInfo.size).toBe(0);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Cache Effectiveness Metrics', () => {
    it('should track cache statistics accurately', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      // Generate activity
      await UserDataService.getPassport(testUserId); // miss
      await UserDataService.getPassport(testUserId); // hit
      await UserDataService.getPassport(testUserId); // hit
      UserDataService.invalidateCache('passport', testUserId);
      await UserDataService.getPassport(testUserId); // miss
      await UserDataService.getPassport(testUserId); // hit

      const stats = UserDataService.getCacheStats();

      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.invalidations).toBe(1);
      expect(stats.totalRequests).toBe(5);
      expect(stats.hitRate).toBe(60);
    });

    it('should provide timing information', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      const stats = UserDataService.getCacheStats();

      expect(stats.lastReset).toBeDefined();
      expect(stats.timeSinceReset).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive reads', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        await UserDataService.getPassport(testUserId);
      }
      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);

      const stats = UserDataService.getCacheStats();
      expect(stats.hits).toBe(999);
      expect(stats.misses).toBe(1);
    });

    it('should handle rapid cache invalidations', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        await UserDataService.getPassport(testUserId);
        UserDataService.invalidateCache('passport', testUserId);
      }
      const duration = Date.now() - startTime;

      // Should handle gracefully
      expect(duration).toBeLessThan(1000);
    });
  });
});
