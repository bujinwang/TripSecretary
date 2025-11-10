// @ts-nocheck

/**
 * UserDataService Cache Tests
 * Tests for caching functionality including TTL, invalidation, and statistics
 */

import UserDataService from '../UserDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
// FundingProof removed - cache tests updated

// Mock the models
jest.mock('../../../models/Passport');
jest.mock('../../../models/PersonalInfo');
// FundingProof mock removed
jest.mock('../../security/SecureStorageService');

describe('UserDataService - Caching', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(() => {
    // Clear cache before each test
    UserDataService.clearCache();
    UserDataService.resetCacheStats();
    jest.clearAllMocks();
  });

  describe('Cache TTL (Time To Live)', () => {
    it('should have a 5-minute TTL configured', () => {
      expect(UserDataService.CACHE_TTL).toBe(5 * 60 * 1000);
    });

    it('should return cached data within TTL period', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        fullName: 'TEST USER'
      };

      Passport.load.mockResolvedValue(mockPassport);

      // First call - should load from database
      const result1 = await UserDataService.getPassport(testUserId);
      expect(result1).toEqual(mockPassport);
      expect(Passport.load).toHaveBeenCalledTimes(1);

      // Second call - should return from cache
      const result2 = await UserDataService.getPassport(testUserId);
      expect(result2).toEqual(mockPassport);
      expect(Passport.load).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should reload data after TTL expires', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678'
      };

      Passport.load.mockResolvedValue(mockPassport);

      // First call
      await UserDataService.getPassport(testUserId);
      expect(Passport.load).toHaveBeenCalledTimes(1);

      // Manually expire the cache by setting old timestamp
      const cacheKey = `passport_${testUserId}`;
      const expiredTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      UserDataService.cache.lastUpdate.set(cacheKey, expiredTime);

      // Second call - should reload from database
      await UserDataService.getPassport(testUserId);
      expect(Passport.load).toHaveBeenCalledTimes(2);
    });

    it('should validate cache correctly with isCacheValid', () => {
      const cacheKey = 'test_key';
      
      // No timestamp - should be invalid
      expect(UserDataService.isCacheValid(cacheKey)).toBe(false);

      // Fresh timestamp - should be valid
      UserDataService.cache.lastUpdate.set(cacheKey, Date.now());
      expect(UserDataService.isCacheValid(cacheKey)).toBe(true);

      // Expired timestamp - should be invalid
      const expiredTime = Date.now() - (6 * 60 * 1000);
      UserDataService.cache.lastUpdate.set(cacheKey, expiredTime);
      expect(UserDataService.isCacheValid(cacheKey)).toBe(false);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache on passport update', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: testUserId,
        passportNumber: 'E12345678',
        save: jest.fn().mockResolvedValue(true)
      };

      Passport.load.mockResolvedValue(mockPassport);

      // Load passport (caches it)
      await UserDataService.getPassport(testUserId);
      
      // Update passport (should invalidate cache)
      await UserDataService.updatePassport('passport-1', { passportNumber: 'E99999999' });

      // Verify cache was invalidated
      const stats = UserDataService.getCacheStats();
      expect(stats.invalidations).toBeGreaterThan(0);
    });

    it('should invalidate cache on personal info update', async () => {
      const mockPersonalInfo = {
        id: 'personal-1',
        userId: testUserId,
        email: 'test@example.com',
        update: jest.fn().mockResolvedValue(true)
      };

      PersonalInfo.load.mockResolvedValue(mockPersonalInfo);

      // Load personal info (caches it)
      await UserDataService.getPersonalInfo(testUserId);
      
      // Update personal info (should invalidate cache)
      await UserDataService.updatePersonalInfo('personal-1', { email: 'new@example.com' });

      // Verify cache was invalidated
      const stats = UserDataService.getCacheStats();
      expect(stats.invalidations).toBeGreaterThan(0);
    });

    it('should invalidate cache on funding proof update', async () => {
      const mockFundingProof = {
        id: 'funding-1',
        userId: testUserId,
        cashAmount: '10000',
        update: jest.fn().mockResolvedValue(true)
      };

      FundingProof.load.mockResolvedValue(mockFundingProof);

      // Load funding proof (caches it)
      await UserDataService.getFundingProof(testUserId);
      
      // Update funding proof (should invalidate cache)
      await UserDataService.updateFundingProof('funding-1', { cashAmount: '20000' });

      // Verify cache was invalidated
      const stats = UserDataService.getCacheStats();
      expect(stats.invalidations).toBeGreaterThan(0);
    });

    it('should invalidate specific data type and user', () => {
      // Set up cache
      UserDataService.cache.passport.set(testUserId, { id: 'test' });
      UserDataService.cache.lastUpdate.set(`passport_${testUserId}`, Date.now());

      // Invalidate
      UserDataService.invalidateCache('passport', testUserId);

      // Verify cache is cleared
      expect(UserDataService.cache.passport.has(testUserId)).toBe(false);
      expect(UserDataService.cache.lastUpdate.has(`passport_${testUserId}`)).toBe(false);
    });

    it('should track invalidation count', () => {
      UserDataService.resetCacheStats();
      
      UserDataService.invalidateCache('passport', testUserId);
      UserDataService.invalidateCache('personalInfo', testUserId);
      UserDataService.invalidateCache('fundingProof', testUserId);

      const stats = UserDataService.getCacheStats();
      expect(stats.invalidations).toBe(3);
    });
  });

  describe('Cache Hit/Miss Logging', () => {
    it('should record cache hits', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      Passport.load.mockResolvedValue(mockPassport);

      // First call - cache miss
      await UserDataService.getPassport(testUserId);
      
      // Second call - cache hit
      await UserDataService.getPassport(testUserId);

      const stats = UserDataService.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should record cache misses', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      Passport.load.mockResolvedValue(mockPassport);

      // First call - cache miss
      await UserDataService.getPassport(testUserId);

      const stats = UserDataService.getCacheStats();
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      Passport.load.mockResolvedValue(mockPassport);

      // 1 miss, 3 hits
      await UserDataService.getPassport(testUserId); // miss
      await UserDataService.getPassport(testUserId); // hit
      await UserDataService.getPassport(testUserId); // hit
      await UserDataService.getPassport(testUserId); // hit

      const stats = UserDataService.getCacheStats();
      expect(stats.totalRequests).toBe(4);
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(75); // 3/4 = 75%
    });

    it('should track cache statistics over time', async () => {
      UserDataService.resetCacheStats();
      
      const mockPassport = { id: 'passport-1', userId: testUserId };
      const mockPersonalInfo = { id: 'personal-1', userId: testUserId };
      
      Passport.load.mockResolvedValue(mockPassport);
      PersonalInfo.load.mockResolvedValue(mockPersonalInfo);

      // Generate some cache activity
      await UserDataService.getPassport(testUserId); // miss
      await UserDataService.getPassport(testUserId); // hit
      await UserDataService.getPersonalInfo(testUserId); // miss
      await UserDataService.getPersonalInfo(testUserId); // hit

      const stats = UserDataService.getCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.totalRequests).toBe(4);
      expect(stats.hitRate).toBe(50);
    });

    it('should provide getCacheStats method', () => {
      const stats = UserDataService.getCacheStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('invalidations');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('timeSinceReset');
      expect(stats).toHaveProperty('lastReset');
    });

    it('should reset cache statistics', () => {
      // Generate some activity
      UserDataService.recordCacheHit('passport', testUserId);
      UserDataService.recordCacheMiss('passport', testUserId);
      UserDataService.invalidateCache('passport', testUserId);

      // Reset
      UserDataService.resetCacheStats();

      const stats = UserDataService.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.invalidations).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache data', () => {
      // Populate cache
      UserDataService.cache.passport.set(testUserId, { id: 'test' });
      UserDataService.cache.personalInfo.set(testUserId, { id: 'test' });
      UserDataService.cache.fundingProof.set(testUserId, { id: 'test' });
      UserDataService.cache.lastUpdate.set('test_key', Date.now());

      // Clear cache
      UserDataService.clearCache();

      // Verify all caches are empty
      expect(UserDataService.cache.passport.size).toBe(0);
      expect(UserDataService.cache.personalInfo.size).toBe(0);
      expect(UserDataService.cache.fundingProof.size).toBe(0);
      expect(UserDataService.cache.lastUpdate.size).toBe(0);
    });

    it('should refresh cache for specific user', async () => {
      // Populate cache
      UserDataService.cache.passport.set(testUserId, { id: 'old-data' });
      UserDataService.cache.personalInfo.set(testUserId, { id: 'old-data' });
      UserDataService.cache.fundingProof.set(testUserId, { id: 'old-data' });
      UserDataService.updateCacheTimestamp(`passport_${testUserId}`);
      UserDataService.updateCacheTimestamp(`personalInfo_${testUserId}`);
      UserDataService.updateCacheTimestamp(`fundingProof_${testUserId}`);

      // Refresh cache
      await UserDataService.refreshCache(testUserId);

      // Verify user's cache is cleared
      expect(UserDataService.cache.passport.has(testUserId)).toBe(false);
      expect(UserDataService.cache.personalInfo.has(testUserId)).toBe(false);
      expect(UserDataService.cache.fundingProof.has(testUserId)).toBe(false);
    });

    it('should update cache timestamp', () => {
      const cacheKey = 'test_key';
      const beforeTime = Date.now();
      
      UserDataService.updateCacheTimestamp(cacheKey);
      
      const timestamp = UserDataService.cache.lastUpdate.get(cacheKey);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Cache Performance', () => {
    it('should cache all three data types independently', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      const mockPersonalInfo = { id: 'personal-1', userId: testUserId };
      const mockFundingProof = { id: 'funding-1', userId: testUserId };

      Passport.load.mockResolvedValue(mockPassport);
      PersonalInfo.load.mockResolvedValue(mockPersonalInfo);
      FundingProof.load.mockResolvedValue(mockFundingProof);

      // Load all data types
      await UserDataService.getPassport(testUserId);
      await UserDataService.getPersonalInfo(testUserId);
      await UserDataService.getFundingProof(testUserId);

      // Verify each was loaded once
      expect(Passport.load).toHaveBeenCalledTimes(1);
      expect(PersonalInfo.load).toHaveBeenCalledTimes(1);
      expect(FundingProof.load).toHaveBeenCalledTimes(1);

      // Load again - should use cache
      await UserDataService.getPassport(testUserId);
      await UserDataService.getPersonalInfo(testUserId);
      await UserDataService.getFundingProof(testUserId);

      // Verify still only loaded once each
      expect(Passport.load).toHaveBeenCalledTimes(1);
      expect(PersonalInfo.load).toHaveBeenCalledTimes(1);
      expect(FundingProof.load).toHaveBeenCalledTimes(1);

      // Verify cache stats
      const stats = UserDataService.getCacheStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(3);
    });

    it('should handle multiple users independently', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      const mockPassport1 = { id: 'passport-1', userId: user1 };
      const mockPassport2 = { id: 'passport-2', userId: user2 };

      Passport.load
        .mockResolvedValueOnce(mockPassport1)
        .mockResolvedValueOnce(mockPassport2);

      // Load for both users
      const result1 = await UserDataService.getPassport(user1);
      const result2 = await UserDataService.getPassport(user2);

      expect(result1).toEqual(mockPassport1);
      expect(result2).toEqual(mockPassport2);

      // Load again - should use cache
      await UserDataService.getPassport(user1);
      await UserDataService.getPassport(user2);

      // Verify each user's data was loaded only once
      expect(Passport.load).toHaveBeenCalledTimes(2);
    });
  });
});
