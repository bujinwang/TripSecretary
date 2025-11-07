/**
 * EntryInfo Model Tests - Schema v2.0
 * Tests for documents and display_status fields
 */

import EntryInfo from '../EntryInfo';
import type SecureStorageServiceType from '../../services/security/SecureStorageService';
import SecureStorageService from '../../services/security/SecureStorageService';

jest.mock('../../services/security/SecureStorageService', () => {
  const mockService = {
    initializeDatabase: jest.fn(),
    getDigitalArrivalCardsByEntryInfoId: jest.fn(),
    getLatestSuccessfulDigitalArrivalCard: jest.fn(),
    deleteUserData: jest.fn(),
    saveEntryInfo: jest.fn(),
    getEntryInfo: jest.fn(),
    getPassport: jest.fn(),
    getPersonalInfo: jest.fn(),
    getFundItems: jest.fn(),
    getTravelInfo: jest.fn()
  };

  return {
    __esModule: true,
    default: mockService
  };
});

const mockedSecureStorage = SecureStorageService as jest.Mocked<SecureStorageServiceType>;

describe('EntryInfo Model - Schema v2.0', () => {
  let testUserId: string;
  let testEntryInfo: EntryInfo;

  const documentsPayload = {
    passport: { uploaded: true, url: 'https://example.com/passport.pdf' },
    visa: { uploaded: false },
    hotel: { uploaded: true, url: 'https://example.com/hotel.pdf' }
  };

  const displayStatusPayload = {
    passport: { status: 'complete', color: 'green' },
    personalInfo: { status: 'partial', color: 'orange' },
    funds: { status: 'missing', color: 'red' },
    travel: { status: 'complete', color: 'green' }
  };

  beforeAll(() => {
    mockedSecureStorage.initializeDatabase.mockResolvedValue(true);
    mockedSecureStorage.getDigitalArrivalCardsByEntryInfoId.mockResolvedValue([]);
    mockedSecureStorage.getLatestSuccessfulDigitalArrivalCard.mockResolvedValue(null);
    testUserId = `test-user-${Date.now()}`;
  });

  beforeEach(() => {
    testEntryInfo = new EntryInfo({
      id: 'entry_test_123',
      userId: testUserId,
      destinationId: 'thailand',
      documents: documentsPayload,
      displayStatus: displayStatusPayload
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    mockedSecureStorage.deleteUserData.mockResolvedValue(true);
    try {
      await mockedSecureStorage.deleteUserData(testUserId);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Schema v2.0 Fields', () => {
    test('should initialize with documents field', () => {
      expect(testEntryInfo.documents).toBeDefined();
      expect(testEntryInfo.documents).toEqual(documentsPayload);
    });

    test('should initialize with displayStatus field', () => {
      expect(testEntryInfo.displayStatus).toBeDefined();
      expect(testEntryInfo.displayStatus).toEqual(displayStatusPayload);
    });

    test('should expose documents data correctly', () => {
      const docs = testEntryInfo.documents as typeof documentsPayload;
      expect(docs.passport.uploaded).toBe(true);
      expect(docs.visa.uploaded).toBe(false);
      expect(docs.hotel.uploaded).toBe(true);
    });

    test('should expose displayStatus data correctly', () => {
      const status = testEntryInfo.displayStatus as typeof displayStatusPayload;
      expect(status.passport.status).toBe('complete');
      expect(status.personalInfo.status).toBe('partial');
      expect(status.funds.status).toBe('missing');
      expect(status.travel.status).toBe('complete');
    });
  });

  describe('Save and Load Operations', () => {
    test('should save EntryInfo with documents and displayStatus', async () => {
      mockedSecureStorage.saveEntryInfo.mockResolvedValue({ id: 'entry_123' });

      const result = await testEntryInfo.save();

      expect(result.id).toBe('entry_123');

      const saveArgs = mockedSecureStorage.saveEntryInfo.mock.calls[mockedSecureStorage.saveEntryInfo.mock.calls.length - 1]?.[0] as Record<string, unknown> | undefined;
      expect(saveArgs).toBeDefined();
      if (!saveArgs) {
        throw new Error('Expected saveEntryInfo to be called');
      }
      expect(saveArgs.documents).toEqual(documentsPayload);
      expect(saveArgs.displayStatus).toEqual(displayStatusPayload);
    });

    test('should load EntryInfo with documents and displayStatus', async () => {
      const mockSavedData = {
        id: 'entry_123',
        userId: testUserId,
        destinationId: 'thailand',
        documents: documentsPayload,
        displayStatus: displayStatusPayload
      };

      mockedSecureStorage.saveEntryInfo.mockResolvedValue({ id: mockSavedData.id });
      mockedSecureStorage.getEntryInfo.mockResolvedValue(mockSavedData);

      const saveResult = await testEntryInfo.save();
      const loaded = await EntryInfo.load(saveResult.id);

      expect(loaded?.documents).toEqual(documentsPayload);
      expect(loaded?.displayStatus).toEqual(displayStatusPayload);

      const docs = loaded?.documents as typeof documentsPayload;
      const status = loaded?.displayStatus as typeof displayStatusPayload;

      expect(docs.passport.uploaded).toBe(true);
      expect(status.passport.status).toBe('complete');
    });

    test('should update documents field', async () => {
      const initialData = {
        id: 'entry_123',
        userId: testUserId,
        destinationId: 'thailand',
        documents: documentsPayload,
        displayStatus: displayStatusPayload
      };

      mockedSecureStorage.saveEntryInfo.mockResolvedValue({ id: initialData.id });
      mockedSecureStorage.getEntryInfo.mockResolvedValue(initialData);

      const saveResult = await testEntryInfo.save();

      const updatedDocuments = {
        passport: { uploaded: true, url: 'https://example.com/passport.pdf' },
        visa: { uploaded: true, url: 'https://example.com/visa.pdf' },
        hotel: { uploaded: true, url: 'https://example.com/hotel.pdf' }
      };

      const updatedEntryInfo = new EntryInfo({
        ...initialData,
        documents: updatedDocuments
      });

      const updatedData = { ...initialData, documents: updatedDocuments };
      mockedSecureStorage.saveEntryInfo.mockResolvedValue(updatedData);
      mockedSecureStorage.getEntryInfo.mockResolvedValue(updatedData);

      await updatedEntryInfo.save();

      const saveArgs = mockedSecureStorage.saveEntryInfo.mock.calls[mockedSecureStorage.saveEntryInfo.mock.calls.length - 1]?.[0] as Record<string, unknown> | undefined;
      expect(saveArgs).toBeDefined();
      if (!saveArgs) {
        throw new Error('Expected saveEntryInfo to be called');
      }
      expect(saveArgs.documents).toEqual(updatedDocuments);

      const loaded = await EntryInfo.load(saveResult.id);
      expect(loaded?.documents).toEqual(updatedDocuments);

      const docs = loaded?.documents as typeof updatedDocuments;
      expect(docs.visa.uploaded).toBe(true);
    });

    test('should update displayStatus field', async () => {
      const initialData = {
        id: 'entry_123',
        userId: testUserId,
        destinationId: 'thailand',
        documents: documentsPayload,
        displayStatus: displayStatusPayload
      };

      mockedSecureStorage.saveEntryInfo.mockResolvedValue({ id: initialData.id });
      mockedSecureStorage.getEntryInfo.mockResolvedValue(initialData);

      const saveResult = await testEntryInfo.save();

      const newDisplayStatus = {
        passport: { status: 'complete', color: 'green' },
        personalInfo: { status: 'complete', color: 'green' },
        funds: { status: 'complete', color: 'green' },
        travel: { status: 'complete', color: 'green' }
      };

      const updatedEntryInfo = new EntryInfo({
        ...initialData,
        displayStatus: newDisplayStatus
      });

      const updatedData = { ...initialData, displayStatus: newDisplayStatus };
      mockedSecureStorage.saveEntryInfo.mockResolvedValue(updatedData);
      mockedSecureStorage.getEntryInfo.mockResolvedValue(updatedData);

      await updatedEntryInfo.save();

      const saveArgs = mockedSecureStorage.saveEntryInfo.mock.calls[mockedSecureStorage.saveEntryInfo.mock.calls.length - 1]?.[0] as Record<string, unknown> | undefined;
      expect(saveArgs).toBeDefined();
      if (!saveArgs) {
        throw new Error('Expected saveEntryInfo to be called');
      }
      expect(saveArgs.displayStatus).toEqual(newDisplayStatus);

      const loaded = await EntryInfo.load(saveResult.id);
      expect(loaded?.displayStatus).toEqual(newDisplayStatus);

      const status = loaded?.displayStatus as typeof newDisplayStatus;
      expect(status.personalInfo.status).toBe('complete');
      expect(status.funds.status).toBe('complete');
    });
  });

  describe('Summary and Export', () => {
    test('should include documents and displayStatus in summary', async () => {
      mockedSecureStorage.saveEntryInfo.mockResolvedValue({
        id: 'entry_123',
        ...testEntryInfo
      });

      await testEntryInfo.save();
      const summary = testEntryInfo.getSummary();

      expect(summary.documents).toEqual(documentsPayload);
      expect(summary.displayStatus).toEqual(displayStatusPayload);
    });

    test('should include documents and displayStatus in export', async () => {
      mockedSecureStorage.saveEntryInfo.mockResolvedValue({
        id: 'entry_123',
        ...testEntryInfo
      });

      await testEntryInfo.save();

      mockedSecureStorage.getPassport.mockResolvedValue(null);
      mockedSecureStorage.getPersonalInfo.mockResolvedValue(null);
      mockedSecureStorage.getFundItems.mockResolvedValue([]);
      mockedSecureStorage.getTravelInfo.mockResolvedValue(null);

      const exported = await testEntryInfo.exportData();

      expect(exported.progressiveEntryFlow.documents).toEqual(documentsPayload);
      expect(exported.progressiveEntryFlow.displayStatus).toEqual(displayStatusPayload);
    });
  });

  describe('Digital Arrival Card Integration', () => {
    test('should get latest DigitalArrivalCard by type', async () => {
      mockedSecureStorage.saveEntryInfo.mockResolvedValue({ id: 'entry_123', ...testEntryInfo });
      mockedSecureStorage.getEntryInfo.mockResolvedValue({ id: 'entry_123', ...testEntryInfo });
      mockedSecureStorage.getLatestSuccessfulDigitalArrivalCard.mockResolvedValue(null);

      await testEntryInfo.save();

      await expect(testEntryInfo.getLatestDigitalArrivalCard('TDAC')).resolves.toBeNull();
    });

    test('should get all DigitalArrivalCards', async () => {
      mockedSecureStorage.saveEntryInfo.mockResolvedValue({ id: 'entry_123', ...testEntryInfo });
      mockedSecureStorage.getEntryInfo.mockResolvedValue({ id: 'entry_123', ...testEntryInfo });
      mockedSecureStorage.getDigitalArrivalCardsByEntryInfoId.mockResolvedValue([]);

      await testEntryInfo.save();

      const results = await testEntryInfo.getAllDigitalArrivalCards();
      expect(Array.isArray(results)).toBe(true);
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

