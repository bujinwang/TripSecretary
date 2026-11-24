/**
 * DigitalArrivalCard Model Tests - Schema v2.0
 */

import DigitalArrivalCard from '../DigitalArrivalCard';
import secureStorageService from '../../services/security/SecureStorageService';

jest.mock('../../services/security/SecureStorageService', () => {
  const mockService = {
    initialize: jest.fn(),
    deleteAllUserData: jest.fn(),
    saveDigitalArrivalCard: jest.fn(),
    getDigitalArrivalCard: jest.fn(),
    getDigitalArrivalCardsByEntryInfoId: jest.fn(),
    getLatestSuccessfulDigitalArrivalCard: jest.fn()
  };

  return {
    __esModule: true,
    default: mockService
  };
});

type SecureStorageServiceMock = jest.Mocked<typeof secureStorageService>;
const mockedSecureStorage = secureStorageService as SecureStorageServiceMock;

describe('DigitalArrivalCard Model - Schema v2.0', () => {
  let testUserId: string;
  let testEntryInfoId: string;
  let testCard: DigitalArrivalCard;

beforeAll(() => {
  mockedSecureStorage.initialize.mockResolvedValue();
    testUserId = `test-user-${Date.now()}`;
    testEntryInfoId = `entry_test_${Date.now()}`;
  });

  beforeEach(() => {
    testCard = new DigitalArrivalCard({
      entryInfoId: testEntryInfoId,
      userId: testUserId,
      cardType: 'TDAC',
      destinationId: 'thailand',
      arrCardNo: 'TH123456789',
      qrUri: 'https://example.com/qr/TH123456789',
      pdfUrl: 'https://example.com/pdf/TH123456789.pdf',
      status: 'success',
      apiResponse: { success: true, cardNumber: 'TH123456789' },
      processingTime: 2500,
      retryCount: 0,
      errorDetails: null,
      isSuperseded: false,
      version: 1
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

afterAll(async () => {
  mockedSecureStorage.deleteAllUserData.mockResolvedValue();
    try {
    await mockedSecureStorage.deleteAllUserData(testUserId);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Initialization and Properties', () => {
    test('should initialize with all required properties', () => {
      expect(testCard.entryInfoId).toBe(testEntryInfoId);
      expect(testCard.userId).toBe(testUserId);
      expect(testCard.cardType).toBe('TDAC');
      expect(testCard.destinationId).toBe('thailand');
      expect(testCard.arrCardNo).toBe('TH123456789');
      expect(testCard.qrUri).toBe('https://example.com/qr/TH123456789');
      expect(testCard.pdfUrl).toBe('https://example.com/pdf/TH123456789.pdf');
      expect(testCard.status).toBe('success');
      expect(testCard.processingTime).toBe(2500);
      expect(testCard.retryCount).toBe(0);
      expect(testCard.isSuperseded).toBe(false);
      expect(testCard.version).toBe(1);
    });

    test('should generate unique ID', () => {
      const id1 = DigitalArrivalCard.generateId();
      const id2 = DigitalArrivalCard.generateId();

      expect(id1).toMatch(/^dac_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^dac_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should support different card types', () => {
      const cardTypes = ['TDAC', 'MDAC', 'SDAC', 'HKDAC'];

      cardTypes.forEach(type => {
        const card = new DigitalArrivalCard({
          entryInfoId: testEntryInfoId,
          userId: testUserId,
          cardType: type,
          destinationId: 'thailand'
        });
        expect(card.cardType).toBe(type);
      });
    });
  });

  describe('Save and Load Operations', () => {
    test('should save DigitalArrivalCard successfully', async () => {
      mockedSecureStorage.saveDigitalArrivalCard.mockResolvedValue({
        id: testCard.id,
      });

      const result = await testCard.save();

      expect(mockedSecureStorage.saveDigitalArrivalCard).toHaveBeenCalledWith({
        id: testCard.id,
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        arrCardNo: 'TH123456789',
        qrUri: 'https://example.com/qr/TH123456789',
        pdfUrl: 'https://example.com/pdf/TH123456789.pdf',
        submittedAt: expect.any(String),
        submissionMethod: 'api',
        status: 'success',
        apiResponse: { success: true, cardNumber: 'TH123456789' },
        processingTime: 2500,
        retryCount: 0,
        errorDetails: null,
        isSuperseded: false,
        supersededAt: null,
        supersededBy: null,
        supersededReason: null,
        version: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(result).toEqual({ id: testCard.id });
    });

    test('should load DigitalArrivalCard by ID', async () => {
      const mockData = {
        id: 'dac_test_123',
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        arrCardNo: 'TH123456789',
        qrUri: 'https://example.com/qr/TH123456789',
        pdfUrl: 'https://example.com/pdf/TH123456789.pdf',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api',
        status: 'success',
        apiResponse: { success: true, cardNumber: 'TH123456789' },
        processingTime: 2500,
        retryCount: 0,
        errorDetails: null,
        isSuperseded: false,
        supersededAt: null,
        supersededBy: null,
        supersededReason: null,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockedSecureStorage.getDigitalArrivalCard.mockResolvedValue(mockData);

      const loaded = await DigitalArrivalCard.load('dac_test_123');

      expect(loaded).toBeInstanceOf(DigitalArrivalCard);
      expect(loaded?.id).toBe('dac_test_123');
      expect(loaded?.cardType).toBe('TDAC');
      expect(loaded?.arrCardNo).toBe('TH123456789');
      expect(loaded?.apiResponse).toEqual({ success: true, cardNumber: 'TH123456789' });
    });

    test('should return null when loading non-existent card', async () => {
      mockedSecureStorage.getDigitalArrivalCard.mockResolvedValue(null);

      const loaded = await DigitalArrivalCard.load('non-existent-id');

      expect(loaded).toBeNull();
    });
  });

  describe('Query Operations', () => {
    test('should get all DigitalArrivalCards by entryInfoId', async () => {
      const mockCards = [
        {
          id: 'dac_1',
          entryInfoId: testEntryInfoId,
          cardType: 'TDAC',
          status: 'success',
          apiResponse: { success: true }
        },
        {
          id: 'dac_2',
          entryInfoId: testEntryInfoId,
          cardType: 'MDAC',
          status: 'success',
          apiResponse: { success: true }
        }
      ];

      mockedSecureStorage.getDigitalArrivalCardsByEntryInfoId.mockResolvedValue(mockCards);

      const cards = await DigitalArrivalCard.getByEntryInfoId(testEntryInfoId);

      expect(cards).toHaveLength(2);
      expect(cards[0]).toBeInstanceOf(DigitalArrivalCard);
      expect(cards[0].cardType).toBe('TDAC');
      expect(cards[1].cardType).toBe('MDAC');
    });

    test('should get latest successful DigitalArrivalCard by entryInfoId and cardType', async () => {
      const mockCard = {
        id: 'dac_latest',
        entryInfoId: testEntryInfoId,
        cardType: 'TDAC',
        status: 'success',
        submittedAt: new Date().toISOString(),
        apiResponse: { success: true, cardNumber: 'TH123456789' }
      };

      mockedSecureStorage.getLatestSuccessfulDigitalArrivalCard.mockResolvedValue(mockCard);

      const card = await DigitalArrivalCard.getLatestSuccessful(testEntryInfoId, 'TDAC');

      expect(card).toBeInstanceOf(DigitalArrivalCard);
      expect(card?.id).toBe('dac_latest');
      expect(card?.cardType).toBe('TDAC');
      expect(card?.status).toBe('success');
    });

    test('should return null when no successful card exists', async () => {
      mockedSecureStorage.getLatestSuccessfulDigitalArrivalCard.mockResolvedValue(null);

      const card = await DigitalArrivalCard.getLatestSuccessful(testEntryInfoId, 'TDAC');

      expect(card).toBeNull();
    });
  });

  describe('Superseding Logic', () => {
    test('should mark card as superseded', async () => {
      mockedSecureStorage.saveDigitalArrivalCard.mockResolvedValue({ id: testCard.id });

      const result = await testCard.markAsSuperseded('dac_new_123', 'User submitted updated information');

      expect(testCard.isSuperseded).toBe(true);
      expect(testCard.supersededBy).toBe('dac_new_123');
      expect(testCard.supersededReason).toBe('User submitted updated information');
      expect(testCard.supersededAt).toBeDefined();
      expect(mockedSecureStorage.saveDigitalArrivalCard).toHaveBeenCalled();
      expect(result).toEqual({ id: testCard.id });
    });
  });

  describe('Summary and Display', () => {
    test('should generate correct summary', () => {
      const summary = testCard.getSummary();

      expect(summary).toEqual({
        id: testCard.id,
        cardType: 'TDAC',
        destinationId: 'thailand',
        arrCardNo: 'TH123456789',
        status: 'success',
        submittedAt: testCard.submittedAt,
        isSuperseded: false,
        qrUri: 'https://example.com/qr/TH123456789',
        pdfUrl: 'https://example.com/pdf/TH123456789.pdf'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle failed card submission', () => {
      const failedCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        status: 'failed',
        errorDetails: { code: 'API_ERROR', message: 'Service unavailable' },
        retryCount: 2
      });

      expect(failedCard.status).toBe('failed');
      expect(failedCard.errorDetails).toEqual({ code: 'API_ERROR', message: 'Service unavailable' });
      expect(failedCard.retryCount).toBe(2);
    });

    test('should handle pending status', () => {
      const pendingCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        status: 'pending'
      });

      expect(pendingCard.status).toBe('pending');
    });
  });

  describe('Full Workflow Test', () => {
    test('should complete full TDAC submission workflow', async () => {
      const initialCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        status: 'pending'
      });

      mockedSecureStorage.saveDigitalArrivalCard.mockResolvedValue({ id: initialCard.id });

      await initialCard.save();

      initialCard.status = 'success';
      initialCard.arrCardNo = 'TH987654321';
      initialCard.qrUri = 'https://example.com/qr/TH987654321';
      initialCard.pdfUrl = 'https://example.com/pdf/TH987654321.pdf';
      initialCard.apiResponse = { success: true, cardNumber: 'TH987654321' };
      initialCard.processingTime = 1800;

      await initialCard.save();

      expect(initialCard.status).toBe('success');
      expect(initialCard.arrCardNo).toBe('TH987654321');
      expect(initialCard.processingTime).toBe(1800);

      const summary = initialCard.getSummary();
      expect(summary.status).toBe('success');
      expect(summary.arrCardNo).toBe('TH987654321');
      expect(summary.isSuperseded).toBe(false);
    });

    test('should handle card superseding workflow', async () => {
      const firstCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        status: 'success',
        arrCardNo: 'TH111111111'
      });

      const secondCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        status: 'success',
        arrCardNo: 'TH222222222'
      });

      mockedSecureStorage.saveDigitalArrivalCard
        .mockResolvedValueOnce({ id: firstCard.id })
        .mockResolvedValueOnce({ id: secondCard.id });

      await firstCard.save();
      await secondCard.save();

      await firstCard.markAsSuperseded(secondCard.id, 'User resubmitted with updated information');

      expect(firstCard.isSuperseded).toBe(true);
      expect(firstCard.supersededBy).toBe(secondCard.id);
      expect(firstCard.supersededReason).toBe('User resubmitted with updated information');
      expect(firstCard.supersededAt).toBeDefined();

      expect(secondCard.isSuperseded).toBe(false);
      expect(secondCard.supersededBy).toBeNull();
    });
  });
});

