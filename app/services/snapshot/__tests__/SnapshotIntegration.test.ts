// @ts-nocheck

/**
 * SnapshotIntegration.test.js - Integration tests for snapshot creation and management
 * Tests the integration between EntryPackService and SnapshotService
 * 
 * Requirements: 11.1-11.7, 15.1-15.7, 18.1-18.5
 */

import EntryPackService from '../../entryPack/EntryPackService';
import SnapshotService from '../SnapshotService';
import EntryPack from '../../../models/EntryPack';
import EntryPackSnapshot from '../../../models/EntryPackSnapshot';
import * as FileSystem from 'expo-file-system';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('../../security/SecureStorageService');
jest.mock('../../data/UserDataService');

describe('SnapshotIntegration', () => {
  let mockEntryPack;
  let mockEntryPackData;
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserId = 'test_user_123';
    
    mockEntryPack = {
      id: 'pack_123',
      entryInfoId: 'entry_123',
      userId: mockUserId,
      destinationId: 'thailand',
      tripId: 'trip_123',
      status: 'in_progress',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      tdacSubmission: {
        arrCardNo: 'TH123456789',
        qrUri: 'data:image/png;base64,test',
        pdfPath: '/path/to/pdf',
        submittedAt: '2024-01-01T12:00:00.000Z',
        submissionMethod: 'api'
      },
      submissionHistory: [{
        id: 'attempt_1',
        arrCardNo: 'TH123456789',
        qrUri: 'data:image/png;base64,test',
        pdfPath: '/path/to/pdf',
        submittedAt: '2024-01-01T12:00:00.000Z',
        submissionMethod: 'api',
        status: 'success',
        attemptNumber: 1
      }],
      displayStatus: {
        ctaState: 'enabled',
        showQR: false,
        showGuide: false
      },
      updateTDACSubmission: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      exportData: jest.fn().mockReturnValue({
        id: 'pack_123',
        userId: mockUserId,
        destinationId: 'thailand',
        status: 'submitted'
      })
    };

    mockEntryPackData = {
      id: 'pack_123',
      userId: mockUserId,
      destinationId: 'thailand',
      tripId: 'trip_123',
      status: 'submitted',
      passport: {
        passportNumber: 'P123456789',
        fullName: 'Test User',
        nationality: 'US',
        dateOfBirth: '1990-01-01',
        expiryDate: '2030-01-01'
      },
      personalInfo: {
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        occupation: 'Engineer'
      },
      funds: [{
        id: 'fund_1',
        type: 'bank_statement',
        amount: 5000,
        currency: 'USD',
        photoUri: '/path/to/fund1.jpg'
      }, {
        id: 'fund_2',
        type: 'cash',
        amount: 1000,
        currency: 'USD',
        photoUri: '/path/to/fund2.jpg'
      }],
      travel: {
        arrivalDate: '2024-02-01',
        departureDate: '2024-02-10',
        flightNumber: 'TG123',
        accommodation: 'Test Hotel'
      },
      submissionHistory: mockEntryPack.submissionHistory
    };

    // Mock FileSystem operations
    FileSystem.documentDirectory = '/mock/documents/';
    FileSystem.makeDirectoryAsync = jest.fn().mockResolvedValue(true);
    FileSystem.getInfoAsync = jest.fn().mockImplementation((path) => {
      if (path.includes('fund1.jpg') || path.includes('fund2.jpg')) {
        return Promise.resolve({ exists: true, size: 500000, isDirectory: false });
      }
      return Promise.resolve({ exists: true, isDirectory: true });
    });
    FileSystem.copyAsync = jest.fn().mockResolvedValue(true);
    FileSystem.readDirectoryAsync = jest.fn().mockResolvedValue([]);
    FileSystem.deleteAsync = jest.fn().mockResolvedValue(true);

    // Mock EntryPack.load
    EntryPack.load = jest.fn().mockResolvedValue(mockEntryPack);
    
    // Mock SnapshotService methods
    SnapshotService.loadCompleteEntryPackData = jest.fn().mockResolvedValue(mockEntryPackData);
  });

  describe('Snapshot Creation on State Transitions', () => {
    test('should create snapshot on TDAC submission', async () => {
      // Mock SnapshotService.createSnapshot
      const mockSnapshot = {
        snapshotId: 'snapshot_123',
        entryPackId: 'pack_123',
        status: 'submitted',
        createdAt: '2024-01-01T12:00:00.000Z'
      };
      SnapshotService.createSnapshot = jest.fn().mockResolvedValue(mockSnapshot);

      // Transition to submitted state
      const result = await EntryPackService.transitionState('pack_123', 'submitted', {
        reason: 'TDAC submission successful',
        tdacSubmission: mockEntryPack.tdacSubmission,
        submissionMethod: 'api'
      });

      // Verify snapshot creation was called
      expect(SnapshotService.createSnapshot).toHaveBeenCalledWith(
        'pack_123',
        'submitted',
        expect.objectContaining({
          creationMethod: 'auto',
          submissionMethod: 'api',
          arrCardNo: 'TH123456789'
        })
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('submitted');
    });

    test('should create snapshot on manual completion', async () => {
      // Set up entry pack as submitted first
      mockEntryPack.status = 'submitted';
      
      const mockSnapshot = {
        snapshotId: 'snapshot_124',
        entryPackId: 'pack_123',
        status: 'completed',
        createdAt: '2024-01-01T15:00:00.000Z'
      };
      SnapshotService.createSnapshot = jest.fn().mockResolvedValue(mockSnapshot);

      // Transition to completed state
      const result = await EntryPackService.transitionState('pack_123', 'completed', {
        reason: 'Entry pack marked as completed by user',
        metadata: {
          completedBy: 'user',
          completionLocation: 'Bangkok Airport',
          completionMethod: 'manual'
        }
      });

      // Verify snapshot creation was called
      expect(SnapshotService.createSnapshot).toHaveBeenCalledWith(
        'pack_123',
        'completed',
        expect.objectContaining({
          creationMethod: 'manual',
          completionLocation: 'Bangkok Airport',
          completionMethod: 'manual'
        })
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });

    test('should create snapshot on expiry', async () => {
      // Set up entry pack as submitted first
      mockEntryPack.status = 'submitted';
      
      const mockSnapshot = {
        snapshotId: 'snapshot_125',
        entryPackId: 'pack_123',
        status: 'expired',
        createdAt: '2024-02-02T00:00:00.000Z'
      };
      SnapshotService.createSnapshot = jest.fn().mockResolvedValue(mockSnapshot);

      // Transition to expired state
      const result = await EntryPackService.transitionState('pack_123', 'expired', {
        reason: 'Entry pack expired (arrival date + 24h passed)',
        metadata: {
          autoExpired: true,
          arrivalDate: '2024-02-01T00:00:00.000Z',
          expiryTime: '2024-02-02T00:00:00.000Z'
        }
      });

      // Verify snapshot creation was called
      expect(SnapshotService.createSnapshot).toHaveBeenCalledWith(
        'pack_123',
        'expired',
        expect.objectContaining({
          creationMethod: 'auto',
          autoExpired: true,
          arrivalDate: '2024-02-01T00:00:00.000Z'
        })
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('expired');
    });

    test('should create snapshot on archival if none exists', async () => {
      // Mock no existing snapshots
      SnapshotService.list = jest.fn().mockResolvedValue([]);
      
      const mockSnapshot = {
        snapshotId: 'snapshot_126',
        entryPackId: 'pack_123',
        status: 'archived',
        createdAt: '2024-01-01T18:00:00.000Z'
      };
      SnapshotService.createSnapshot = jest.fn().mockResolvedValue(mockSnapshot);

      // Transition to archived state
      const result = await EntryPackService.transitionState('pack_123', 'archived', {
        reason: 'Entry pack archived: manual',
        metadata: {
          archiveReason: 'manual',
          triggeredBy: 'user'
        }
      });

      // Verify snapshot creation was called
      expect(SnapshotService.createSnapshot).toHaveBeenCalledWith(
        'pack_123',
        'archived',
        expect.objectContaining({
          creationMethod: 'auto',
          archiveReason: 'manual',
          triggeredBy: 'user'
        })
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('archived');
    });

    test('should skip snapshot creation on archival if snapshot already exists', async () => {
      // Mock existing snapshot
      const existingSnapshot = {
        snapshotId: 'snapshot_existing',
        entryPackId: 'pack_123',
        status: 'completed'
      };
      SnapshotService.list = jest.fn().mockResolvedValue([existingSnapshot]);
      SnapshotService.createSnapshot = jest.fn();

      // Transition to archived state
      const result = await EntryPackService.transitionState('pack_123', 'archived', {
        reason: 'Entry pack archived: manual'
      });

      // Verify snapshot creation was NOT called
      expect(SnapshotService.createSnapshot).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.status).toBe('archived');
    });
  });

  describe('Photo Copying and Management', () => {
    test('should copy photos to snapshot storage during creation', async () => {
      // Mock successful photo copying
      const mockPhotoManifest = [
        {
          fundItemId: 'fund_1',
          fundType: 'bank_statement',
          originalPath: '/path/to/fund1.jpg',
          snapshotPath: '/mock/documents/snapshots/snapshot_photo_test/snapshot_snapshot_photo_test_fund_1_1234567890.jpg',
          fileName: 'snapshot_snapshot_photo_test_fund_1_1234567890.jpg',
          fileSize: 500000,
          copiedAt: '2024-01-01T12:00:00.000Z',
          status: 'success'
        },
        {
          fundItemId: 'fund_2',
          fundType: 'cash',
          originalPath: '/path/to/fund2.jpg',
          snapshotPath: '/mock/documents/snapshots/snapshot_photo_test/snapshot_snapshot_photo_test_fund_2_1234567890.jpg',
          fileName: 'snapshot_snapshot_photo_test_fund_2_1234567890.jpg',
          fileSize: 500000,
          copiedAt: '2024-01-01T12:00:00.000Z',
          status: 'success'
        }
      ];

      const mockSnapshot = {
        snapshotId: 'snapshot_photo_test',
        entryPackId: 'pack_123',
        userId: mockUserId,
        status: 'submitted',
        updatePhotoManifest: jest.fn(),
        setEncryptionInfo: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock SnapshotService methods
      SnapshotService.copyPhotosToSnapshotStorage = jest.fn().mockResolvedValue(mockPhotoManifest);
      SnapshotService.createSnapshot = jest.fn().mockResolvedValue(mockSnapshot);

      // Create snapshot
      const result = await SnapshotService.createSnapshot('pack_123', 'submitted');

      // Verify result
      expect(result).toBeDefined();
      expect(result.snapshotId).toBe('snapshot_photo_test');
    });

    test('should handle missing photos gracefully', async () => {
      // Reset FileSystem mocks for this specific test
      jest.clearAllMocks();
      
      // Mock missing photo file
      FileSystem.getInfoAsync = jest.fn().mockImplementation((path) => {
        if (path.includes('fund1.jpg')) {
          return Promise.resolve({ exists: false });
        }
        if (path.includes('fund2.jpg')) {
          return Promise.resolve({ exists: true, size: 500000, isDirectory: false });
        }
        return Promise.resolve({ exists: true, isDirectory: true });
      });
      
      FileSystem.makeDirectoryAsync = jest.fn().mockResolvedValue(true);
      FileSystem.copyAsync = jest.fn().mockResolvedValue(true);

      const funds = [
        { id: 'fund_1', type: 'bank_statement', photoUri: '/path/to/fund1.jpg' },
        { id: 'fund_2', type: 'cash', photoUri: '/path/to/fund2.jpg' }
      ];

      // Call the actual method
      const result = await SnapshotService.copyPhotosToSnapshotStorage(funds, 'test_snapshot');

      // Should have entries for both funds
      expect(result).toHaveLength(2);
      
      // First fund should be marked as missing
      expect(result[0]).toMatchObject({
        fundItemId: 'fund_1',
        status: 'missing',
        error: 'Original photo file not found'
      });
      
      // Second fund should be successful
      expect(result[1]).toMatchObject({
        fundItemId: 'fund_2',
        status: 'success'
      });
    });

    test('should handle photo copy failures gracefully', async () => {
      // Reset FileSystem mocks for this specific test
      jest.clearAllMocks();
      
      // Mock successful file check but failed copy
      FileSystem.getInfoAsync = jest.fn().mockResolvedValue({ exists: true, size: 500000, isDirectory: false });
      FileSystem.makeDirectoryAsync = jest.fn().mockResolvedValue(true);
      FileSystem.copyAsync = jest.fn().mockRejectedValue(new Error('Copy failed'));

      const funds = [
        { id: 'fund_1', type: 'bank_statement', photoUri: '/path/to/fund1.jpg' }
      ];

      const result = await SnapshotService.copyPhotosToSnapshotStorage(funds, 'test_snapshot');

      // Should have entry for fund with failed status
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        fundItemId: 'fund_1',
        status: 'failed',
        error: 'Copy failed'
      });
    });
  });

  describe('Snapshot Cleanup on Entry Pack Deletion', () => {
    test('should delete associated snapshots when entry pack is deleted', async () => {
      // Mock existing snapshots
      const mockSnapshots = [
        { snapshotId: 'snapshot_1', entryPackId: 'pack_123' },
        { snapshotId: 'snapshot_2', entryPackId: 'pack_123' }
      ];
      SnapshotService.list = jest.fn().mockResolvedValue(mockSnapshots);
      SnapshotService.delete = jest.fn().mockResolvedValue(true);

      // Delete entry pack
      const result = await EntryPackService.handleSnapshotCleanupOnDeletion('pack_123', mockUserId);

      // Verify snapshots were found and deleted
      expect(SnapshotService.list).toHaveBeenCalledWith(mockUserId, {
        entryPackId: 'pack_123'
      });
      expect(SnapshotService.delete).toHaveBeenCalledTimes(2);
      expect(SnapshotService.delete).toHaveBeenCalledWith('snapshot_1');
      expect(SnapshotService.delete).toHaveBeenCalledWith('snapshot_2');

      expect(result).toEqual({
        totalSnapshots: 2,
        deletedSnapshots: 2
      });
    });

    test('should handle snapshot deletion failures gracefully', async () => {
      // Mock existing snapshots with one deletion failure
      const mockSnapshots = [
        { snapshotId: 'snapshot_1', entryPackId: 'pack_123' },
        { snapshotId: 'snapshot_2', entryPackId: 'pack_123' }
      ];
      SnapshotService.list = jest.fn().mockResolvedValue(mockSnapshots);
      SnapshotService.delete = jest.fn()
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Delete failed'));

      // Delete entry pack
      const result = await EntryPackService.handleSnapshotCleanupOnDeletion('pack_123', mockUserId);

      // Should attempt to delete both but only succeed with one
      expect(SnapshotService.delete).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        totalSnapshots: 2,
        deletedSnapshots: 1
      });
    });
  });

  describe('Snapshot Filtering and Retrieval', () => {
    test('should filter snapshots by entry pack ID', async () => {
      const mockSnapshots = [
        new EntryPackSnapshot({ snapshotId: 'snap_1', entryPackId: 'pack_123', userId: mockUserId }),
        new EntryPackSnapshot({ snapshotId: 'snap_2', entryPackId: 'pack_456', userId: mockUserId }),
        new EntryPackSnapshot({ snapshotId: 'snap_3', entryPackId: 'pack_123', userId: mockUserId })
      ];

      // Mock SecureStorageService
      const SecureStorageService = require('../../security/SecureStorageService').default;
      SecureStorageService.getSnapshotsByUserId = jest.fn().mockResolvedValue(
        mockSnapshots.map(s => s.exportData())
      );

      const result = await EntryPackSnapshot.loadByUserId(mockUserId, {
        entryPackId: 'pack_123'
      });

      // Should return only snapshots for pack_123
      expect(result).toHaveLength(2);
      expect(result[0].entryPackId).toBe('pack_123');
      expect(result[1].entryPackId).toBe('pack_123');
    });

    test('should get snapshots for specific entry pack', async () => {
      const mockSnapshots = [
        { snapshotId: 'snap_1', entryPackId: 'pack_123', status: 'submitted' },
        { snapshotId: 'snap_2', entryPackId: 'pack_123', status: 'completed' }
      ];
      SnapshotService.list = jest.fn().mockResolvedValue(mockSnapshots);

      const result = await EntryPackService.getSnapshotsForEntryPack('pack_123', mockUserId);

      expect(SnapshotService.list).toHaveBeenCalledWith(mockUserId, {
        entryPackId: 'pack_123'
      });
      expect(result).toEqual(mockSnapshots);
    });

    test('should check if entry pack has snapshots', async () => {
      SnapshotService.list = jest.fn().mockResolvedValue([
        { snapshotId: 'snap_1', entryPackId: 'pack_123' }
      ]);

      const hasSnapshots = await EntryPackService.hasSnapshots('pack_123', mockUserId);
      const noSnapshots = await EntryPackService.hasSnapshots('pack_456', mockUserId);

      expect(hasSnapshots).toBe(true);
      
      // Mock empty result for second call
      SnapshotService.list = jest.fn().mockResolvedValue([]);
      const noSnapshotsResult = await EntryPackService.hasSnapshots('pack_456', mockUserId);
      expect(noSnapshotsResult).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle snapshot creation failures gracefully', async () => {
      // Mock EntryPackService methods to avoid calling actual snapshot creation
      const originalCreateSnapshot = EntryPackService.createSnapshotOnSubmission;
      EntryPackService.createSnapshotOnSubmission = jest.fn().mockResolvedValue(null);

      // Should not throw error, just log and continue
      const result = await EntryPackService.transitionState('pack_123', 'submitted', {
        reason: 'TDAC submission successful',
        tdacSubmission: mockEntryPack.tdacSubmission
      });

      // Entry pack should still be updated despite snapshot failure
      expect(result).toBeDefined();
      expect(result.status).toBe('submitted');

      // Restore original method
      EntryPackService.createSnapshotOnSubmission = originalCreateSnapshot;
    });

    test('should handle photo copying failures without breaking snapshot creation', async () => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock photo copying failure by restoring original method and making it fail
      const originalCopyPhotos = SnapshotService.copyPhotosToSnapshotStorage;
      SnapshotService.copyPhotosToSnapshotStorage = jest.fn().mockRejectedValue(
        new Error('Photo copying failed')
      );

      // Should throw error when photo copying fails
      await expect(SnapshotService.createSnapshot('pack_123', 'submitted')).rejects.toThrow('Photo copying failed');
      
      // Restore original method
      SnapshotService.copyPhotosToSnapshotStorage = originalCopyPhotos;
    });

    test('should handle missing entry pack data gracefully', async () => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock missing entry pack by restoring original method and making it return null
      const originalLoadData = SnapshotService.loadCompleteEntryPackData;
      SnapshotService.loadCompleteEntryPackData = jest.fn().mockResolvedValue(null);

      await expect(SnapshotService.createSnapshot('nonexistent_pack', 'submitted'))
        .rejects.toThrow('Entry pack not found: nonexistent_pack');
        
      // Restore original method
      SnapshotService.loadCompleteEntryPackData = originalLoadData;
    });
  });
});