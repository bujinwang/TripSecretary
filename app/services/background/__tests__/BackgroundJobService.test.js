/**
 * BackgroundJobService Tests
 * 
 * Tests for automatic entry pack archival functionality
 */

import BackgroundJobService from '../BackgroundJobService';
import EntryPackService from '../../entryPack/EntryPackService';
import UserDataService from '../../data/UserDataService';

// Mock dependencies
jest.mock('../../entryPack/EntryPackService');
jest.mock('../../data/UserDataService');
jest.mock('../../notification/NotificationCoordinator');
jest.mock('../../notification/NotificationPreferencesService');

describe('BackgroundJobService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    BackgroundJobService.stop(); // Ensure clean state
    BackgroundJobService.clearStats();
  });

  afterEach(() => {
    BackgroundJobService.stop(); // Clean up after tests
  });

  describe('Service Lifecycle', () => {
    test('should start and stop service correctly', async () => {
      expect(BackgroundJobService.isRunning).toBe(false);
      
      await BackgroundJobService.start();
      expect(BackgroundJobService.isRunning).toBe(true);
      
      BackgroundJobService.stop();
      expect(BackgroundJobService.isRunning).toBe(false);
    });

    test('should not start if already running', async () => {
      await BackgroundJobService.start();
      const consoleSpy = jest.spyOn(console, 'log');
      
      await BackgroundJobService.start();
      expect(consoleSpy).toHaveBeenCalledWith('BackgroundJobService is already running');
      
      BackgroundJobService.stop();
    });

    test('should get service statistics', () => {
      const stats = BackgroundJobService.getStats();
      
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('checkInterval');
      expect(stats).toHaveProperty('lastCheckTime');
      expect(stats).toHaveProperty('stats');
      expect(stats.stats).toHaveProperty('totalChecks');
      expect(stats.stats).toHaveProperty('totalArchived');
    });
  });

  describe('Archival Logic', () => {
    test('should determine entry pack needs archival when expired', async () => {
      const mockEntryPack = {
        id: 'pack_001',
        entryInfoId: 'entry_001',
        status: 'submitted'
      };

      const mockEntryInfo = {
        arrivalDate: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      };

      // Mock EntryInfo.load
      const EntryInfo = require('../../../models/EntryInfo').default;
      EntryInfo.load = jest.fn().mockResolvedValue(mockEntryInfo);

      const now = new Date();
      const result = await BackgroundJobService.shouldArchiveEntryPack(mockEntryPack, now);

      expect(result.archive).toBe(true);
      expect(result.reason).toBe('Arrival date + 24h passed');
      expect(result.hoursOverdue).toBeGreaterThan(0);
    });

    test('should not archive entry pack when not expired', async () => {
      const mockEntryPack = {
        id: 'pack_001',
        entryInfoId: 'entry_001',
        status: 'submitted'
      };

      const mockEntryInfo = {
        arrivalDate: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() // 25 hours from now
      };

      // Mock EntryInfo.load
      const EntryInfo = require('../../../models/EntryInfo').default;
      EntryInfo.load = jest.fn().mockResolvedValue(mockEntryInfo);

      const now = new Date();
      const result = await BackgroundJobService.shouldArchiveEntryPack(mockEntryPack, now);

      expect(result.archive).toBe(false);
      expect(result.reason).toBe('Not yet expired');
      expect(result.hoursRemaining).toBeGreaterThan(0);
    });

    test('should handle missing arrival date', async () => {
      const mockEntryPack = {
        id: 'pack_001',
        entryInfoId: 'entry_001',
        status: 'submitted'
      };

      const mockEntryInfo = {
        arrivalDate: null
      };

      // Mock EntryInfo.load
      const EntryInfo = require('../../../models/EntryInfo').default;
      EntryInfo.load = jest.fn().mockResolvedValue(mockEntryInfo);

      const now = new Date();
      const result = await BackgroundJobService.shouldArchiveEntryPack(mockEntryPack, now);

      expect(result.archive).toBe(false);
      expect(result.reason).toBe('No arrival date set');
    });
  });

  describe('Manual Check', () => {
    test('should run manual check for specific user', async () => {
      const userId = 'user_001';
      
      // Mock dependencies
      UserDataService.initialize = jest.fn().mockResolvedValue();
      EntryPackService.getActivePacksForUser = jest.fn().mockResolvedValue([]);

      const result = await BackgroundJobService.runManualCheck(userId);

      expect(result.success).toBe(true);
      expect(result.usersChecked).toBe(1);
      expect(result.packsArchived).toBe(0);
      expect(UserDataService.initialize).toHaveBeenCalledWith(userId);
    });

    test('should handle manual check errors gracefully', async () => {
      const userId = 'user_001';
      
      // Mock error
      UserDataService.initialize = jest.fn().mockRejectedValue(new Error('Test error'));

      const result = await BackgroundJobService.runManualCheck(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Configuration', () => {
    test('should update check interval', () => {
      const newInterval = 2 * 60 * 60 * 1000; // 2 hours
      
      BackgroundJobService.setCheckInterval(newInterval);
      
      const stats = BackgroundJobService.getStats();
      expect(stats.checkInterval).toBe(newInterval);
    });

    test('should reject invalid check interval', () => {
      expect(() => {
        BackgroundJobService.setCheckInterval(30000); // 30 seconds - too short
      }).toThrow('Check interval must be at least 1 minute');
    });

    test('should clear statistics', () => {
      // Set some stats first
      BackgroundJobService.stats.totalChecks = 5;
      BackgroundJobService.stats.totalArchived = 2;
      
      BackgroundJobService.clearStats();
      
      const stats = BackgroundJobService.getStats();
      expect(stats.stats.totalChecks).toBe(0);
      expect(stats.stats.totalArchived).toBe(0);
    });
  });
});