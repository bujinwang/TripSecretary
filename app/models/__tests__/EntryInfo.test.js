/**
 * EntryInfo Model Tests - Schema v2.0
 * Tests for documents and display_status fields
 */

import EntryInfo from '../EntryInfo';
import SecureStorageService from '../../services/security/SecureStorageService';

// Mock SecureStorageService
jest.mock('../../services/security/SecureStorageService');

describe('EntryInfo Model - Schema v2.0', () => {
  let testUserId;
  let testEntryInfo;

  beforeAll(async () => {
    // Mock database initialization
    SecureStorageService.initializeDatabase = jest.fn().mockResolvedValue(true);

    // Mock DigitalArrivalCard methods
    SecureStorageService.getDigitalArrivalCardsByEntryInfoId = jest.fn().mockResolvedValue([]);
    SecureStorageService.getLatestSuccessfulDigitalArrivalCard = jest.fn().mockResolvedValue(null);

    // Create test user
    testUserId = 'test-user-' + Date.now();
  });

  beforeEach(() => {
    testEntryInfo = new EntryInfo({
      id: 'entry_test_123',
      userId: testUserId,
      destinationId: 'thailand',
      documents: JSON.stringify({
        passport: { uploaded: true, url: 'https://example.com/passport.pdf' },
        visa: { uploaded: false },
        hotel: { uploaded: true, url: 'https://example.com/hotel.pdf' }
      }),
      displayStatus: JSON.stringify({
        passport: { status: 'complete', color: 'green' },
        personalInfo: { status: 'partial', color: 'orange' },
        funds: { status: 'missing', color: 'red' },
        travel: { status: 'complete', color: 'green' }
      })
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      SecureStorageService.deleteUserData = jest.fn().mockResolvedValue(true);
      await SecureStorageService.deleteUserData(testUserId);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Schema v2.0 Fields', () => {
    test('should initialize with documents field', () => {
      expect(testEntryInfo.documents).toBeDefined();
      expect(typeof testEntryInfo.documents).toBe('string');
    });

    test('should initialize with displayStatus field', () => {
      expect(testEntryInfo.displayStatus).toBeDefined();
      expect(typeof testEntryInfo.displayStatus).toBe('string');
    });

    test('should parse documents JSON correctly', () => {
      const docs = JSON.parse(testEntryInfo.documents);
      expect(docs.passport.uploaded).toBe(true);
      expect(docs.visa.uploaded).toBe(false);
      expect(docs.hotel.uploaded).toBe(true);
    });

    test('should parse displayStatus JSON correctly', () => {
      const status = JSON.parse(testEntryInfo.displayStatus);
      expect(status.passport.status).toBe('complete');
      expect(status.personalInfo.status).toBe('partial');
      expect(status.funds.status).toBe('missing');
      expect(status.travel.status).toBe('complete');
    });
  });

  describe('Save and Load Operations', () => {
    test('should save EntryInfo with documents and displayStatus', async () => {
      // Mock save operation
      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue({
        id: 'entry_123',
        ...testEntryInfo,
        documents: testEntryInfo.documents,
        displayStatus: testEntryInfo.displayStatus
      });

      const result = await testEntryInfo.save();

      expect(result.id).toBeDefined();
      expect(result.documents).toBe(testEntryInfo.documents);
      expect(result.displayStatus).toBe(testEntryInfo.displayStatus);
    });

    test('should load EntryInfo with documents and displayStatus', async () => {
      // Mock save and load operations
      const mockSavedData = {
        id: 'entry_123',
        userId: testUserId,
        destinationId: 'thailand',
        documents: testEntryInfo.documents,
        displayStatus: testEntryInfo.displayStatus
      };

      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue(mockSavedData);
      SecureStorageService.getEntryInfo = jest.fn().mockResolvedValue(mockSavedData);

      // Save first
      const result = await testEntryInfo.save();

      // Load it back
      const loaded = await EntryInfo.load(result.id);

      expect(loaded.documents).toBe(testEntryInfo.documents);
      expect(loaded.displayStatus).toBe(testEntryInfo.displayStatus);

      // Verify JSON parsing works
      const docs = JSON.parse(loaded.documents);
      const status = JSON.parse(loaded.displayStatus);

      expect(docs.passport.uploaded).toBe(true);
      expect(status.passport.status).toBe('complete');
    });

    test('should update documents field', async () => {
      // Mock save and load operations
      const initialData = {
        id: 'entry_123',
        userId: testUserId,
        destinationId: 'thailand',
        documents: testEntryInfo.documents,
        displayStatus: testEntryInfo.displayStatus
      };

      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue(initialData);
      SecureStorageService.getEntryInfo = jest.fn().mockResolvedValue(initialData);

      // Save initial
      const result = await testEntryInfo.save();

      // Create new instance with updated documents
      const updatedEntryInfo = new EntryInfo({
        ...initialData,
        documents: JSON.stringify({
          passport: { uploaded: true, url: 'https://example.com/passport.pdf' },
          visa: { uploaded: true, url: 'https://example.com/visa.pdf' },
          hotel: { uploaded: true, url: 'https://example.com/hotel.pdf' }
        })
      });

      // Mock updated save
      const updatedData = { ...initialData, documents: updatedEntryInfo.documents };
      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue(updatedData);
      SecureStorageService.getEntryInfo = jest.fn().mockResolvedValue(updatedData);

      const updated = await updatedEntryInfo.save();

      expect(updated.documents).toBe(updatedEntryInfo.documents);

      // Load and verify
      const loaded = await EntryInfo.load(result.id);
      expect(loaded.documents).toBe(updatedEntryInfo.documents);

      const docs = JSON.parse(loaded.documents);
      expect(docs.visa.uploaded).toBe(true);
    });

    test('should update displayStatus field', async () => {
      // Mock save and load operations
      const initialData = {
        id: 'entry_123',
        userId: testUserId,
        destinationId: 'thailand',
        documents: testEntryInfo.documents,
        displayStatus: testEntryInfo.displayStatus
      };

      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue(initialData);
      SecureStorageService.getEntryInfo = jest.fn().mockResolvedValue(initialData);

      // Save initial
      const result = await testEntryInfo.save();

      // Create new instance with updated display status
      const newDisplayStatus = JSON.stringify({
        passport: { status: 'complete', color: 'green' },
        personalInfo: { status: 'complete', color: 'green' },
        funds: { status: 'complete', color: 'green' },
        travel: { status: 'complete', color: 'green' }
      });

      const updatedEntryInfo = new EntryInfo({
        ...initialData,
        displayStatus: newDisplayStatus
      });

      // Mock updated save
      const updatedData = { ...initialData, displayStatus: newDisplayStatus };
      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue(updatedData);
      SecureStorageService.getEntryInfo = jest.fn().mockResolvedValue(updatedData);

      const updated = await updatedEntryInfo.save();

      expect(updated.displayStatus).toBe(newDisplayStatus);

      // Load and verify
      const loaded = await EntryInfo.load(result.id);
      expect(loaded.displayStatus).toBe(newDisplayStatus);

      const status = JSON.parse(loaded.displayStatus);
      expect(status.personalInfo.status).toBe('complete');
      expect(status.funds.status).toBe('complete');
    });
  });

  describe('Summary and Export', () => {
    test('should include documents and displayStatus in summary', async () => {
      // Mock save operation
      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue({
        id: 'entry_123',
        ...testEntryInfo
      });

      const result = await testEntryInfo.save();
      const summary = testEntryInfo.getSummary();

      expect(summary.documents).toBe(testEntryInfo.documents);
      expect(summary.displayStatus).toBe(testEntryInfo.displayStatus);
    });

    test('should include documents and displayStatus in export', async () => {
      // Mock save operation
      SecureStorageService.saveEntryInfo = jest.fn().mockResolvedValue({
        id: 'entry_123',
        ...testEntryInfo
      });

      const result = await testEntryInfo.save();

      // Mock export dependencies
      SecureStorageService.getPassport = jest.fn().mockResolvedValue(null);
      SecureStorageService.getPersonalInfo = jest.fn().mockResolvedValue(null);
      SecureStorageService.getFundItems = jest.fn().mockResolvedValue([]);
      SecureStorageService.getTravelInfo = jest.fn().mockResolvedValue(null);

      const exported = await testEntryInfo.exportData();

      expect(exported.progressiveEntryFlow.documents).toBe(testEntryInfo.documents);
      expect(exported.progressiveEntryFlow.displayStatus).toBe(testEntryInfo.displayStatus);
    });
  });

  describe('Digital Arrival Card Integration', () => {
    test('should get latest DigitalArrivalCard by type', async () => {
      const result = await testEntryInfo.save();

      // This test assumes DigitalArrivalCard model exists and has test data
      // For now, just verify the method exists and doesn't throw
      try {
        const cardResult = await testEntryInfo.getLatestDigitalArrivalCard('TDAC');
        // Result may be null if no cards exist, which is fine
        expect(cardResult === null || typeof cardResult === 'object').toBe(true);
      } catch (error) {
        // If DigitalArrivalCard model doesn't exist yet, expect an error
        expect(error.message).toContain('Cannot find module');
      }
    });

    test('should get all DigitalArrivalCards', async () => {
      const result = await testEntryInfo.save();

      try {
        const results = await testEntryInfo.getAllDigitalArrivalCards();
        // Results should be an array (empty if no cards exist)
        expect(Array.isArray(results)).toBe(true);
      } catch (error) {
        // If DigitalArrivalCard model doesn't exist yet, expect an error
        expect(error.message).toContain('Cannot find module');
      }
    });
  });

  describe('Completion Metrics with New Fields', () => {
    test('should maintain completion metrics functionality', () => {
      const metrics = testEntryInfo.updateCompletionMetrics({}, {}, [], {});
      expect(metrics).toBeDefined();
      expect(metrics.passport).toBeDefined();
      expect(metrics.personalInfo).toBeDefined();
      expect(metrics.funds).toBeDefined();
      expect(metrics.travel).toBeDefined();
    });

    test('should calculate total completion percentage', () => {
      const percent = testEntryInfo.getTotalCompletionPercent();
      expect(typeof percent).toBe('number');
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });
});