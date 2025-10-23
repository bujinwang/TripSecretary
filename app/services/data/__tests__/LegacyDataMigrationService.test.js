/**
 * LegacyDataMigrationService Test Suite
 * Tests for legacy data migration handling functionality
 * 
 * Requirements: 22.1-22.5
 */

import LegacyDataMigrationService from '../LegacyDataMigrationService';

// Mock dependencies
jest.mock('../../../services/security/SecureStorageService', () => ({
  default: {
    initialize: jest.fn(),
    needsMigration: jest.fn(),
  }
}));

jest.mock('../../../services/snapshot/SnapshotService', () => ({
  default: {
    list: jest.fn(),
    getAllSnapshots: jest.fn(),
    createSnapshot: jest.fn(),
  }
}));

jest.mock('../../entryPack/EntryPackService', () => ({
  default: {
    getHistoricalPacksForUser: jest.fn(),
  }
}));

describe('LegacyDataMigrationService', () => {
  const testUserId = 'test_user_123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLegacyDataStatus', () => {
    it('should detect legacy data correctly', async () => {
      // Mock legacy entry packs
      const mockLegacyPacks = [
        {
          id: 'legacy_pack_1',
          userId: testUserId,
          destinationId: 'thailand',
          status: 'completed',
          createdAt: '2023-12-01T00:00:00.000Z', // Before snapshot system
        }
      ];

      // Mock snapshots
      const mockSnapshots = [];

      // Mock the methods on the service instance
      const originalFindLegacyEntryPacks = LegacyDataMigrationService.findLegacyEntryPacks;
      LegacyDataMigrationService.findLegacyEntryPacks = jest.fn().mockResolvedValue(mockLegacyPacks);
      require('../../../services/snapshot/SnapshotService').default.list.mockResolvedValue(mockSnapshots);

      const status = await LegacyDataMigrationService.checkLegacyDataStatus(testUserId);

      expect(status.hasLegacyData).toBe(true);
      expect(status.legacyRecordCount).toBe(1);
      expect(status.snapshotRecordCount).toBe(0);
      expect(status.migrationNeeded).toBe(true);
      expect(status.migrationAvailable).toBe(true);

      // Restore original method
      LegacyDataMigrationService.findLegacyEntryPacks = originalFindLegacyEntryPacks;
    });

    it('should handle no legacy data', async () => {
      const originalFindLegacyEntryPacks = LegacyDataMigrationService.findLegacyEntryPacks;
      LegacyDataMigrationService.findLegacyEntryPacks = jest.fn().mockResolvedValue([]);
      require('../../../services/snapshot/SnapshotService').default.list.mockResolvedValue([]);

      const status = await LegacyDataMigrationService.checkLegacyDataStatus(testUserId);

      expect(status.hasLegacyData).toBe(false);
      expect(status.legacyRecordCount).toBe(0);
      expect(status.migrationNeeded).toBe(false);

      // Restore original method
      LegacyDataMigrationService.findLegacyEntryPacks = originalFindLegacyEntryPacks;
    });
  });

  describe('isLegacyEntryPack', () => {
    it('should identify legacy entry pack correctly', () => {
      const legacyPack = {
        id: 'legacy_pack_1',
        status: 'completed',
        createdAt: '2023-12-01T00:00:00.000Z', // Before snapshot system
      };

      const isLegacy = LegacyDataMigrationService.isLegacyEntryPack(legacyPack);
      expect(isLegacy).toBe(true);
    });

    it('should not identify new entry pack as legacy', () => {
      const newPack = {
        id: 'new_pack_1',
        status: 'completed',
        createdAt: '2024-06-01T00:00:00.000Z', // After snapshot system
        snapshotId: 'snapshot_123',
      };

      const isLegacy = LegacyDataMigrationService.isLegacyEntryPack(newPack);
      expect(isLegacy).toBe(false);
    });
  });

  describe('isMigrationEligible', () => {
    it('should identify eligible entry pack', () => {
      const eligiblePack = {
        userId: testUserId,
        destinationId: 'thailand',
        status: 'completed',
        createdAt: '2023-12-01T00:00:00.000Z',
      };

      const isEligible = LegacyDataMigrationService.isMigrationEligible(eligiblePack);
      expect(isEligible).toBe(true);
    });

    it('should reject ineligible entry pack', () => {
      const ineligiblePack = {
        // Missing required fields
        status: 'in_progress',
      };

      const isEligible = LegacyDataMigrationService.isMigrationEligible(ineligiblePack);
      expect(isEligible).toBe(false);
    });
  });

  describe('getLegacyDisplayInfo', () => {
    it('should generate correct display info for legacy record', () => {
      const legacyRecord = {
        id: 'legacy_pack_1',
        destinationId: 'thailand',
        status: 'completed',
        createdAt: '2023-12-01T00:00:00.000Z',
        arrivalDate: '2023-12-15T00:00:00.000Z',
      };

      const originalIsMigrationEligible = LegacyDataMigrationService.isMigrationEligible;
      LegacyDataMigrationService.isMigrationEligible = jest.fn().mockReturnValue(true);

      const displayInfo = LegacyDataMigrationService.getLegacyDisplayInfo(legacyRecord);

      expect(displayInfo.type).toBe('legacy');
      expect(displayInfo.isLegacy).toBe(true);
      expect(displayInfo.destination).toBe('泰国');
      expect(displayInfo.legacyBadge.show).toBe(true);
      expect(displayInfo.legacyBadge.text).toBe('旧版本记录');
      expect(displayInfo.actions.canMigrate).toBe(true);

      // Restore original method
      LegacyDataMigrationService.isMigrationEligible = originalIsMigrationEligible;
    });
  });

  describe('createMixedHistoryList', () => {
    it('should create mixed list with snapshots and legacy records', async () => {
      const mockSnapshots = [
        {
          snapshotId: 'snapshot_1',
          entryPackId: 'pack_1',
          destinationId: 'thailand',
          status: 'completed',
          createdAt: '2024-01-15T00:00:00.000Z',
          arrivalDate: '2024-01-20T00:00:00.000Z',
        }
      ];

      const mockLegacyPacks = [
        {
          id: 'legacy_pack_1',
          destinationId: 'japan',
          status: 'completed',
          createdAt: '2023-12-01T00:00:00.000Z',
          arrivalDate: '2023-12-15T00:00:00.000Z',
          migrationEligible: true,
        }
      ];

      const originalFindLegacyEntryPacks = LegacyDataMigrationService.findLegacyEntryPacks;
      const originalGetLegacyDisplayInfo = LegacyDataMigrationService.getLegacyDisplayInfo;

      require('../../../services/snapshot/SnapshotService').default.list.mockResolvedValue(mockSnapshots);
      LegacyDataMigrationService.findLegacyEntryPacks = jest.fn().mockResolvedValue(mockLegacyPacks);
      LegacyDataMigrationService.getLegacyDisplayInfo = jest.fn().mockReturnValue({
        id: 'legacy_pack_1',
        type: 'legacy',
        destinationId: 'japan',
        destination: '日本',
      });

      const mixedHistory = await LegacyDataMigrationService.createMixedHistoryList(testUserId);

      expect(mixedHistory).toHaveLength(2);
      expect(mixedHistory.some(item => item.type === 'snapshot')).toBe(true);
      expect(mixedHistory.some(item => item.type === 'legacy')).toBe(true);

      // Restore original methods
      LegacyDataMigrationService.findLegacyEntryPacks = originalFindLegacyEntryPacks;
      LegacyDataMigrationService.getLegacyDisplayInfo = originalGetLegacyDisplayInfo;
    });
  });

  describe('getMigrationStats', () => {
    it('should calculate migration statistics correctly', async () => {
      const mockMixedHistory = [
        { type: 'snapshot', id: 'snapshot_1' },
        { type: 'legacy', id: 'legacy_1', migrationEligible: true },
        { type: 'legacy', id: 'legacy_2', migrationEligible: false },
      ];

      const originalCreateMixedHistoryList = LegacyDataMigrationService.createMixedHistoryList;
      LegacyDataMigrationService.createMixedHistoryList = jest.fn().mockResolvedValue(mockMixedHistory);

      const stats = await LegacyDataMigrationService.getMigrationStats(testUserId);

      expect(stats.totalRecords).toBe(3);
      expect(stats.snapshotRecords).toBe(1);
      expect(stats.legacyRecords).toBe(2);
      expect(stats.migrationEligible).toBe(1);

      // Restore original method
      LegacyDataMigrationService.createMixedHistoryList = originalCreateMixedHistoryList;
    });
  });
});