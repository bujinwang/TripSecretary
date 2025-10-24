/**
 * SnapshotIntegration.simple.test.js - Simplified integration tests for snapshot creation and management
 * Tests the core integration between EntryPackService and SnapshotService
 * 
 * Requirements: 11.1-11.7, 15.1-15.7, 18.1-18.5
 */

import EntryPackService from '../../entryPack/EntryPackService';
import SnapshotService from '../SnapshotService';

// Mock dependencies
jest.mock('../../security/SecureStorageService');
jest.mock('../../data/UserDataService');
jest.mock('expo-file-system');

describe('SnapshotIntegration - Core Functionality', () => {
  let mockEntryPack;
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

    // Mock EntryPack.load
    const EntryPack = require('../../../models/EntryPack').default;
    EntryPack.load = jest.fn().mockResolvedValue(mockEntryPack);
  });

  describe('Snapshot Creation Integration', () => {
    test('should integrate snapshot creation with state transitions', async () => {
      // Mock SnapshotService.createSnapshot
      const mockSnapshot = {
        snapshotId: 'snapshot_123',
        entryPackId: 'pack_123',
        status: 'submitted',
        createdAt: '2024-01-01T12:00:00.000Z'
      };
      
      const createSnapshotSpy = jest.spyOn(EntryPackService, 'createSnapshotOnSubmission')
        .mockResolvedValue(mockSnapshot);

      // Transition to submitted state
      const result = await EntryPackService.transitionState('pack_123', 'submitted', {
        reason: 'TDAC submission successful',
        tdacSubmission: mockEntryPack.tdacSubmission,
        submissionMethod: 'api'
      });

      // Verify snapshot creation was called
      expect(createSnapshotSpy).toHaveBeenCalledWith(
        mockEntryPack,
        expect.objectContaining({
          reason: 'TDAC submission successful',
          tdacSubmission: mockEntryPack.tdacSubmission,
          submissionMethod: 'api'
        })
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('submitted');
      
      createSnapshotSpy.mockRestore();
    });

    test('should create snapshots on different state transitions', async () => {
      const createSubmissionSpy = jest.spyOn(EntryPackService, 'createSnapshotOnSubmission').mockResolvedValue(null);
      const createCompletionSpy = jest.spyOn(EntryPackService, 'createSnapshotOnCompletion').mockResolvedValue(null);
      const createExpirySpy = jest.spyOn(EntryPackService, 'createSnapshotOnExpiry').mockResolvedValue(null);
      const createArchivalSpy = jest.spyOn(EntryPackService, 'createSnapshotOnArchival').mockResolvedValue(null);

      // Test submitted transition
      await EntryPackService.transitionState('pack_123', 'submitted', {
        tdacSubmission: mockEntryPack.tdacSubmission
      });
      expect(createSubmissionSpy).toHaveBeenCalled();

      // Test completed transition
      mockEntryPack.status = 'submitted';
      await EntryPackService.transitionState('pack_123', 'completed', {});
      expect(createCompletionSpy).toHaveBeenCalled();

      // Test expired transition
      mockEntryPack.status = 'submitted';
      await EntryPackService.transitionState('pack_123', 'expired', {});
      expect(createExpirySpy).toHaveBeenCalled();

      // Test archived transition
      mockEntryPack.status = 'in_progress';
      await EntryPackService.transitionState('pack_123', 'archived', {});
      expect(createArchivalSpy).toHaveBeenCalled();

      // Restore spies
      createSubmissionSpy.mockRestore();
      createCompletionSpy.mockRestore();
      createExpirySpy.mockRestore();
      createArchivalSpy.mockRestore();
    });

    test('should handle snapshot creation failures gracefully', async () => {
      // Mock snapshot creation failure
      const createSnapshotSpy = jest.spyOn(EntryPackService, 'createSnapshotOnSubmission')
        .mockRejectedValue(new Error('Snapshot creation failed'));

      // Should not throw error, just log and continue
      const result = await EntryPackService.transitionState('pack_123', 'submitted', {
        reason: 'TDAC submission successful',
        tdacSubmission: mockEntryPack.tdacSubmission
      });

      // Entry pack should still be updated despite snapshot failure
      expect(result).toBeDefined();
      expect(result.status).toBe('submitted');
      
      createSnapshotSpy.mockRestore();
    });
  });

  describe('Snapshot Cleanup Integration', () => {
    test('should clean up snapshots when entry pack is deleted', async () => {
      // Mock existing snapshots
      const mockSnapshots = [
        { snapshotId: 'snapshot_1', entryPackId: 'pack_123' },
        { snapshotId: 'snapshot_2', entryPackId: 'pack_123' }
      ];
      
      const listSpy = jest.spyOn(SnapshotService, 'list').mockResolvedValue(mockSnapshots);
      const deleteSpy = jest.spyOn(SnapshotService, 'delete').mockResolvedValue(true);

      // Delete entry pack
      const result = await EntryPackService.handleSnapshotCleanupOnDeletion('pack_123', mockUserId);

      // Verify snapshots were found and deleted
      expect(listSpy).toHaveBeenCalledWith(mockUserId, {
        entryPackId: 'pack_123'
      });
      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(deleteSpy).toHaveBeenCalledWith('snapshot_1');
      expect(deleteSpy).toHaveBeenCalledWith('snapshot_2');

      expect(result).toEqual({
        totalSnapshots: 2,
        deletedSnapshots: 2
      });
      
      listSpy.mockRestore();
      deleteSpy.mockRestore();
    });

    test('should handle snapshot deletion failures gracefully', async () => {
      // Mock existing snapshots with one deletion failure
      const mockSnapshots = [
        { snapshotId: 'snapshot_1', entryPackId: 'pack_123' },
        { snapshotId: 'snapshot_2', entryPackId: 'pack_123' }
      ];
      
      const listSpy = jest.spyOn(SnapshotService, 'list').mockResolvedValue(mockSnapshots);
      const deleteSpy = jest.spyOn(SnapshotService, 'delete')
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Delete failed'));

      // Delete entry pack
      const result = await EntryPackService.handleSnapshotCleanupOnDeletion('pack_123', mockUserId);

      // Should attempt to delete both but only succeed with one
      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        totalSnapshots: 2,
        deletedSnapshots: 1
      });
      
      listSpy.mockRestore();
      deleteSpy.mockRestore();
    });
  });

  describe('Snapshot Filtering and Retrieval', () => {
    test('should get snapshots for specific entry pack', async () => {
      const mockSnapshots = [
        { snapshotId: 'snap_1', entryPackId: 'pack_123', status: 'submitted' },
        { snapshotId: 'snap_2', entryPackId: 'pack_123', status: 'completed' }
      ];
      
      const listSpy = jest.spyOn(SnapshotService, 'list').mockResolvedValue(mockSnapshots);

      const result = await EntryPackService.getSnapshotsForEntryPack('pack_123', mockUserId);

      expect(listSpy).toHaveBeenCalledWith(mockUserId, {
        entryPackId: 'pack_123'
      });
      expect(result).toEqual(mockSnapshots);
      
      listSpy.mockRestore();
    });

    test('should check if entry pack has snapshots', async () => {
      const listSpy = jest.spyOn(SnapshotService, 'list')
        .mockResolvedValueOnce([{ snapshotId: 'snap_1', entryPackId: 'pack_123' }])
        .mockResolvedValueOnce([]);

      const hasSnapshots = await EntryPackService.hasSnapshots('pack_123', mockUserId);
      const noSnapshots = await EntryPackService.hasSnapshots('pack_456', mockUserId);

      expect(hasSnapshots).toBe(true);
      expect(noSnapshots).toBe(false);
      
      listSpy.mockRestore();
    });
  });

  describe('Snapshot Creation Methods', () => {
    test('should create snapshot on TDAC submission with correct metadata', async () => {
      const createSnapshotSpy = jest.spyOn(SnapshotService, 'createSnapshot')
        .mockResolvedValue({ snapshotId: 'test_snapshot' });

      await EntryPackService.createSnapshotOnSubmission(mockEntryPack, {
        tdacSubmission: mockEntryPack.tdacSubmission,
        submissionMethod: 'api',
        metadata: { appVersion: '1.0.0' }
      });

      expect(createSnapshotSpy).toHaveBeenCalledWith(
        'pack_123',
        'submitted',
        expect.objectContaining({
          creationMethod: 'auto',
          submissionMethod: 'api',
          arrCardNo: 'TH123456789'
        })
      );
      
      createSnapshotSpy.mockRestore();
    });

    test('should create snapshot on completion with correct metadata', async () => {
      const createSnapshotSpy = jest.spyOn(SnapshotService, 'createSnapshot')
        .mockResolvedValue({ snapshotId: 'test_snapshot' });

      await EntryPackService.createSnapshotOnCompletion(mockEntryPack, {
        metadata: {
          completedBy: 'user',
          completionLocation: 'Bangkok Airport',
          completionMethod: 'manual'
        }
      });

      expect(createSnapshotSpy).toHaveBeenCalledWith(
        'pack_123',
        'completed',
        expect.objectContaining({
          creationMethod: 'manual',
          completionLocation: 'Bangkok Airport',
          completionMethod: 'manual'
        })
      );
      
      createSnapshotSpy.mockRestore();
    });

    test('should skip archival snapshot creation if snapshot already exists', async () => {
      const listSpy = jest.spyOn(SnapshotService, 'list')
        .mockResolvedValue([{ snapshotId: 'existing_snapshot' }]);
      const createSnapshotSpy = jest.spyOn(SnapshotService, 'createSnapshot');

      const result = await EntryPackService.createSnapshotOnArchival(mockEntryPack, {});

      expect(listSpy).toHaveBeenCalledWith(mockUserId, { entryPackId: 'pack_123' });
      expect(createSnapshotSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ snapshotId: 'existing_snapshot' });
      
      listSpy.mockRestore();
      createSnapshotSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle SnapshotService errors gracefully', async () => {
      const createSnapshotSpy = jest.spyOn(SnapshotService, 'createSnapshot')
        .mockRejectedValue(new Error('Service unavailable'));

      // Should return null on error, not throw
      const result = await EntryPackService.createSnapshotOnSubmission(mockEntryPack, {});
      expect(result).toBeNull();
      
      createSnapshotSpy.mockRestore();
    });

    test('should handle cleanup errors gracefully', async () => {
      const listSpy = jest.spyOn(SnapshotService, 'list')
        .mockRejectedValue(new Error('List failed'));

      // Should return empty result on error, not throw
      const result = await EntryPackService.handleSnapshotCleanupOnDeletion('pack_123', mockUserId);
      expect(result).toEqual({
        totalSnapshots: 0,
        deletedSnapshots: 0
      });
      
      listSpy.mockRestore();
    });
  });
});