/**
 * PassportDataService Cache Tests
 * Tests for caching functionality including TTL, invalidation, and statistics
 */

import PassportDataService from '../PassportDataService';
import Passport from '../../../models/Passport';
import PersonalInfo from '../../../models/PersonalInfo';
import FundingProof from '../../../models/FundingProof';

// Mock the models
jest.mock('../../../models/Passport');
jest.mock('../../../models/PersonalInfo');
jest.mock('../../../models/FundingProof');
jest.mock('../../security/SecureStorageService');

describe('PassportDataService - Caching', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(() => {
    // Clear cache before each test
    PassportDataService.clearCache();
    PassportDataService.resetCacheStats();
    jest.clearAllMocks();
  });

  describe('Cache TTL (Time To Live)', () => {
    it('should have a 5-minute TTL configured', () => {
      expect(PassportDataService.CACHE_TTL).toBe(5 * 60 * 1000);
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
      const result1 = await PassportDataService.getPassport(testUserId);
      expect(result1).toEqual(mockPassport);
      expect(Passport.load).toHaveBeenCalledTimes(1);

      // Second call - should return from cache
      const result2 = await PassportDataService.getPassport(testUserId);
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
      await PassportDataService.getPassport(testUserId);
      expect(Passport.load).toHaveBeenCalledTimes(1);

      // Manually expire the cache by setting old timestamp
      const cacheKey = `passport_${testUserId}`;
      const expiredTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      PassportDataService.cache.lastUpdate.set(cacheKey, expiredTime);

      // Second call - should reload from database
      await PassportDataService.getPassport(testUserId);
      expect(Passport.load).toHaveBeenCalledTimes(2);
    });

    it('should validate cache correctly with isCacheValid', () => {
      const cacheKey = 'test_key';
      
      // No timestamp - should be invalid
      expect(PassportDataService.isCacheValid(cacheKey)).toBe(false);

      // Fresh timestamp - should be valid
      PassportDataService.cache.lastUpdate.set(cacheKey, Date.now());
      expect(PassportDataService.isCacheValid(cacheKey)).toBe(true);

      // Expired timestamp - should be invalid
      const expiredTime = Date.now() - (6 * 60 * 1000);
      PassportDataService.cache.lastUpdate.set(cacheKey, expiredTime);
      expect(PassportDataService.isCacheValid(cacheKey)).toBe(false);
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
      await PassportDataService.getPassport(testUserId);
      
      // Update passport (should invalidate cache)
      await PassportDataService.updatePassport('passport-1', { passportNumber: 'E99999999' });

      // Verify cache was invalidated
      const stats = PassportDataService.getCacheStats();
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
      await PassportDataService.getPersonalInfo(testUserId);
      
      // Update personal info (should invalidate cache)
      await PassportDataService.updatePersonalInfo('personal-1', { email: 'new@example.com' });

      // Verify cache was invalidated
      const stats = PassportDataService.getCacheStats();
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
      await PassportDataService.getFundingProof(testUserId);
      
      // Update funding proof (should invalidate cache)
      await PassportDataService.updateFundingProof('funding-1', { cashAmount: '20000' });

      // Verify cache was invalidated
      const stats = PassportDataService.getCacheStats();
      expect(stats.invalidations).toBeGreaterThan(0);
    });

    it('should invalidate specific data type and user', () => {
      // Set up cache
      PassportDataService.cache.passport.set(testUserId, { id: 'test' });
      PassportDataService.cache.lastUpdate.set(`passport_${testUserId}`, Date.now());

      // Invalidate
      PassportDataService.invalidateCache('passport', testUserId);

      // Verify cache is cleared
      expect(PassportDataService.cache.passport.has(testUserId)).toBe(false);
      expect(PassportDataService.cache.lastUpdate.has(`passport_${testUserId}`)).toBe(false);
    });

    it('should track invalidation count', () => {
      PassportDataService.resetCacheStats();
      
      PassportDataService.invalidateCache('passport', testUserId);
      PassportDataService.invalidateCache('personalInfo', testUserId);
      PassportDataService.invalidateCache('fundingProof', testUserId);

      const stats = PassportDataService.getCacheStats();
      expect(stats.invalidations).toBe(3);
    });
  });

  describe('Cache Hit/Miss Logging', () => {
    it('should record cache hits', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      Passport.load.mockResolvedValue(mockPassport);

      // First call - cache miss
      await PassportDataService.getPassport(testUserId);
      
      // Second call - cache hit
      await PassportDataService.getPassport(testUserId);

      const stats = PassportDataService.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should record cache misses', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      Passport.load.mockResolvedValue(mockPassport);

      // First call - cache miss
      await PassportDataService.getPassport(testUserId);

      const stats = PassportDataService.getCacheStats();
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      const mockPassport = { id: 'passport-1', userId: testUserId };
      Passport.load.mockResolvedValue(mockPassport);

      // 1 miss, 3 hits
      await PassportDataService.getPassport(testUserId); // miss
      await PassportDataService.getPassport(testUserId); // hit
      await PassportDataService.getPassport(testUserId); // hit
      await PassportDataService.getPassport(testUserId); // hit

      const stats = PassportDataService.getCacheStats();
      expect(stats.totalRequests).toBe(4);
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(75); // 3/4 = 75%
    });

    it('should track cache statistics over time', async () => {
      PassportDataService.resetCacheStats();
      
      const mockPassport = { id: 'passport-1', userId: testUserId };
      const mockPersonalInfo = { id: 'personal-1', userId: testUserId };
      
      Passport.load.mockResolvedValue(mockPassport);
      PersonalInfo.load.mockResolvedValue(mockPersonalInfo);

      // Generate some cache activity
      await PassportDataService.getPassport(testUserId); // miss
      await PassportDataService.getPassport(testUserId); // hit
      await PassportDataService.getPersonalInfo(testUserId); // miss
      await PassportDataService.getPersonalInfo(testUserId); // hit

      const stats = PassportDataService.getCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.totalRequests).toBe(4);
      expect(stats.hitRate).toBe(50);
    });

    it('should provide getCacheStats method', () => {
      const stats = PassportDataService.getCacheStats();
      
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
      PassportDataService.recordCacheHit('passport', testUserId);
      PassportDataService.recordCacheMiss('passport', testUserId);
      PassportDataService.invalidateCache('passport', testUserId);

      // Reset
      PassportDataService.resetCacheStats();

      const stats = PassportDataService.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.invalidations).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache data', () => {
      // Populate cache
      PassportDataService.cache.passport.set(testUserId, { id: 'test' });
      PassportDataService.cache.personalInfo.set(testUserId, { id: 'test' });
      PassportDataService.cache.fundingProof.set(testUserId, { id: 'test' });
      PassportDataService.cache.lastUpdate.set('test_key', Date.now());

      // Clear cache
      PassportDataService.clearCache();

      // Verify all caches are empty
      expect(PassportDataService.cache.passport.size).toBe(0);
      expect(PassportDataService.cache.personalInfo.size).toBe(0);
      expect(PassportDataService.cache.fundingProof.size).toBe(0);
      expect(PassportDataService.cache.lastUpdate.size).toBe(0);
    });

    it('should refresh cache for specific user', async () => {
      // Populate cache
      PassportDataService.cache.passport.set(testUserId, { id: 'old-data' });
      PassportDataService.cache.personalInfo.set(testUserId, { id: 'old-data' });
      PassportDataService.cache.fundingProof.set(testUserId, { id: 'old-data' });
      PassportDataService.updateCacheTimestamp(`passport_${testUserId}`);
      PassportDataService.updateCacheTimestamp(`personalInfo_${testUserId}`);
      PassportDataService.updateCacheTimestamp(`fundingProof_${testUserId}`);

      // Refresh cache
      await PassportDataService.refreshCache(testUserId);

      // Verify user's cache is cleared
      expect(PassportDataService.cache.passport.has(testUserId)).toBe(false);
      expect(PassportDataService.cache.personalInfo.has(testUserId)).toBe(false);
      expect(PassportDataService.cache.fundingProof.has(testUserId)).toBe(false);
    });

    it('should update cache timestamp', () => {
      const cacheKey = 'test_key';
      const beforeTime = Date.now();
      
      PassportDataService.updateCacheTimestamp(cacheKey);
      
      const timestamp = PassportDataService.cache.lastUpdate.get(cacheKey);
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
      await PassportDataService.getPassport(testUserId);
      await PassportDataService.getPersonalInfo(testUserId);
      await PassportDataService.getFundingProof(testUserId);

      // Verify each was loaded once
      expect(Passport.load).toHaveBeenCalledTimes(1);
      expect(PersonalInfo.load).toHaveBeenCalledTimes(1);
      expect(FundingProof.load).toHaveBeenCalledTimes(1);

      // Load again - should use cache
      await PassportDataService.getPassport(testUserId);
      await PassportDataService.getPersonalInfo(testUserId);
      await PassportDataService.getFundingProof(testUserId);

      // Verify still only loaded once each
      expect(Passport.load).toHaveBeenCalledTimes(1);
      expect(PersonalInfo.load).toHaveBeenCalledTimes(1);
      expect(FundingProof.load).toHaveBeenCalledTimes(1);

      // Verify cache stats
      const stats = PassportDataService.getCacheStats();
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
      const result1 = await PassportDataService.getPassport(user1);
      const result2 = await PassportDataService.getPassport(user2);

      expect(result1).toEqual(mockPassport1);
      expect(result2).toEqual(mockPassport2);

      // Load again - should use cache
      await PassportDataService.getPassport(user1);
      await PassportDataService.getPassport(user2);

      // Verify each user's data was loaded only once
      expect(Passport.load).toHaveBeenCalledTimes(2);
    });
  });
});
